/**
 * Agent Context — Rich execution environment for agents.
 *
 * The AgentContext is the "world" that an agent operates in during
 * task execution. It provides unified access to:
 * - Tools (via ToolRegistry)
 * - Memory (via MemoryManager)
 * - Skills (via SkillRegistry)
 * - Hooks (via HookRegistry)
 * - MCP servers (via MCPClient)
 * - Project state and workspace
 * - Inter-agent communication bus
 * - Shared knowledge graph
 */

import type {
  AgentRole,
  AgentMessage,
  Artifact,
  ArtifactType,
  MessageType,
  ProjectState,
  Task,
} from "./types";
import type { ToolRegistry, ToolResult, ToolInput } from "./tools";
import type { MemoryManager, MemoryType, MemoryEntry, MemoryQuery } from "./memory";
import type { SkillRegistry, SkillInput, SkillOutput } from "./skills";
import type { HookRegistry, HookContext, HookStage } from "./hooks";
import type { MCPClient } from "./mcp";

// ─── Event Bus ────────────────────────────────────────────────────────

export type EventType =
  | "task:start"
  | "task:complete"
  | "task:error"
  | "artifact:created"
  | "message:sent"
  | "message:received"
  | "phase:changed"
  | "tool:called"
  | "skill:invoked"
  | "agent:init"
  | "agent:shutdown"
  | "custom";

export interface BusEvent {
  type: EventType;
  source: AgentRole;
  payload: unknown;
  timestamp: number;
}

export type EventHandler = (event: BusEvent) => void | Promise<void>;

export class EventBus {
  private handlers = new Map<EventType, EventHandler[]>();
  private allHandlers: EventHandler[] = [];
  private eventLog: BusEvent[] = [];

  /** Subscribe to a specific event type */
  on(type: EventType, handler: EventHandler): () => void {
    const list = this.handlers.get(type) ?? [];
    list.push(handler);
    this.handlers.set(type, list);
    return () => {
      const idx = list.indexOf(handler);
      if (idx >= 0) list.splice(idx, 1);
    };
  }

  /** Subscribe to all events */
  onAny(handler: EventHandler): () => void {
    this.allHandlers.push(handler);
    return () => {
      const idx = this.allHandlers.indexOf(handler);
      if (idx >= 0) this.allHandlers.splice(idx, 1);
    };
  }

  /** Emit an event to all subscribers */
  async emit(event: BusEvent): Promise<void> {
    this.eventLog.push(event);

    const handlers = [
      ...(this.handlers.get(event.type) ?? []),
      ...this.allHandlers,
    ];

    for (const handler of handlers) {
      try {
        await handler(event);
      } catch (err) {
        // Event handlers should not crash the system
        console.error(
          `Event handler error for "${event.type}":`,
          err instanceof Error ? err.message : err
        );
      }
    }
  }

  /** Get event history */
  getLog(): BusEvent[] {
    return [...this.eventLog];
  }

  /** Get events of a specific type */
  getEvents(type: EventType): BusEvent[] {
    return this.eventLog.filter((e) => e.type === type);
  }

  /** Clear event log */
  clearLog(): void {
    this.eventLog = [];
  }
}

// ─── Knowledge Graph ──────────────────────────────────────────────────

export interface KnowledgeNode {
  id: string;
  type: string; // "file", "function", "type", "endpoint", "decision", etc.
  label: string;
  properties: Record<string, unknown>;
}

export interface KnowledgeEdge {
  from: string;
  to: string;
  relationship: string; // "imports", "calls", "implements", "depends-on", etc.
  properties?: Record<string, unknown>;
}

/**
 * Simple in-memory knowledge graph for the agent team.
 * Nodes are entities (files, functions, types, decisions),
 * edges are relationships between them.
 */
export class KnowledgeGraph {
  private nodes = new Map<string, KnowledgeNode>();
  private edges: KnowledgeEdge[] = [];
  private adjacency = new Map<string, Set<string>>(); // node ID -> connected node IDs

  /** Add a node to the graph */
  addNode(node: KnowledgeNode): void {
    this.nodes.set(node.id, node);
    if (!this.adjacency.has(node.id)) {
      this.adjacency.set(node.id, new Set());
    }
  }

  /** Add an edge between two nodes */
  addEdge(edge: KnowledgeEdge): void {
    this.edges.push(edge);
    const fromAdj = this.adjacency.get(edge.from) ?? new Set();
    fromAdj.add(edge.to);
    this.adjacency.set(edge.from, fromAdj);
    const toAdj = this.adjacency.get(edge.to) ?? new Set();
    toAdj.add(edge.from);
    this.adjacency.set(edge.to, toAdj);
  }

  /** Get a node by ID */
  getNode(id: string): KnowledgeNode | undefined {
    return this.nodes.get(id);
  }

  /** Find nodes by type */
  findByType(type: string): KnowledgeNode[] {
    return Array.from(this.nodes.values()).filter((n) => n.type === type);
  }

