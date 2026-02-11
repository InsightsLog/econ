export { Agent } from "./agent";
export * from "./types";

// Tool system
export {
  ToolRegistry,
  createBuiltinTools,
  readFileTool,
  writeFileTool,
  globTool,
  shellTool,
  httpTool,
  grepTool,
  codeAnalysisTool,
  jsonTransformTool,
} from "./tools";
export type {
  Tool,
  ToolSchema,
  ToolParameter,
  ToolInput,
  ToolResult,
  ToolExecutor,
  ToolExecutionContext,
  ToolCategory,
  ToolPermission,
} from "./tools";

// Memory system
export {
  MemoryManager,
  WorkingMemory,
  EpisodicMemory,
  SemanticMemory,
} from "./memory";
export type {
  MemoryEntry,
  MemoryType,
  MemoryQuery,
} from "./memory";

// Skill system
export {
  SkillRegistry,
  SkillPipeline,
  createBuiltinSkills,
  analyzeCodebaseSkill,
  runTestsSkill,
  generateCodeSkill,
  codeReviewSkill,
  patternSearchSkill,
} from "./skills";
export type {
  Skill,
  SkillDefinition,
  SkillInput,
  SkillOutput,
  SkillContext,
  SkillCategory,
  SkillExecutor,
} from "./skills";

// Hook system
export {
  HookRegistry,
  createBuiltinHooks,
  executionLoggerHook,
  durationTrackerHook,
  errorLoggerHook,
  artifactValidatorHook,
  phaseTransitionHook,
  toolMetricsHook,
} from "./hooks";
export type {
  HookDefinition,
  HookHandler,
  HookResult,
  HookContext,
  HookStage,
  BeforeExecutePayload,
  AfterExecutePayload,
  OnErrorPayload,
  BeforeMessagePayload,
  AfterMessagePayload,
  OnArtifactPayload,
  OnPhaseChangePayload,
  OnTaskStatusChangePayload,
  BeforeToolCallPayload,
  AfterToolCallPayload,
  OnInitPayload,
  OnShutdownPayload,
} from "./hooks";

// MCP integration
export { MCPClient } from "./mcp";
export type {
  MCPServerConfig,
  MCPTransport,
  MCPCapability,
  MCPToolDefinition,
  MCPResource,
  MCPPrompt,
  MCPCallResult,
  MCPConnection,
  MCPConnectionStatus,
} from "./mcp";

// Agent context, event bus, knowledge graph
export { AgentContext, EventBus, KnowledgeGraph } from "./context";
export type {
  AgentContextConfig,
  EventType,
  BusEvent,
  EventHandler,
  KnowledgeNode,
  KnowledgeEdge,
} from "./context";
