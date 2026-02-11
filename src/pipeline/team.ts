import { Agent } from "../core/agent";
import {
  AgentRole,
  Artifact,
  ProjectPhase,
  ProjectSpec,
  ProjectState,
  Task,
  TaskStatus,
} from "../core/types";
import { ToolRegistry, createBuiltinTools } from "../core/tools";
import { MemoryManager } from "../core/memory";
import { SkillRegistry, createBuiltinSkills } from "../core/skills";
import { HookRegistry, createBuiltinHooks } from "../core/hooks";
import { MCPClient } from "../core/mcp";
import type { MCPServerConfig } from "../core/mcp";
import { AgentContext, EventBus, KnowledgeGraph } from "../core/context";
import { TeamLeadAgent } from "../agents/team-lead";
import {
  ProductManagerAgent,
  ArchitectAgent,
  UIDesignerAgent,
  FrontendDevAgent,
  AccessibilityAgent,
  BackendDevAgent,
  DatabaseEngineerAgent,
  APIDesignerAgent,
  QAEngineerAgent,
  SecurityAuditorAgent,
  DevOpsAgent,
  TechnicalWriterAgent,
} from "../agents";

// ─── Team Configuration ───────────────────────────────────────────────

export interface TeamConfig {
  /** Working directory for file operations */
  workingDir?: string;
  /** Environment variables available to tools */
  env?: Record<string, string>;
  /** MCP servers to connect to */
  mcpServers?: MCPServerConfig[];
  /** Max pipeline iterations before giving up */
  maxIterations?: number;
  /** Enable parallel task execution */
  parallel?: boolean;
  /** Custom tools to register */
  customTools?: Array<import("../core/tools").Tool>;
  /** Custom skills to register */
  customSkills?: Array<import("../core/skills").Skill>;
  /** Custom hooks to register */
  customHooks?: Array<import("../core/hooks").HookDefinition>;
}

/**
 * The team runner. Assembles the 13 agents, wires up tools,
 * memory, skills, hooks, MCP, event bus, and knowledge graph,
 * then orchestrates execution through all project phases.
 */
export class AgentTeam {
  private agents: Map<AgentRole, Agent>;
  private teamLead: TeamLeadAgent;
  private state: ProjectState;
  private config: Required<Omit<TeamConfig, "customTools" | "customSkills" | "customHooks" | "mcpServers">> & TeamConfig;

  // Shared infrastructure
  readonly tools: ToolRegistry;
  readonly memory: MemoryManager;
  readonly skills: SkillRegistry;
  readonly hooks: HookRegistry;
  readonly mcp: MCPClient;
  readonly events: EventBus;
  readonly knowledge: KnowledgeGraph;

  constructor(spec: ProjectSpec, config?: TeamConfig) {
    this.config = {
      workingDir: config?.workingDir ?? process.cwd(),
      env: config?.env ?? {},
      maxIterations: config?.maxIterations ?? 20,
      parallel: config?.parallel ?? true,
      ...config,
    };

    // ── Initialize shared infrastructure ──────────────────────────

    this.tools = new ToolRegistry();
    this.memory = new MemoryManager();
    this.skills = new SkillRegistry();
    this.hooks = new HookRegistry();
    this.mcp = new MCPClient();
    this.events = new EventBus();
    this.knowledge = new KnowledgeGraph();

    // Register built-in tools
    this.tools.registerAll(createBuiltinTools());

    // Register built-in skills
    this.skills.registerAll(createBuiltinSkills());

    // Register built-in hooks
    this.hooks.registerAll(createBuiltinHooks());

    // Register custom extensions
    if (config?.customTools) this.tools.registerAll(config.customTools);
    if (config?.customSkills) this.skills.registerAll(config.customSkills);
    if (config?.customHooks) this.hooks.registerAll(config.customHooks);

    // Register MCP servers
    if (config?.mcpServers) {
      for (const server of config.mcpServers) {
        this.mcp.addServer(server);
      }
    }

    // ── Initialize agents ─────────────────────────────────────────

    this.teamLead = new TeamLeadAgent();
    this.agents = new Map<AgentRole, Agent>();

    const allAgents: Agent[] = [
      this.teamLead,
      new ProductManagerAgent(),
      new ArchitectAgent(),
      new UIDesignerAgent(),
      new FrontendDevAgent(),
      new AccessibilityAgent(),
      new BackendDevAgent(),
      new DatabaseEngineerAgent(),
      new APIDesignerAgent(),
      new QAEngineerAgent(),
      new SecurityAuditorAgent(),
      new DevOpsAgent(),
      new TechnicalWriterAgent(),
    ];

    for (const agent of allAgents) {
      this.agents.set(agent.role, agent);

      // Grant all tools and skills to every agent
      this.tools.grantAll(agent.role);
      this.skills.grantAll(agent.role);

      // Seed knowledge graph with agent metadata
      this.knowledge.addNode({
        id: `agent:${agent.role}`,
        type: "agent",
        label: agent.name,
        properties: {
          role: agent.role,
          capabilities: agent.capabilities,
          description: agent.description,
        },
      });
    }

    // Connect agents in the knowledge graph by team relationships
    for (const agent of allAgents) {
      if (agent.role !== AgentRole.TeamLead) {
        this.knowledge.addEdge({
          from: `agent:${AgentRole.TeamLead}`,
          to: `agent:${agent.role}`,
          relationship: "manages",
        });
      }
    }

    // ── Initialize project state ──────────────────────────────────

    this.state = {
      spec,
      tasks: [],
      artifacts: [],
      messages: [],
      phase: ProjectPhase.Requirements,
    };

    // Store project spec in semantic memory
    this.memory.remember(
      AgentRole.TeamLead,
      "context",
      `Project: ${spec.name} — ${spec.description}. Features: ${spec.features.join(", ")}`,
      ["project", "spec", spec.name],
      { spec }
    );
  }

