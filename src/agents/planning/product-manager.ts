import { Agent } from "../../core/agent";
import {
  AgentRole,
  Artifact,
  ArtifactType,
  ProjectState,
  Task,
} from "../../core/types";

/**
 * Agent 2: Product Manager
 *
 * Translates the user's high-level project description into
 * structured requirements: user stories, acceptance criteria,
 * feature priorities, and a product roadmap.
 */
export class ProductManagerAgent extends Agent {
  readonly role = AgentRole.ProductManager;
  readonly name = "Product Manager";
  readonly description =
    "Gathers requirements, writes user stories, defines acceptance criteria, and prioritizes the backlog";
  readonly capabilities = [
    "requirements-gathering",
    "user-story-writing",
    "acceptance-criteria",
    "feature-prioritization",
    "roadmap-planning",
  ];

  getSystemPrompt(): string {
    return `You are a senior Product Manager on a 9-agent AI engineering team.
Your job is to:
- Analyze the project spec and extract clear, testable requirements
- Write user stories in the format: "As a [user], I want [goal] so that [benefit]"
- Define acceptance criteria for every feature
- Prioritize features using MoSCoW (Must/Should/Could/Won't)
- Identify edge cases and non-functional requirements (performance, security, accessibility)
- Produce a structured requirements document that the rest of the team can build from`;
  }

  async execute(task: Task, state: ProjectState): Promise<Artifact[]> {
    this.log("Analyzing project spec and writing requirements...");
    const { spec } = state;
    const artifacts: Artifact[] = [];

    // Build user stories for each feature
    const userStories = spec.features.map((feature, i) => ({
      id: `US-${String(i + 1).padStart(3, "0")}`,
      feature,
      story: `As a user, I want to ${feature.toLowerCase()} so that I can accomplish my goals efficiently`,
      acceptanceCriteria: [
        `The ${feature.toLowerCase()} functionality is accessible from the main interface`,
        `All inputs are validated with clear error messages`,
        `The feature works on mobile and desktop viewports`,
        `Loading states are displayed during async operations`,
        `The feature meets WCAG 2.1 AA accessibility standards`,
      ],
      priority: i < Math.ceil(spec.features.length / 2) ? "must" : "should",
    }));

    // Non-functional requirements
    const nfrs = {
      performance: [
        "Page load time under 3 seconds on 3G connection",
        "Time to interactive under 5 seconds",
        "API response times under 200ms for p95",
        "Lighthouse performance score above 90",
      ],
      security: [
        "All user input is sanitized and validated",
        "Authentication tokens use secure httpOnly cookies",
        "HTTPS enforced for all connections",
        "OWASP Top 10 vulnerabilities addressed",
      ],
      accessibility: [
        "WCAG 2.1 AA compliance",
        "Keyboard navigation for all interactive elements",
        "Screen reader compatible",
        "Sufficient color contrast ratios",
      ],
      reliability: [
        "Graceful error handling with user-friendly messages",
        "Automatic retry for transient failures",
        "Data persistence across sessions",
      ],
    };

    const requirements = {
      project: spec.name,
      description: spec.description,
      userStories,
      nonFunctionalRequirements: nfrs,
      constraints: spec.constraints || [],
      assumptions: [
        "Users have modern browsers (last 2 versions)",
        "Application will be deployed as a web app",
        "Initial scope targets single-tenant usage",
      ],
    };

    artifacts.push(
      this.createArtifact(
        ArtifactType.Specification,
        "docs/requirements.json",
        JSON.stringify(requirements, null, 2),
        "Detailed requirements document with user stories and acceptance criteria"
      )
    );

    // Feature priority matrix
    const priorityMatrix = userStories.map((us) => ({
      id: us.id,
      feature: us.feature,
      priority: us.priority,
      effort: "medium",
      impact: "high",
      dependencies: [],
    }));

    artifacts.push(
      this.createArtifact(
        ArtifactType.Specification,
        "docs/feature-priorities.json",
        JSON.stringify(priorityMatrix, null, 2),
        "Feature priority matrix with effort and impact ratings"
      )
    );

    this.log(
      `Produced ${userStories.length} user stories and ${Object.keys(nfrs).length} NFR categories`
    );
    return artifacts;
  }
}
