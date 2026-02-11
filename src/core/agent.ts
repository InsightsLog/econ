import {
  AgentRole,
  AgentMessage,
  Artifact,
  ArtifactType,
  MessageType,
  ProjectState,
  Task,
  TaskStatus,
} from "./types";
import type { AgentContext } from "./context";
import type { ToolResult, ToolInput } from "./tools";
import type { MemoryEntry, MemoryQuery, MemoryType } from "./memory";
import type { SkillInput, SkillOutput } from "./skills";

/**
 * Base class for all AI agents on the team.
 *
 * Every agent has a role, a system prompt, capabilities, and the
 * ability to process tasks and produce artifacts. With the enhanced
 * system, agents also have access to:
 *
 * - **Tools**: invoke filesystem, shell, HTTP, code analysis, MCP tools
 * - **Memory**: working memory (per-task), episodic (session), semantic (persistent)
 * - **Skills**: composable, chainable operations with dependency resolution
 * - **Hooks**: lifecycle middleware (before/after execute, onError, etc.)
 * - **Context**: unified access to the full execution environment
 * - **Events**: publish/subscribe inter-agent communication bus
 * - **Knowledge Graph**: shared structured knowledge across the team
 */
export abstract class Agent {
  abstract readonly role: AgentRole;
  abstract readonly name: string;
  abstract readonly description: string;
  abstract readonly capabilities: string[];

  /** The agent's execution context — set by the pipeline before execution */
  protected context: AgentContext | null = null;

  // ─── Core Abstract Methods ────────────────────────────────────────

  /** Process a task and return artifacts */
  abstract execute(task: Task, state: ProjectState): Promise<Artifact[]>;

  /** Build the system prompt that defines this agent's persona */
  abstract getSystemPrompt(): string;

  // ─── Context Management ───────────────────────────────────────────

  /** Attach an execution context (called by the pipeline) */
  setContext(ctx: AgentContext): void {
    this.context = ctx;
  }

  /** Get the current context (throws if not set) */
  getContext(): AgentContext {
    if (!this.context) {
      throw new Error(`Agent "${this.role}" has no execution context. Was setContext() called?`);
    }
    return this.context;
  }

  /** Check if context is available */
  hasContext(): boolean {
    return this.context !== null;
  }

  // ─── Enhanced Execution ───────────────────────────────────────────

  /**
   * Execute a task with full hook lifecycle.
   * This wraps the abstract execute() with before/after hooks,
   * error handling, memory tracking, and event emission.
   *
   * The pipeline should call this instead of execute() directly.
   */
  async executeWithContext(task: Task, state: ProjectState): Promise<Artifact[]> {
    const ctx = this.context;

    // If no context, fall back to the basic execute
    if (!ctx) {
      return this.execute(task, state);
    }

    const start = Date.now();

    // Run beforeExecute hooks
    const beforeResult = await ctx.runHooks("beforeExecute", { task, state });
    if (beforeResult.aborted) {
      this.log("Task execution aborted by beforeExecute hook");
      return [];
    }

    // Store task info in working memory
    ctx.workingMemory.set("currentTask", task);
    ctx.workingMemory.set("taskStartTime", start);

    // Emit task start event
    await ctx.events.emit({
      type: "task:start",
      source: this.role,
      payload: { taskId: task.id, title: task.title },
      timestamp: Date.now(),
    });

    try {
      // Execute the actual task
      const artifacts = await this.execute(task, state);

      const duration = Date.now() - start;

      // Run afterExecute hooks
      await ctx.runHooks("afterExecute", { task, artifacts, duration, state });

      // Track artifacts in memory and knowledge graph
      for (const artifact of artifacts) {
        ctx.memory.rememberArtifact(this.role, artifact);
        await ctx.runHooks("onArtifact", { artifact, task });

        await ctx.events.emit({
          type: "artifact:created",
          source: this.role,
          payload: { artifactId: artifact.id, filePath: artifact.filePath, type: artifact.type },
          timestamp: Date.now(),
        });
      }

      // Record success in episodic memory
      ctx.memory.episodic.record({
        agentRole: this.role,
        type: "action",
        content: `Completed task "${task.title}" — produced ${artifacts.length} artifacts in ${duration}ms`,
        tags: ["task-complete", task.id, this.role],
        metadata: {
          taskId: task.id,
          artifactCount: artifacts.length,
          duration,
        },
      });

      // Emit task complete event
      await ctx.events.emit({
        type: "task:complete",
        source: this.role,
        payload: { taskId: task.id, artifactCount: artifacts.length, duration },
        timestamp: Date.now(),
      });

      // Clear working memory for next task
      ctx.memory.clearWorkingMemory(this.role);

      return artifacts;
    } catch (error) {
      const duration = Date.now() - start;
      const err = error instanceof Error ? error : new Error(String(error));

      // Run onError hooks
      await ctx.runHooks("onError", { error: err, task, recoverable: true });

      // Record error in memory
      ctx.memory.rememberError(this.role, err.message, {
        taskId: task.id,
        taskTitle: task.title,
        duration,
      });

      // Emit error event
      await ctx.events.emit({
        type: "task:error",
        source: this.role,
        payload: { taskId: task.id, error: err.message, duration },
        timestamp: Date.now(),
      });

      // Clear working memory
      ctx.memory.clearWorkingMemory(this.role);

      throw error;
    }
  }