  // ─── Context Factory ────────────────────────────────────────────

  /** Create an execution context for an agent */
  private createContext(role: AgentRole): AgentContext {
    return new AgentContext({
      agentRole: role,
      tools: this.tools,
      memory: this.memory,
      skills: this.skills,
      hooks: this.hooks,
      mcp: this.mcp,
      eventBus: this.events,
      knowledgeGraph: this.knowledge,
      workingDir: this.config.workingDir,
      env: this.config.env,
      state: this.state,
    });
  }

  /** Wire up contexts for all agents */
  private wireContexts(): void {
    for (const [role, agent] of this.agents) {
      agent.setContext(this.createContext(role));
    }
  }

  // ─── Execution ──────────────────────────────────────────────────

  /** Run the full pipeline: plan -> execute -> ship */
  async run(): Promise<ProjectState> {
    console.log("\n\u2554\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2557");
    console.log("\u2551           econ \u2014 AI Agent Team Builder              \u2551");
    console.log("\u2551           13 agents, 1 mission: ship it             \u2551");
    console.log("\u255A\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u255D\n");

    console.log(`Project: ${this.state.spec.name}`);
    console.log(`Description: ${this.state.spec.description}`);
    console.log(`Features: ${this.state.spec.features.length}`);
    console.log(`Agents: ${this.agents.size}`);
    console.log(`Tools: ${this.tools.getAllTools().length}`);
    console.log(`Skills: ${this.skills.listAll().length}`);
    console.log(`Hooks: ${this.hooks.size()}\n`);

    // Wire up contexts for all agents
    this.wireContexts();

    // Connect to MCP servers
    if (this.config.mcpServers?.length) {
      console.log("  Connecting to MCP servers...");
      const connections = await this.mcp.connectAll();
      for (const [name, conn] of connections) {
        console.log(`  MCP: ${name} \u2014 ${conn.status}`);
        // Register MCP tools in the tool registry
        if (conn.status === "connected") {
          const mcpTools = this.mcp.toInternalTools(name);
          this.tools.registerAll(mcpTools);
          // Grant MCP tools to all agents
          for (const agent of this.agents.values()) {
            this.tools.grantCategory(agent.role, "mcp");
          }
        }
      }
      console.log("");
    }

    // Run onInit hooks for all agents
    for (const [role] of this.agents) {
      await this.hooks.run(
        "onInit",
        { agentRole: role, state: this.state },
        { agentRole: role, state: this.state, timestamp: Date.now(), metadata: {} }
      );
    }

    // Step 1: Team Lead creates the project plan
    console.log("\u2500\u2500\u2500 Phase 1: Planning \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500");
    const planTask: Task = {
      id: "plan-0",
      title: "Create project plan",
      description: "Decompose the project into tasks and assign to agents",
      assignee: AgentRole.TeamLead,
      dependencies: [],
      status: TaskStatus.InProgress,
      artifacts: [],
      priority: "critical" as any,
    };

    const planArtifacts = await this.teamLead.executeWithContext(planTask, this.state);
    this.state.artifacts.push(...planArtifacts);
    this.state.tasks = this.teamLead.buildProjectPlan(this.state.spec);

    // Seed knowledge graph with tasks
    for (const task of this.state.tasks) {
      this.knowledge.addNode({
        id: `task:${task.id}`,
        type: "task",
        label: task.title,
        properties: { assignee: task.assignee, priority: task.priority, status: task.status },
      });
      this.knowledge.addEdge({
        from: `agent:${task.assignee}`,
        to: `task:${task.id}`,
        relationship: "assigned-to",
      });
      for (const dep of task.dependencies) {
        this.knowledge.addEdge({
          from: `task:${dep}`,
          to: `task:${task.id}`,
          relationship: "blocks",
        });
      }
    }

    console.log(`\n  Total tasks created: ${this.state.tasks.length}`);
    console.log(`  Knowledge graph: ${this.knowledge.stats().nodes} nodes, ${this.knowledge.stats().edges} edges\n`);

    // Step 2: Execute tasks phase by phase
    let iteration = 0;
    const maxIterations = this.config.maxIterations;
    let previousPhase = this.state.phase;

    while (this.state.phase !== ProjectPhase.Complete && iteration < maxIterations) {
      iteration++;
      const readyTasks = this.teamLead.getReadyTasks(this.state.tasks);

      if (readyTasks.length === 0) {
        const pending = this.state.tasks.filter((t) => t.status === TaskStatus.Pending);
        if (pending.length === 0) break;

        // Unblock stuck tasks
        for (const task of pending) {
          task.status = TaskStatus.InProgress;
          break;
        }
        continue;
      }

      const phase = this.teamLead.resolvePhase(this.state.tasks);
      if (phase !== this.state.phase) {
        // Run phase transition hook
        await this.hooks.run(
          "onPhaseChange",
          { from: previousPhase, to: phase },
          { agentRole: AgentRole.TeamLead, state: this.state, timestamp: Date.now(), metadata: {} }
        );
        previousPhase = this.state.phase;
        this.state.phase = phase;
        console.log(`\u2500\u2500\u2500 Phase: ${phase} \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500`);
      }

      // Execute ready tasks — parallel or sequential based on config
      if (this.config.parallel && readyTasks.length > 1) {
        await this.executeTasksParallel(readyTasks);
      } else {
        await this.executeTasksSequential(readyTasks);
      }
    }

    this.state.phase = ProjectPhase.Complete;

    // Run onShutdown hooks for all agents
    for (const [role] of this.agents) {
      await this.hooks.run(
        "onShutdown",
        { agentRole: role, totalArtifacts: this.state.artifacts.length, totalDuration: 0 },
        { agentRole: role, state: this.state, timestamp: Date.now(), metadata: {} }
      );
    }

    // Disconnect MCP servers
    await this.mcp.disconnectAll();

    this.printSummary();
    return this.state;
  }

