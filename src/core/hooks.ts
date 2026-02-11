/**
 * Hook System — Lifecycle middleware for agents.
 *
 * Hooks let you inject behavior at every stage of agent execution:
 * before/after task execution, on error, on message send/receive,
 * on artifact creation, and on phase transitions.
 *
 * Hooks are chained — multiple hooks of the same type run in
 * registration order, and each can modify or short-circuit the flow.
 */

import type {
  AgentRole,
  AgentMessage,
  Artifact,
  ProjectPhase,
  ProjectState,
  Task,
} from "./types";

// ─── Hook Types ───────────────────────────────────────────────────────

export type HookStage =
  | "beforeExecute"
  | "afterExecute"
  | "onError"
  | "beforeMessage"
  | "afterMessage"
  | "onArtifact"
  | "onPhaseChange"
  | "onTaskStatusChange"
  | "beforeToolCall"
  | "afterToolCall"
  | "onInit"
  | "onShutdown";

export interface HookContext {
  agentRole: AgentRole;
  state: ProjectState;
  timestamp: number;
  metadata: Record<string, unknown>;
}

// ─── Hook Payloads ────────────────────────────────────────────────────

export interface BeforeExecutePayload {
  task: Task;
  state: ProjectState;
}

export interface AfterExecutePayload {
  task: Task;
  artifacts: Artifact[];
  duration: number;
  state: ProjectState;
}

export interface OnErrorPayload {
  error: Error;
  task?: Task;
  recoverable: boolean;
}

export interface BeforeMessagePayload {
  message: AgentMessage;
}

export interface AfterMessagePayload {
  message: AgentMessage;
  response: AgentMessage | null;
}

export interface OnArtifactPayload {
  artifact: Artifact;
  task: Task;
}

export interface OnPhaseChangePayload {
  from: ProjectPhase;
  to: ProjectPhase;
}

export interface OnTaskStatusChangePayload {
  task: Task;
  previousStatus: string;
  newStatus: string;
}

export interface BeforeToolCallPayload {
  toolName: string;
  input: Record<string, unknown>;
}

export interface AfterToolCallPayload {
  toolName: string;
  input: Record<string, unknown>;
  result: { success: boolean; duration: number; error?: string };
}

export interface OnInitPayload {
  agentRole: AgentRole;
  state: ProjectState;
}

export interface OnShutdownPayload {
  agentRole: AgentRole;
  totalArtifacts: number;
  totalDuration: number;
}

// ─── Hook Result ──────────────────────────────────────────────────────

export interface HookResult {
  /** If true, abort the current operation (e.g., skip task execution) */
  abort?: boolean;
  /** Modified payload to pass to the next hook or to the operation */
  modifiedPayload?: unknown;
  /** Extra metadata to attach to the context */
  metadata?: Record<string, unknown>;
  /** Log messages from the hook */
  messages?: string[];
}

// ─── Hook Definition ──────────────────────────────────────────────────

export type HookHandler<TPayload = unknown> = (
  payload: TPayload,
  context: HookContext
) => Promise<HookResult | void>;

export interface HookDefinition<TPayload = unknown> {
  name: string;
  stage: HookStage;
  description?: string;
  /** Lower priority runs first */
  priority?: number;
  /** Only apply to these agent roles (undefined = all) */
  roles?: AgentRole[];
  handler: HookHandler<TPayload>;
}

// ─── Hook Registry ────────────────────────────────────────────────────

export class HookRegistry {
  private hooks = new Map<HookStage, HookDefinition[]>();
  private executionLog: Array<{
    hookName: string;
    stage: HookStage;
    agentRole: AgentRole;
    duration: number;
    aborted: boolean;
    timestamp: number;
  }> = [];

  /** Register a hook */
  register<TPayload>(hook: HookDefinition<TPayload>): void {
    const list = this.hooks.get(hook.stage) ?? [];
    list.push(hook as HookDefinition);
    // Sort by priority (lower first)
    list.sort((a, b) => (a.priority ?? 100) - (b.priority ?? 100));
    this.hooks.set(hook.stage, list);
  }

  /** Register multiple hooks */
  registerAll(hooks: HookDefinition[]): void {
    for (const hook of hooks) {
      this.register(hook);
    }
  }

  /** Remove a hook by name */
  unregister(name: string): boolean {
    let found = false;
    for (const [stage, hooks] of this.hooks) {
      const idx = hooks.findIndex((h) => h.name === name);
      if (idx >= 0) {
        hooks.splice(idx, 1);
        found = true;
      }
    }
    return found;
  }

  /** Get all hooks for a stage, optionally filtered by agent role */
  getHooks(stage: HookStage, role?: AgentRole): HookDefinition[] {
    const hooks = this.hooks.get(stage) ?? [];
    if (!role) return hooks;
    return hooks.filter((h) => !h.roles || h.roles.includes(role));
  }

