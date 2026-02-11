/**
 * econ — A team of 9 AI agents that ship any web app
 *
 * Enhanced with: Tools, Memory, Skills, Hooks, MCP, Event Bus, Knowledge Graph
 *
 * This is the public API entry point. Import from here
 * to use the agent team programmatically.
 */

// Pipeline
export { AgentTeam } from "./pipeline/team";
export type { TeamConfig } from "./pipeline/team";

// Core framework
export { Agent } from "./core/agent";
export * from "./core/types";

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
} from "./core/tools";
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
} from "./core/tools";

// Memory system
export {
  MemoryManager,
  WorkingMemory,
  EpisodicMemory,
  SemanticMemory,
} from "./core/memory";
export type {
  MemoryEntry,
  MemoryType,
  MemoryQuery,
} from "./core/memory";

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
} from "./core/skills";
export type {
  Skill,
  SkillDefinition,
  SkillInput,
  SkillOutput,
  SkillContext,
  SkillCategory,
  SkillExecutor,
} from "./core/skills";

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
} from "./core/hooks";
export type {
  HookDefinition,
  HookHandler,
  HookResult,
  HookContext,
  HookStage,
  BeforeExecutePayload,
  AfterExecutePayload,
  OnErrorPayload,
  OnArtifactPayload,
  OnPhaseChangePayload,
} from "./core/hooks";

// MCP integration
export { MCPClient } from "./core/mcp";
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
} from "./core/mcp";

// Agent context, event bus, knowledge graph
export { AgentContext, EventBus, KnowledgeGraph } from "./core/context";
export type {
  AgentContextConfig,
  EventType,
  BusEvent,
  EventHandler,
  KnowledgeNode,
  KnowledgeEdge,
} from "./core/context";

// Individual agents
export { TeamLeadAgent } from "./agents/team-lead";
export { ProductManagerAgent } from "./agents/planning/product-manager";
export { ArchitectAgent } from "./agents/planning/architect";
export { FrontendDevAgent } from "./agents/frontend/frontend-dev";
export { BackendDevAgent } from "./agents/backend/backend-dev";
export { DatabaseEngineerAgent } from "./agents/backend/database-engineer";
export { QAEngineerAgent } from "./agents/quality/qa-engineer";
export { DevOpsAgent } from "./agents/delivery/devops";
export { TechnicalWriterAgent } from "./agents/delivery/technical-writer";