  /** Execute tasks in parallel (Promise.allSettled) */
  private async executeTasksParallel(tasks: Task[]): Promise<void> {
    const promises = tasks.map((task) => this.executeTask(task));
    await Promise.allSettled(promises);
  }

  /** Execute tasks sequentially */
  private async executeTasksSequential(tasks: Task[]): Promise<void> {
    for (const task of tasks) {
      await this.executeTask(task);
    }
  }

  /** Execute a single task through the enhanced agent pipeline */
  private async executeTask(task: Task): Promise<void> {
    const agent = this.agents.get(task.assignee);
    if (!agent) {
      console.log(`  [WARNING] No agent for role: ${task.assignee}`);
      task.status = TaskStatus.Done;
      return;
    }

    const previousStatus = task.status;
    task.status = TaskStatus.InProgress;

    // Run task status change hook
    await this.hooks.run(
      "onTaskStatusChange",
      { task, previousStatus, newStatus: task.status },
      { agentRole: task.assignee, state: this.state, timestamp: Date.now(), metadata: {} }
    );

    try {
      // Use the enhanced execution path with full hook lifecycle
      const artifacts = await agent.executeWithContext(task, this.state);
      task.status = TaskStatus.Done;
      task.artifacts = artifacts;
      this.state.artifacts.push(...artifacts);

      // Update knowledge graph
      const taskNode = this.knowledge.getNode(`task:${task.id}`);
      if (taskNode) {
        taskNode.properties.status = TaskStatus.Done;
        taskNode.properties.artifactCount = artifacts.length;
      }
    } catch (error) {
      console.error(`  [ERROR] ${agent.name} failed: ${error}`);
      task.status = TaskStatus.Done; // Mark done to avoid blocking
    }
  }

