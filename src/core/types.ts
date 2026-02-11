/** Identifies each agent on the team */
export enum AgentRole {
  TeamLead = "team-lead",
  ProductManager = "product-manager",
  Architect = "architect",
  UIDesigner = "ui-designer",
  FrontendDev = "frontend-dev",
  BackendDev = "backend-dev",
  DatabaseEngineer = "database-engineer",
  APIDesigner = "api-designer",
  QAEngineer = "qa-engineer",
  SecurityAuditor = "security-auditor",
  DevOps = "devops",
  TechnicalWriter = "technical-writer",
  AccessibilitySpecialist = "accessibility-specialist",
}

/** A discrete unit of work that an agent can perform */
export interface Task {
  id: string;
  title: string;
  description: string;
  assignee: AgentRole;
  dependencies: string[];
  status: TaskStatus;
  artifacts: Artifact[];
  priority: Priority;
}

export enum TaskStatus {
  Pending = "pending",
  Blocked = "blocked",
  InProgress = "in-progress",
  Review = "review",
  Done = "done",
}

export enum Priority {
  Critical = "critical",
  High = "high",
  Medium = "medium",
  Low = "low",
}

/** An output produced by an agent — code, config, docs, etc. */
export interface Artifact {
  id: string;
  type: ArtifactType;
  filePath: string;
  content: string;
  createdBy: AgentRole;
  description: string;
}

export enum ArtifactType {
  SourceCode = "source-code",
  Config = "config",
  Schema = "schema",
  Test = "test",
  Documentation = "documentation",
  Design = "design",
  Migration = "migration",
  Pipeline = "pipeline",
  Specification = "specification",
}

/** Message passed between agents */
export interface AgentMessage {
  from: AgentRole;
  to: AgentRole | "broadcast";
  type: MessageType;
  payload: unknown;
  timestamp: number;
}

export enum MessageType {
  TaskAssignment = "task-assignment",
  TaskComplete = "task-complete",
  ReviewRequest = "review-request",
  ReviewResult = "review-result",
  Question = "question",
  Answer = "answer",
  Artifact = "artifact",
  StatusUpdate = "status-update",
  Escalation = "escalation",
}

/** High-level project spec provided by the user */
export interface ProjectSpec {
  name: string;
  description: string;
  features: string[];
  techPreferences?: TechPreferences;
  constraints?: string[];
}

export interface TechPreferences {
  frontend?: string;
  backend?: string;
  database?: string;
  styling?: string;
  hosting?: string;
}

/** The full project state shared across agents */
export interface ProjectState {
  spec: ProjectSpec;
  tasks: Task[];
  artifacts: Artifact[];
  messages: AgentMessage[];
  architecture?: ArchitectureDecision;
  phase: ProjectPhase;
}

export interface ArchitectureDecision {
  frontend: string;
  backend: string;
  database: string;
  styling: string;
  apiStyle: "rest" | "graphql";
  authentication: string;
  hosting: string;
  structure: Record<string, string>;
}

export enum ProjectPhase {
  Requirements = "requirements",
  Architecture = "architecture",
  Design = "design",
  Implementation = "implementation",
  Testing = "testing",
  Security = "security",
  Documentation = "documentation",
  Deployment = "deployment",
  Complete = "complete",
}
