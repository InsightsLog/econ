/**
 * econ — A team of 13 AI agents that ship any web app
 *
 * This is the public API entry point. Import from here
 * to use the agent team programmatically.
 */

export { AgentTeam } from "./pipeline/team";
export { Agent } from "./core/agent";
export * from "./core/types";

// Individual agents
export { TeamLeadAgent } from "./agents/team-lead";
export { ProductManagerAgent } from "./agents/planning/product-manager";
export { ArchitectAgent } from "./agents/planning/architect";
export { UIDesignerAgent } from "./agents/frontend/ui-designer";
export { FrontendDevAgent } from "./agents/frontend/frontend-dev";
export { AccessibilityAgent } from "./agents/frontend/accessibility";
export { BackendDevAgent } from "./agents/backend/backend-dev";
export { DatabaseEngineerAgent } from "./agents/backend/database-engineer";
export { APIDesignerAgent } from "./agents/backend/api-designer";
export { QAEngineerAgent } from "./agents/quality/qa-engineer";
export { SecurityAuditorAgent } from "./agents/quality/security-auditor";
export { DevOpsAgent } from "./agents/delivery/devops";
export { TechnicalWriterAgent } from "./agents/delivery/technical-writer";