  // ─── Tool Access ──────────────────────────────────────────────────

  /** Invoke a tool through the context */
  protected async useTool<T = unknown>(toolName: string, input: ToolInput): Promise<ToolResult<T>> {
    return this.getContext().useTool<T>(toolName, input);
  }

  // ─── Memory Access ────────────────────────────────────────────────

  /** Remember something across memory tiers */
  protected remember(type: MemoryType, content: string, tags: string[], metadata?: Record<string, unknown>): MemoryEntry {
    return this.getContext().remember(type, content, tags, metadata);
  }

  /** Query memory */
  protected recall(query: MemoryQuery): MemoryEntry[] {
    return this.getContext().recall(query);
  }

  // ─── Skill Access ─────────────────────────────────────────────────

  /** Invoke a skill */
  protected async useSkill(skillName: string, input: SkillInput): Promise<SkillOutput> {
    return this.getContext().useSkill(skillName, input);
  }

  // ─── Inter-agent Communication ────────────────────────────────────

  /** React to a message from another agent */
  async handleMessage(
    message: AgentMessage,
    state: ProjectState
  ): Promise<AgentMessage | null> {
    if (this.context) {
      // Track received message in memory
      this.context.memory.episodic.record({
        agentRole: this.role,
        type: "context",
        content: `Received ${message.type} from ${message.from}`,
        tags: ["message", message.type, message.from],
        metadata: { messageType: message.type, from: message.from },
      });

      await this.context.events.emit({
        type: "message:received",
        source: this.role,
        payload: message,
        timestamp: Date.now(),
      });
    }
    return null;
  }

  // ─── Artifact Creation ────────────────────────────────────────────

  protected createArtifact(
    type: ArtifactType,
    filePath: string,
    content: string,
    description: string
  ): Artifact {
    // If we have context, use the context's artifact creation (with memory + knowledge graph tracking)
    if (this.context) {
      return this.context.createArtifact(type, filePath, content, description);
    }

    // Fallback for when no context is set
    return {
      id: `${this.role}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      type,
      filePath,
      content,
      createdBy: this.role,
      description,
    };
  }

  // ─── Messaging ────────────────────────────────────────────────────

  protected sendMessage(
    to: AgentRole | "broadcast",
    type: MessageType,
    payload: unknown
  ): AgentMessage {
    const message: AgentMessage = {
      from: this.role,
      to,
      type,
      payload,
      timestamp: Date.now(),
    };

    // If we have context, use the event bus
    if (this.context) {
      this.context.events.emit({
        type: "message:sent",
        source: this.role,
        payload: message,
        timestamp: Date.now(),
      });
    }

    return message;
  }

  // ─── Task Helpers ─────────────────────────────────────────────────

  protected completeTask(task: Task, artifacts: Artifact[]): Task {
    return {
      ...task,
      status: TaskStatus.Done,
      artifacts: [...task.artifacts, ...artifacts],
    };
  }

  // ─── Logging ──────────────────────────────────────────────────────

  protected log(message: string): void {
    const timestamp = new Date().toISOString().slice(11, 19);
    console.log(`  [${timestamp}] [${this.name}] ${message}`);
  }

  // ─── Introspection ───────────────────────────────────────────────

  /** Get a summary of this agent's capabilities for other agents/tools */
  describe(): {
    role: AgentRole;
    name: string;
    description: string;
    capabilities: string[];
    hasContext: boolean;
    systemPrompt: string;
  } {
    return {
      role: this.role,
      name: this.name,
      description: this.description,
      capabilities: this.capabilities,
      hasContext: this.hasContext(),
      systemPrompt: this.getSystemPrompt(),
    };
  }
}