  /** Find nodes matching a label query */
  search(query: string): KnowledgeNode[] {
    const lower = query.toLowerCase();
    return Array.from(this.nodes.values()).filter(
      (n) =>
        n.label.toLowerCase().includes(lower) ||
        n.type.toLowerCase().includes(lower)
    );
  }

  /** Get all edges from a node */
  getEdgesFrom(nodeId: string): KnowledgeEdge[] {
    return this.edges.filter((e) => e.from === nodeId);
  }

  /** Get all edges to a node */
  getEdgesTo(nodeId: string): KnowledgeEdge[] {
    return this.edges.filter((e) => e.to === nodeId);
  }

  /** Get connected nodes (neighbors) */
  getNeighbors(nodeId: string): KnowledgeNode[] {
    const adjacent = this.adjacency.get(nodeId);
    if (!adjacent) return [];
    return Array.from(adjacent)
      .map((id) => this.nodes.get(id)!)
      .filter(Boolean);
  }

  /** Get the shortest path between two nodes (BFS) */
  findPath(fromId: string, toId: string): string[] | null {
    if (fromId === toId) return [fromId];
    const visited = new Set<string>();
    const queue: Array<{ id: string; path: string[] }> = [{ id: fromId, path: [fromId] }];

    while (queue.length > 0) {
      const { id, path } = queue.shift()!;
      if (visited.has(id)) continue;
      visited.add(id);

      const neighbors = this.adjacency.get(id);
      if (!neighbors) continue;

      for (const neighbor of neighbors) {
        if (neighbor === toId) return [...path, neighbor];
        if (!visited.has(neighbor)) {
          queue.push({ id: neighbor, path: [...path, neighbor] });
        }
      }
    }

    return null;
  }

  /** Get subgraph around a node (N hops) */
  getSubgraph(
    nodeId: string,
    hops: number = 2
  ): { nodes: KnowledgeNode[]; edges: KnowledgeEdge[] } {
    const visited = new Set<string>();
    const queue: Array<{ id: string; depth: number }> = [{ id: nodeId, depth: 0 }];
    const resultNodes: KnowledgeNode[] = [];

    while (queue.length > 0) {
      const { id, depth } = queue.shift()!;
      if (visited.has(id) || depth > hops) continue;
      visited.add(id);

      const node = this.nodes.get(id);
      if (node) resultNodes.push(node);

      if (depth < hops) {
        const neighbors = this.adjacency.get(id);
        if (neighbors) {
          for (const neighbor of neighbors) {
            if (!visited.has(neighbor)) {
              queue.push({ id: neighbor, depth: depth + 1 });
            }
          }
        }
      }
    }

    const resultEdges = this.edges.filter(
      (e) => visited.has(e.from) && visited.has(e.to)
    );

    return { nodes: resultNodes, edges: resultEdges };
  }

  /** Stats */
  stats(): { nodes: number; edges: number; types: string[] } {
    const types = new Set<string>();
    this.nodes.forEach((n) => types.add(n.type));
    return {
      nodes: this.nodes.size,
      edges: this.edges.length,
      types: Array.from(types),
    };
  }

  /** Export the graph for serialization */
  export(): { nodes: KnowledgeNode[]; edges: KnowledgeEdge[] } {
    return {
      nodes: Array.from(this.nodes.values()),
      edges: [...this.edges],
    };
  }

  /** Import from serialized data */
  import(data: { nodes: KnowledgeNode[]; edges: KnowledgeEdge[] }): void {
    for (const node of data.nodes) this.addNode(node);
    for (const edge of data.edges) this.addEdge(edge);
  }
}

// ─── Agent Context ────────────────────────────────────────────────────

export interface AgentContextConfig {
  agentRole: AgentRole;
  tools: ToolRegistry;
  memory: MemoryManager;
  skills: SkillRegistry;
  hooks: HookRegistry;
  mcp: MCPClient;
  eventBus: EventBus;
  knowledgeGraph: KnowledgeGraph;
  workingDir: string;
  env: Record<string, string>;
  state: ProjectState;
}

/**
 * The unified execution context for an agent.
 * All agent operations flow through this context.
 */
export class AgentContext {
  readonly role: AgentRole;
  readonly tools: ToolRegistry;
  readonly memory: MemoryManager;
  readonly skills: SkillRegistry;
  readonly hooks: HookRegistry;
  readonly mcp: MCPClient;
  readonly events: EventBus;
  readonly knowledge: KnowledgeGraph;
  readonly workingDir: string;
  readonly env: Record<string, string>;
  private _state: ProjectState;

  constructor(config: AgentContextConfig) {
    this.role = config.agentRole;
    this.tools = config.tools;
    this.memory = config.memory;
    this.skills = config.skills;
    this.hooks = config.hooks;
    this.mcp = config.mcp;
    this.events = config.eventBus;
    this.knowledge = config.knowledgeGraph;
    this.workingDir = config.workingDir;
    this.env = config.env;
    this._state = config.state;
  }

  /** Get the current project state */
  get state(): ProjectState {
    return this._state;
  }

  /** Update the project state */
  updateState(state: ProjectState): void {
    this._state = state;
  }

