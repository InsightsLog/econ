import { Agent } from "../core/agent";
import {
  AgentRole,
  Artifact,
  ArtifactType,
  Priority,
  ProjectPhase,
  ProjectSpec,
  ProjectState,
  Task,
  TaskStatus,
} from "../core/types";

/**
 * Agent 1: Team Lead
 *
 * The orchestrator. Breaks down the project spec into tasks,
 * assigns work to the right agents, manages phase transitions,
 * and resolves blockers. Think of it as a senior engineering manager.
 */
export class TeamLeadAgent extends Agent {
  readonly role = AgentRole.TeamLead;
  readonly name = "Team Lead";
  readonly description =
    "Orchestrates the team, decomposes projects into tasks, manages workflow and phase transitions";
  readonly capabilities = [
    "task-decomposition",
    "agent-assignment",
    "phase-management",
    "conflict-resolution",
    "progress-tracking",
  ];

  getSystemPrompt(): string {
    return `You are the Team Lead of a 9-agent AI engineering team that ships web applications.
Your job is to:
- Break down a project spec into concrete, actionable tasks
- Assign each task to the right specialist agent
- Manage dependencies between tasks so nothing is blocked unnecessarily
- Drive the project through phases: requirements → architecture → implementation → testing → docs → deployment
- Escalate or unblock issues when agents get stuck
- Ensure the final output is a complete, shippable web application`;
  }

  async execute(task: Task, state: ProjectState): Promise<Artifact[]> {
    this.log("Orchestrating project workflow...");
    const plan = this.buildProjectPlan(state.spec);
    return [
      this.createArtifact(
        ArtifactType.Specification,
        "project-plan.json",
        JSON.stringify(plan, null, 2),
        "Master project plan with all tasks and assignments"
      ),
    ];
  }

  /** Decompose a project spec into the full task graph */
  buildProjectPlan(spec: ProjectSpec): Task[] {
    this.log(`Decomposing project: ${spec.name}`);
    const tasks: Task[] = [];
    let taskIndex = 0;

    const id = () => `task-${++taskIndex}`;

    // Phase 1: Requirements
    const reqId = id();
    tasks.push({
      id: reqId,
      title: "Gather and document requirements",
      description: `Analyze the project spec and produce detailed user stories and acceptance criteria for: ${spec.features.join(", ")}`,
      assignee: AgentRole.ProductManager,
      dependencies: [],
      status: TaskStatus.Pending,
      artifacts: [],
      priority: Priority.Critical,
    });

    // Phase 2: Architecture
    const archId = id();
    tasks.push({
      id: archId,
      title: "Design system architecture",
      description:
        "Choose tech stack, define project structure, design data flow, and document architecture decisions",
      assignee: AgentRole.Architect,
      dependencies: [reqId],
      status: TaskStatus.Pending,
      artifacts: [],
      priority: Priority.Critical,
    });

    // Phase 3: Database design
    const dbId = id();
    tasks.push({
      id: dbId,
      title: "Design database schema",
      description:
        "Create data models, relationships, indexes, and migration scripts",
      assignee: AgentRole.DatabaseEngineer,
      dependencies: [archId],
      status: TaskStatus.Pending,
      artifacts: [],
      priority: Priority.High,
    });

    // Phase 4: Implementation (parallel frontend + backend)
    const backendId = id();
    tasks.push({
      id: backendId,
      title: "Implement backend services",
      description:
        "Design API contracts, build server, routes, middleware, business logic, database integration, and security hardening",
      assignee: AgentRole.BackendDev,
      dependencies: [archId, dbId],
      status: TaskStatus.Pending,
      artifacts: [],
      priority: Priority.Critical,
    });

    const frontendId = id();
    tasks.push({
      id: frontendId,
      title: "Implement frontend application",
      description:
        "Create design system, build pages, components, state management, API integration, routing, and accessibility utilities",
      assignee: AgentRole.FrontendDev,
      dependencies: [archId],
      status: TaskStatus.Pending,
      artifacts: [],
      priority: Priority.Critical,
    });

    // Phase 5: Testing
    const qaId = id();
    tasks.push({
      id: qaId,
      title: "Write tests and validate quality",
      description:
        "Create unit tests, integration tests, and end-to-end test plan. Validate all features against acceptance criteria",
      assignee: AgentRole.QAEngineer,
      dependencies: [frontendId, backendId],
      status: TaskStatus.Pending,
      artifacts: [],
      priority: Priority.High,
    });

    // Phase 6: DevOps
    const devopsId = id();
    tasks.push({
      id: devopsId,
      title: "Set up CI/CD and deployment",
      description:
        "Create Dockerfile, CI/CD pipeline, environment configs, and deployment scripts",
      assignee: AgentRole.DevOps,
      dependencies: [qaId],
      status: TaskStatus.Pending,
      artifacts: [],
      priority: Priority.High,
    });

    // Phase 7: Documentation
    const docsId = id();
    tasks.push({
      id: docsId,
      title: "Write project documentation",
      description:
        "Generate README, API documentation, setup guide, architecture docs, and contributing guide",
      assignee: AgentRole.TechnicalWriter,
      dependencies: [frontendId, backendId],
      status: TaskStatus.Pending,
      artifacts: [],
      priority: Priority.Medium,
    });

    // Per-feature tasks
    spec.features.forEach((feature, i) => {
      const featureReqId = id();
      tasks.push({
        id: featureReqId,
        title: `Implement feature: ${feature}`,
        description: `Full implementation of the "${feature}" feature across frontend and backend`,
        assignee:
          i % 2 === 0 ? AgentRole.FrontendDev : AgentRole.BackendDev,
        dependencies: [backendId, frontendId],
        status: TaskStatus.Pending,
        artifacts: [],
        priority: Priority.Medium,
      });
    });

    this.log(`Created ${tasks.length} tasks across all phases`);
    return tasks;
  }

  /** Determine which phase the project is currently in */
  resolvePhase(tasks: Task[]): ProjectPhase {
    const done = (role: AgentRole) =>
      tasks
        .filter((t) => t.assignee === role)
        .every((t) => t.status === TaskStatus.Done);

    if (!done(AgentRole.ProductManager)) return ProjectPhase.Requirements;
    if (!done(AgentRole.Architect)) return ProjectPhase.Architecture;
    if (
      !done(AgentRole.FrontendDev) ||
      !done(AgentRole.BackendDev) ||
      !done(AgentRole.DatabaseEngineer)
    )
      return ProjectPhase.Implementation;
    if (!done(AgentRole.QAEngineer)) return ProjectPhase.Testing;
    if (!done(AgentRole.TechnicalWriter)) return ProjectPhase.Documentation;
    if (!done(AgentRole.DevOps)) return ProjectPhase.Deployment;
    return ProjectPhase.Complete;
  }

  /** Return the next batch of tasks that are unblocked */
  getReadyTasks(tasks: Task[]): Task[] {
    return tasks.filter((task) => {
      if (task.status !== TaskStatus.Pending) return false;
      return task.dependencies.every((depId) => {
        const dep = tasks.find((t) => t.id === depId);
        return dep?.status === TaskStatus.Done;
      });
    });
  }
}