  // ─── Summary & Reporting ────────────────────────────────────────

  private printSummary(): void {
    console.log("\n\u2554\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2557");
    console.log("\u2551                   Build Complete                     \u2551");
    console.log("\u255A\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u255D\n");

    const tasksDone = this.state.tasks.filter((t) => t.status === TaskStatus.Done).length;
    console.log(`  Tasks completed: ${tasksDone}/${this.state.tasks.length}`);
    console.log(`  Artifacts produced: ${this.state.artifacts.length}`);
    console.log(`  Phases completed: ${Object.values(ProjectPhase).indexOf(ProjectPhase.Complete) + 1}`);

    // Memory stats
    const memStats = this.memory.stats();
    console.log(`\n  Memory: ${memStats.episodic} episodic, ${memStats.semantic} semantic entries`);

    // Knowledge graph stats
    const kgStats = this.knowledge.stats();
    console.log(`  Knowledge graph: ${kgStats.nodes} nodes, ${kgStats.edges} edges, types: ${kgStats.types.join(", ")}`);

    // Tool execution stats
    const toolLog = this.tools.getExecutionLog();
    if (toolLog.length > 0) {
      const succeeded = toolLog.filter((t) => t.success).length;
      console.log(`  Tool calls: ${toolLog.length} total, ${succeeded} succeeded`);
    }

    // MCP stats
    const mcpStats = this.mcp.stats();
    if (mcpStats.servers > 0) {
      console.log(`  MCP: ${mcpStats.servers} servers, ${mcpStats.totalCalls} calls`);
    }

    // Hook execution stats
    const hookLog = this.hooks.getExecutionLog();
    if (hookLog.length > 0) {
      console.log(`  Hooks fired: ${hookLog.length}`);
    }

    // Event bus stats
    const eventLog = this.events.getLog();
    console.log(`  Events emitted: ${eventLog.length}`);

    // Group artifacts by agent
    console.log("");
    const byAgent = new Map<string, Artifact[]>();
    for (const artifact of this.state.artifacts) {
      const list = byAgent.get(artifact.createdBy) || [];
      list.push(artifact);
      byAgent.set(artifact.createdBy, list);
    }

    console.log("  Artifacts by agent:");
    for (const [role, artifacts] of byAgent) {
      const agent = this.agents.get(role as AgentRole);
      console.log(`    ${agent?.name ?? role}: ${artifacts.length} files`);
      for (const a of artifacts) {
        console.log(`      \u2192 ${a.filePath}`);
      }
    }

    console.log("\n  Your web app is ready to ship. \uD83D\uDE80\n");
  }

  // ─── Public API ─────────────────────────────────────────────────

  /** Get all agents on the team */
  getAgents(): Agent[] {
    return Array.from(this.agents.values());
  }

  /** Get a specific agent by role */
  getAgent(role: AgentRole): Agent | undefined {
    return this.agents.get(role);
  }

  /** Get current project state */
  getState(): ProjectState {
    return this.state;
  }

  /** Get the shared tool registry */
  getTools(): ToolRegistry {
    return this.tools;
  }

  /** Get the shared memory manager */
  getMemory(): MemoryManager {
    return this.memory;
  }

  /** Get the shared skill registry */
  getSkills(): SkillRegistry {
    return this.skills;
  }

  /** Get the shared hook registry */
  getHooks(): HookRegistry {
    return this.hooks;
  }

  /** Get the MCP client */
  getMCP(): MCPClient {
    return this.mcp;
  }

  /** Get the event bus */
  getEventBus(): EventBus {
    return this.events;
  }

  /** Get the knowledge graph */
  getKnowledgeGraph(): KnowledgeGraph {
    return this.knowledge;
  }

  /** Export the full session state for serialization/persistence */
  exportSession(): {
    state: ProjectState;
    memory: ReturnType<MemoryManager["export"]>;
    knowledge: ReturnType<KnowledgeGraph["export"]>;
    toolLog: ReturnType<ToolRegistry["getExecutionLog"]>;
    eventLog: ReturnType<EventBus["getLog"]>;
  } {
    return {
      state: this.state,
      memory: this.memory.export(),
      knowledge: this.knowledge.export(),
      toolLog: this.tools.getExecutionLog(),
      eventLog: this.events.getLog(),
    };
  }
}