  // ── Convenience: Tool execution ──────────────────────────────────

  /** Execute a tool with full context */
  async useTool<T = unknown>(toolName: string, input: ToolInput): Promise<ToolResult<T>> {
    // Run beforeToolCall hooks
    const hookCtx = this.hookContext();
    await this.hooks.run("beforeToolCall", { toolName, input }, hookCtx);

    const result = await this.tools.execute<T>(toolName, input, {
      agentRole: this.role,
      workingDir: this.workingDir,
      env: this.env,
    });

    // Run afterToolCall hooks
    await this.hooks.run(
      "afterToolCall",
      { toolName, input, result: { success: result.success, duration: result.duration, error: result.error } },
      hookCtx
    );

    // Emit event
    await this.events.emit({
      type: "tool:called",
      source: this.role,
      payload: { toolName, success: result.success, duration: result.duration },
      timestamp: Date.now(),
    });

    return result;
  }

  // ── Convenience: Memory ──────────────────────────────────────────

  /** Remember something in both episodic and semantic memory */
  remember(type: MemoryType, content: string, tags: string[], metadata?: Record<string, unknown>): MemoryEntry {
    return this.memory.remember(this.role, type, content, tags, metadata);
  }

  /** Query memory across all tiers */
  recall(query: MemoryQuery): MemoryEntry[] {
    return this.memory.recall(query);
  }

  /** Get working memory for this agent */
  get workingMemory() {
    return this.memory.getWorkingMemory(this.role);
  }

  // ── Convenience: Skills ──────────────────────────────────────────

  /** Invoke a skill */
  async useSkill(skillName: string, input: SkillInput): Promise<SkillOutput> {
    const result = await this.skills.execute(skillName, input, {
      agentRole: this.role,
      tools: this.tools,
      memory: this.memory,
      skills: this.skills,
      workingDir: this.workingDir,
      log: (msg: string) => this.log(msg),
    });

    await this.events.emit({
      type: "skill:invoked",
      source: this.role,
      payload: { skillName, success: result.success, duration: result.duration },
      timestamp: Date.now(),
    });

    return result;
  }

  // ── Convenience: Hooks ───────────────────────────────────────────

  /** Run hooks for a given stage */
  async runHooks<T>(stage: HookStage, payload: T) {
    return this.hooks.run(stage, payload, this.hookContext());
  }

  /** Get the hook context for this agent */
  hookContext(): HookContext {
    return {
      agentRole: this.role,
      state: this._state,
      timestamp: Date.now(),
      metadata: {},
    };
  }

  // ── Convenience: Communication ───────────────────────────────────

  /** Send a message to another agent (or broadcast) */
  async sendMessage(
    to: AgentRole | "broadcast",
    type: MessageType,
    payload: unknown
  ): Promise<AgentMessage> {
    const message: AgentMessage = {
      from: this.role,
      to,
      type,
      payload,
      timestamp: Date.now(),
    };

    this._state.messages.push(message);

    await this.events.emit({
      type: "message:sent",
      source: this.role,
      payload: message,
      timestamp: Date.now(),
    });

    return message;
  }

  /** Get messages sent to this agent */
  getMessages(): AgentMessage[] {
    return this._state.messages.filter(
      (m) => m.to === this.role || m.to === "broadcast"
    );
  }

  /** Get unread messages (since a timestamp) */
  getMessagesSince(since: number): AgentMessage[] {
    return this.getMessages().filter((m) => m.timestamp > since);
  }

  // ── Convenience: Knowledge Graph ─────────────────────────────────

  /** Add a fact to the knowledge graph */
  addKnowledge(
    id: string,
    type: string,
    label: string,
    properties?: Record<string, unknown>
  ): void {
    this.knowledge.addNode({ id, type, label, properties: properties ?? {} });
  }

  /** Connect two knowledge nodes */
  connectKnowledge(fromId: string, toId: string, relationship: string): void {
    this.knowledge.addEdge({ from: fromId, to: toId, relationship });
  }

  /** Search knowledge graph */
  searchKnowledge(query: string): KnowledgeNode[] {
    return this.knowledge.search(query);
  }

  // ── Logging ──────────────────────────────────────────────────────

  /** Log a message with timestamp and agent role */
  log(message: string): void {
    const timestamp = new Date().toISOString().slice(11, 19);
    console.log(`  [${timestamp}] [${this.role}] ${message}`);
  }

  // ── Artifact Helpers ─────────────────────────────────────────────

  /** Create and track an artifact */
  createArtifact(
    type: ArtifactType,
    filePath: string,
    content: string,
    description: string
  ): Artifact {
    const artifact: Artifact = {
      id: `${this.role}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      type,
      filePath,
      content,
      createdBy: this.role,
      description,
    };

    // Track in memory
    this.memory.rememberArtifact(this.role, artifact);

    // Add to knowledge graph
    this.knowledge.addNode({
      id: `artifact:${artifact.id}`,
      type: "artifact",
      label: filePath,
      properties: { artifactType: type, description, createdBy: this.role },
    });

    return artifact;
  }
}
