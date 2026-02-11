import { Agent } from "../../core/agent";
import {
  AgentRole,
  ArchitectureDecision,
  Artifact,
  ArtifactType,
  ProjectState,
  Task,
} from "../../core/types";

/**
 * Agent 3: Architect
 *
 * Makes technology choices, designs the system structure,
 * defines data flow, and documents architecture decisions.
 * Sets the technical foundation the rest of the team builds on.
 */
export class ArchitectAgent extends Agent {
  readonly role = AgentRole.Architect;
  readonly name = "Architect";
  readonly description =
    "Designs system architecture, chooses tech stack, defines project structure and data flow";
  readonly capabilities = [
    "tech-stack-selection",
    "system-design",
    "data-flow-design",
    "project-structure",
    "architecture-decision-records",
  ];

  getSystemPrompt(): string {
    return `You are a senior Software Architect on a 9-agent AI engineering team.
Your job is to:
- Select the optimal tech stack based on project requirements and team preferences
- Design the overall system architecture (frontend, backend, database, API layer)
- Define the project directory structure
- Document architecture decision records (ADRs) for every major choice
- Design data flow between components
- Ensure the architecture supports scalability, maintainability, and testability`;
  }

  async execute(task: Task, state: ProjectState): Promise<Artifact[]> {
    this.log("Designing system architecture...");
    const { spec } = state;
    const artifacts: Artifact[] = [];

    const prefs = spec.techPreferences ?? {};
    const architecture = this.decideArchitecture(prefs as Record<string, string | undefined>);

    artifacts.push(
      this.createArtifact(
        ArtifactType.Specification,
        "docs/architecture.json",
        JSON.stringify(architecture, null, 2),
        "Architecture decisions including tech stack and project structure"
      )
    );

    // Project structure
    const structure = this.generateProjectStructure(architecture);
    artifacts.push(
      this.createArtifact(
        ArtifactType.Specification,
        "docs/project-structure.txt",
        structure,
        "Recommended project directory structure"
      )
    );

    // Architecture Decision Records
    const adrs = this.generateADRs(architecture, spec.description);
    artifacts.push(
      this.createArtifact(
        ArtifactType.Documentation,
        "docs/architecture-decisions.md",
        adrs,
        "Architecture Decision Records documenting major technical choices"
      )
    );

    this.log(
      `Architecture: ${architecture.frontend} + ${architecture.backend} + ${architecture.database}`
    );
    return artifacts;
  }

  private decideArchitecture(
    prefs: Record<string, string | undefined>
  ): ArchitectureDecision {
    return {
      frontend: prefs.frontend || "React with TypeScript",
      backend: prefs.backend || "Node.js with Express",
      database: prefs.database || "PostgreSQL",
      styling: prefs.styling || "Tailwind CSS",
      apiStyle: "rest",
      authentication: "JWT with refresh tokens",
      hosting: prefs.hosting || "Docker + cloud deployment",
      structure: {
        "src/client": "React frontend application",
        "src/client/components": "Reusable UI components",
        "src/client/pages": "Route-level page components",
        "src/client/hooks": "Custom React hooks",
        "src/client/stores": "State management",
        "src/client/utils": "Client utility functions",
        "src/server": "Express backend application",
        "src/server/routes": "API route handlers",
        "src/server/middleware": "Express middleware",
        "src/server/models": "Database models",
        "src/server/services": "Business logic layer",
        "src/server/utils": "Server utility functions",
        "src/shared": "Shared types and constants",
        "tests/unit": "Unit tests",
        "tests/integration": "Integration tests",
        "tests/e2e": "End-to-end tests",
        docs: "Project documentation",
        scripts: "Build and deployment scripts",
      },
    };
  }

  private generateProjectStructure(arch: ArchitectureDecision): string {
    const lines = ["Project Structure", "=================", ""];
    for (const [dir, desc] of Object.entries(arch.structure)) {
      lines.push(`${dir.padEnd(30)} # ${desc}`);
    }
    return lines.join("\n");
  }

  private generateADRs(
    arch: ArchitectureDecision,
    projectDescription: string
  ): string {
    return `# Architecture Decision Records

## Project Context
${projectDescription}

---

## ADR-001: Frontend Framework — ${arch.frontend}
**Status:** Accepted
**Context:** Need a component-based framework with strong typing and ecosystem support.
**Decision:** ${arch.frontend} — mature ecosystem, strong TypeScript support, large community.
**Consequences:** Requires build tooling (Vite/Webpack). Team must follow React patterns.

## ADR-002: Backend Framework — ${arch.backend}
**Status:** Accepted
**Context:** Need a server framework that pairs well with the frontend and supports REST APIs.
**Decision:** ${arch.backend} — JavaScript/TypeScript consistency across the stack, rich middleware ecosystem.
**Consequences:** Single-threaded event loop requires care with CPU-intensive tasks.

## ADR-003: Database — ${arch.database}
**Status:** Accepted
**Context:** Need a reliable, relational database with strong query capabilities.
**Decision:** ${arch.database} — ACID compliant, excellent JSON support, mature ecosystem.
**Consequences:** Requires connection pooling for production. Schema migrations needed.

## ADR-004: API Style — ${arch.apiStyle.toUpperCase()}
**Status:** Accepted
**Context:** Need a clear contract between frontend and backend.
**Decision:** RESTful API with JSON — simple, well-understood, excellent tooling.
**Consequences:** May need versioning strategy as API evolves.

## ADR-005: Styling — ${arch.styling}
**Status:** Accepted
**Context:** Need a styling approach that enables rapid UI development.
**Decision:** ${arch.styling} — utility-first, no context switching, highly composable.
**Consequences:** HTML can become verbose. Team needs familiarity with utility classes.

## ADR-006: Authentication — ${arch.authentication}
**Status:** Accepted
**Context:** Need secure user authentication with session management.
**Decision:** ${arch.authentication} — stateless, scalable, supports token rotation.
**Consequences:** Must handle token refresh flow. Secure storage required on client.
`;
  }
}