  /**
   * Run all hooks for a stage in sequence.
   * Each hook can modify the payload and/or abort the chain.
   */
  async run<TPayload>(
    stage: HookStage,
    payload: TPayload,
    context: HookContext
  ): Promise<{ payload: TPayload; aborted: boolean; metadata: Record<string, unknown>; messages: string[] }> {
    const hooks = this.getHooks(stage, context.agentRole);
    let currentPayload = payload;
    let aborted = false;
    const allMetadata: Record<string, unknown> = {};
    const allMessages: string[] = [];

    for (const hook of hooks) {
      const start = Date.now();
      try {
        const result = await hook.handler(currentPayload, context);
        const duration = Date.now() - start;

        this.executionLog.push({
          hookName: hook.name,
          stage,
          agentRole: context.agentRole,
          duration,
          aborted: result?.abort ?? false,
          timestamp: Date.now(),
        });

        if (result) {
          if (result.modifiedPayload !== undefined) {
            currentPayload = result.modifiedPayload as TPayload;
          }
          if (result.metadata) {
            Object.assign(allMetadata, result.metadata);
          }
          if (result.messages) {
            allMessages.push(...result.messages);
          }
          if (result.abort) {
            aborted = true;
            break;
          }
        }
      } catch (err) {
        const duration = Date.now() - start;
        this.executionLog.push({
          hookName: hook.name,
          stage,
          agentRole: context.agentRole,
          duration,
          aborted: false,
          timestamp: Date.now(),
        });
        // Hook errors don't crash the pipeline — log and continue
        allMessages.push(
          `Hook "${hook.name}" failed: ${err instanceof Error ? err.message : String(err)}`
        );
      }
    }

    return { payload: currentPayload, aborted, metadata: allMetadata, messages: allMessages };
  }

  /** Get hook execution history */
  getExecutionLog() {
    return [...this.executionLog];
  }

  /** Clear execution log */
  clearLog(): void {
    this.executionLog = [];
  }

  /** Get count of registered hooks */
  size(): number {
    let total = 0;
    for (const hooks of this.hooks.values()) {
      total += hooks.length;
    }
    return total;
  }

  /** List all hooks grouped by stage */
  listAll(): Record<HookStage, string[]> {
    const result: Partial<Record<HookStage, string[]>> = {};
    for (const [stage, hooks] of this.hooks) {
      result[stage] = hooks.map((h) => h.name);
    }
    return result as Record<HookStage, string[]>;
  }
}

// ─── Built-in Hooks ───────────────────────────────────────────────────

/** Log every task execution for observability */
export const executionLoggerHook: HookDefinition<BeforeExecutePayload> = {
  name: "execution-logger",
  stage: "beforeExecute",
  description: "Logs task execution start for observability",
  priority: 1,
  handler: async (payload, ctx) => {
    const timestamp = new Date().toISOString().slice(11, 19);
    console.log(
      `  [${timestamp}] [hook:exec-log] ${ctx.agentRole} starting: ${payload.task.title}`
    );
    return { metadata: { executionStartedAt: Date.now() } };
  },
};

/** Track execution duration */
export const durationTrackerHook: HookDefinition<AfterExecutePayload> = {
  name: "duration-tracker",
  stage: "afterExecute",
  description: "Tracks and logs task execution duration",
  priority: 1,
  handler: async (payload, ctx) => {
    const timestamp = new Date().toISOString().slice(11, 19);
    console.log(
      `  [${timestamp}] [hook:duration] ${ctx.agentRole} completed: ${payload.task.title} (${payload.duration}ms, ${payload.artifacts.length} artifacts)`
    );
    return {};
  },
};

/** Log errors with context */
export const errorLoggerHook: HookDefinition<OnErrorPayload> = {
  name: "error-logger",
  stage: "onError",
  description: "Logs errors with full context for debugging",
  priority: 1,
  handler: async (payload, ctx) => {
    const timestamp = new Date().toISOString().slice(11, 19);
    console.error(
      `  [${timestamp}] [hook:error] ${ctx.agentRole} error${payload.task ? ` on "${payload.task.title}"` : ""}: ${payload.error.message}`
    );
    if (payload.recoverable) {
      return { messages: ["Error logged, execution will continue"] };
    }
    return { messages: ["Fatal error logged"] };
  },
};

/** Validate artifacts before they're accepted */
export const artifactValidatorHook: HookDefinition<OnArtifactPayload> = {
  name: "artifact-validator",
  stage: "onArtifact",
  description: "Validates artifacts have required fields and non-empty content",
  priority: 10,
  handler: async (payload) => {
    const { artifact } = payload;
    const issues: string[] = [];

    if (!artifact.filePath) issues.push("missing filePath");
    if (!artifact.content) issues.push("empty content");
    if (!artifact.description) issues.push("missing description");

    if (issues.length > 0) {
      return {
        messages: [`Artifact validation warnings: ${issues.join(", ")}`],
      };
    }
    return {};
  },
};

/** Log phase transitions */
export const phaseTransitionHook: HookDefinition<OnPhaseChangePayload> = {
  name: "phase-transition-logger",
  stage: "onPhaseChange",
  description: "Logs project phase transitions",
  priority: 1,
  handler: async (payload) => {
    console.log(`\n  Phase transition: ${payload.from} → ${payload.to}`);
    return {};
  },
};

/** Collect and display tool execution metrics */
export const toolMetricsHook: HookDefinition<AfterToolCallPayload> = {
  name: "tool-metrics",
  stage: "afterToolCall",
  description: "Collects tool execution metrics for performance tracking",
  priority: 50,
  handler: async (payload, ctx) => {
    if (!payload.result.success) {
      return {
        messages: [
          `Tool "${payload.toolName}" failed after ${payload.result.duration}ms: ${payload.result.error}`,
        ],
      };
    }
    return {};
  },
};

/** Create all built-in hooks */
export function createBuiltinHooks(): HookDefinition[] {
  return [
    executionLoggerHook as HookDefinition,
    durationTrackerHook as HookDefinition,
    errorLoggerHook as HookDefinition,
    artifactValidatorHook as HookDefinition,
    phaseTransitionHook as HookDefinition,
    toolMetricsHook as HookDefinition,
  ];
}
