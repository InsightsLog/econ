import { Agent } from "../../core/agent";
import {
  AgentRole,
  Artifact,
  ArtifactType,
  ProjectState,
  Task,
} from "../../core/types";

/**
 * Agent 13: Technical Writer
 *
 * Generates project documentation — README, API docs,
 * setup guide, architecture overview, and contributing guide.
 */
export class TechnicalWriterAgent extends Agent {
  readonly role = AgentRole.TechnicalWriter;
  readonly name = "Technical Writer";
  readonly description =
    "Generates README, API docs, setup guides, architecture docs, and contributing guidelines";
  readonly capabilities = [
    "readme-generation",
    "api-documentation",
    "setup-guides",
    "architecture-docs",
    "contributing-guide",
    "changelog",
  ];

  getSystemPrompt(): string {
    return `You are a Technical Writer on a 9-agent AI engineering team.
Your job is to:
- Write a comprehensive README with project overview, setup instructions, and usage guide
- Document all API endpoints with examples
- Create a setup/installation guide for new developers
- Write architecture documentation for the team
- Create a contributing guide with coding standards
- Keep documentation accurate, concise, and developer-friendly`;
  }

  async execute(task: Task, state: ProjectState): Promise<Artifact[]> {
    this.log("Writing project documentation...");
    const { spec } = state;
    const artifacts: Artifact[] = [];

    // Project README
    const readme = `# ${spec.name}

${spec.description}

## Features

${spec.features.map((f) => `- ${f}`).join("\n")}

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React + TypeScript |
| Backend | Node.js + Express |
| Database | PostgreSQL |
| Styling | Tailwind CSS |
| Auth | JWT (access + refresh tokens) |
| CI/CD | GitHub Actions |
| Container | Docker |

## Quick Start

### Prerequisites

- Node.js 20+
- PostgreSQL 16+ (or Docker)
- npm 10+

### Using Docker (Recommended)

\`\`\`bash
# Clone the repository
git clone <repository-url>
cd ${spec.name.toLowerCase().replace(/\s+/g, "-")}

# Start all services
docker-compose up -d

# The app is now running at http://localhost:3001
\`\`\`

### Manual Setup

\`\`\`bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your database credentials

# Run database migrations
psql -d your_database -f migrations/001_initial_schema.sql

# Build and start
npm run build
npm start
\`\`\`

### Development

\`\`\`bash
# Start dev server with hot reload
npm run dev

# Run tests
npm test

# Type check
npm run lint
\`\`\`

## API Endpoints

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | \`/api/auth/register\` | Register new user |
| POST | \`/api/auth/login\` | Log in |
| POST | \`/api/auth/refresh\` | Refresh access token |

### Users

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | \`/api/users/me\` | Get current profile | Required |
| PUT | \`/api/users/me\` | Update profile | Required |

### Health

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | \`/health\` | Service health check |

## Project Structure

\`\`\`
src/
├── client/           # React frontend
│   ├── components/   # UI components
│   ├── hooks/        # Custom hooks
│   ├── pages/        # Route pages
│   ├── stores/       # State management
│   ├── styles/       # Design tokens and CSS
│   ├── api/          # API client
│   └── utils/        # Utilities
├── server/           # Express backend
│   ├── routes/       # API routes
│   ├── services/     # Business logic
│   ├── middleware/    # Express middleware
│   └── models/       # Database models
├── shared/           # Shared types
tests/
├── unit/             # Unit tests
├── integration/      # Integration tests
└── e2e/              # End-to-end tests
migrations/           # SQL migrations
docs/                 # Documentation
\`\`\`

## Architecture

This application follows a layered architecture:

1. **Client Layer** — React SPA with component-based UI
2. **API Layer** — RESTful endpoints with JWT authentication
3. **Service Layer** — Business logic separated from routes
4. **Data Layer** — PostgreSQL with structured migrations

## License

MIT
`;

    artifacts.push(
      this.createArtifact(
        ArtifactType.Documentation,
        "docs/PROJECT_README.md",
        readme,
        "Comprehensive project README with setup instructions and API docs"
      )
    );

    // Contributing guide
    artifacts.push(
      this.createArtifact(
        ArtifactType.Documentation,
        "docs/CONTRIBUTING.md",
        `# Contributing Guide

## Development Workflow

1. Create a feature branch from \`main\`
2. Implement your changes
3. Write/update tests
4. Run \`npm run lint\` and \`npm test\`
5. Submit a pull request

## Code Standards

- **TypeScript** — Strict mode enabled, no \`any\` unless unavoidable
- **Naming** — camelCase for variables/functions, PascalCase for components/classes
- **Files** — kebab-case for file names
- **Commits** — Use conventional commits: \`feat:\`, \`fix:\`, \`docs:\`, \`chore:\`, \`test:\`

## Testing

- Unit tests: \`tests/unit/\`
- Integration tests: \`tests/integration/\`
- Minimum 80% coverage required

## Pull Request Checklist

- [ ] Code follows project style guidelines
- [ ] Tests pass locally
- [ ] New code has test coverage
- [ ] Documentation updated if needed
- [ ] No console.log statements left in code
`,
        "Contributing guide with workflow, code standards, and PR checklist"
      )
    );

    this.log(`Generated README and contributing guide`);
    return artifacts;
  }
}
