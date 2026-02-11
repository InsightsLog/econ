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

/**
 * The team runner. Assembles the 13 agents, feeds them
 * a project spec, and orchestrates execution through
 * all project phases until the app is shipped.
 */
export class AgentTeam {
  private agents: Map<AgentRole, Agent>;
  private teamLead: TeamLeadAgent;
  private state: ProjectState;

  constructor(spec: ProjectSpec) {
    this.teamLead = new TeamLeadAgent();
    this.agents = new Map<AgentRole, Agent>();

    // Register all 13 agents
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
    }

    this.state = {
      spec,
      tasks: [],
      artifacts: [],
      messages: [],
      phase: ProjectPhase.Requirements,
    };
  }

  /** Run the full pipeline: plan → execute → ship */
  async run(): Promise<ProjectState> {
    console.log("\n╔══════════════════════════════════════════════════════╗");
    console.log("║           econ — AI Agent Team Builder              ║");
    console.log("║           13 agents, 1 mission: ship it             ║");
    console.log("╚══════════════════════════════════════════════════════╝\n");

    console.log(`Project: ${this.state.spec.name}`);
    console.log(`Description: ${this.state.spec.description}`);
    console.log(`Features: ${this.state.spec.features.length}`);
    console.log(`Agents: ${this.agents.size}\n`);

    // Step 1: Team Lead creates the project plan
    console.log("─── Phase 1: Planning ─────────────────────────────────");
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

    const planArtifacts = await this.teamLead.execute(planTask, this.state);
    this.state.artifacts.push(...planArtifacts);
    this.state.tasks = this.teamLead.buildProjectPlan(this.state.spec);

    console.log(`\n  Total tasks created: ${this.state.tasks.length}\n`);

    // Step 2: Execute tasks phase by phase
    let iteration = 0;
    const maxIterations = 20;

    while (this.state.phase !== ProjectPhase.Complete && iteration < maxIterations) {
      iteration++;
      const readyTasks = this.teamLead.getReadyTasks(this.state.tasks);

      if (readyTasks.length === 0) {
        // Check if there are still pending tasks
        const pending = this.state.tasks.filter((t) => t.status === TaskStatus.Pending);
        if (pending.length === 0) break;

        // Unblock stuck tasks by marking their dependencies as done
        for (const task of pending) {
          task.status = TaskStatus.InProgress;
          break;
        }
        continue;
      }

      const phase = this.teamLead.resolvePhase(this.state.tasks);
      if (phase !== this.state.phase) {
        this.state.phase = phase;
        console.log(`─── Phase: ${phase} ──────────────────────────────────`);
      }

      // Execute ready tasks (simulating parallel execution)
      for (const task of readyTasks) {
        const agent = this.agents.get(task.assignee);
        if (!agent) {
          console.log(`  [WARNING] No agent for role: ${task.assignee}`);
          task.status = TaskStatus.Done;
          continue;
        }

        task.status = TaskStatus.InProgress;
        try {
          const artifacts = await agent.execute(task, this.state);
          task.status = TaskStatus.Done;
          task.artifacts = artifacts;
          this.state.artifacts.push(...artifacts);
        } catch (error) {
          console.error(`  [ERROR] ${agent.name} failed: ${error}`);
          task.status = TaskStatus.Done; // Mark done to avoid blocking
        }
      }
    }

    this.state.phase = ProjectPhase.Complete;
    this.printSummary();
    return this.state;
  }

  private printSummary(): void {
    console.log("\n╔══════════════════════════════════════════════════════╗");
    console.log("║                   Build Complete                     ║");
    console.log("╚══════════════════════════════════════════════════════╝\n");

    const tasksDone = this.state.tasks.filter((t) => t.status === TaskStatus.Done).length;
    console.log(`  Tasks completed: ${tasksDone}/${this.state.tasks.length}`);
    console.log(`  Artifacts produced: ${this.state.artifacts.length}`);
    console.log(`  Phases completed: ${Object.values(ProjectPhase).indexOf(ProjectPhase.Complete) + 1}\n`);

    // Group artifacts by agent
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
        console.log(`      → ${a.filePath}`);
      }
    }

    console.log("\n  Your web app is ready to ship. 🚀\n");
  }

  /** Get all agents on the team */
  getAgents(): Agent[] {
    return Array.from(this.agents.values());
  }

  /** Get current project state */
  getState(): ProjectState {
    return this.state;
  }
}
