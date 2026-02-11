# econ

A team of **9 AI agents** that ship any web app. Give it a project description, and the agents collaboratively produce a complete application — from requirements to deployment.

## The Team

| # | Agent | Role | Phase |
|---|-------|------|-------|
| 1 | **Team Lead** | Orchestrates workflow, decomposes tasks, manages phases | All |
| 2 | **Product Manager** | Gathers requirements, writes user stories, prioritizes backlog | Requirements |
| 3 | **Architect** | Chooses tech stack, designs system structure, writes ADRs | Architecture |
| 4 | **Frontend Developer** | Builds design system, React components, routing, state, API client, accessibility | Implementation |
| 5 | **Backend Developer** | Designs API contracts, implements Express server, routes, auth, business logic, security | Implementation |
| 6 | **Database Engineer** | Designs schemas, writes migrations, models data | Implementation |
| 7 | **QA Engineer** | Writes unit/integration/e2e tests, validates acceptance criteria | Testing |
| 8 | **DevOps Engineer** | Creates Dockerfile, CI/CD pipeline, environment configs | Deployment |
| 9 | **Technical Writer** | Generates README, API docs, setup guides, contributing guide | Documentation |

## How It Works

```
User provides project spec
        │
        ▼
  ┌─────────────┐
  │  Team Lead   │  ← Decomposes into tasks, assigns to agents
  └──────┬──────┘
         │
    ┌────┴────┐
    ▼         ▼
┌────────┐ ┌───────────┐
│ Product│ │ Architect  │  ← Requirements + Architecture
│Manager │ │            │
└───┬────┘ └─────┬─────┘
    │            │
    ▼            ▼
┌──────────┐ ┌──────────┐ ┌───────────┐
│ Frontend │ │ Backend  │ │ Database  │  ← Build
│   Dev    │ │   Dev    │ │ Engineer  │
└──────────┘ └──────────┘ └───────────┘
        │           │
        ▼           ▼
      ┌──────────┐
      │    QA    │  ← Test
      │ Engineer │
      └──────────┘
              │
              ▼
  ┌──────────┐ ┌────────────┐
  │  DevOps  │ │ Technical  │  ← Ship
  │ Engineer │ │  Writer    │
  └──────────┘ └────────────┘
        │
        ▼
   App is shipped
```

## Quick Start

```bash
# Install dependencies
npm install

# Build
npm run build

# Run with demo project
npm start

# Run with custom project
npm start -- --name "MyApp" --features "auth,dashboard,settings"

# Run with natural language
npm start -- "A social media app with posts, comments, and likes"
```

## Usage

### CLI

```bash
# Demo project (TaskFlow — a task management app)
econ

# Natural language description
econ "An e-commerce store with product catalog, shopping cart, and checkout"

# Detailed spec
econ --name "ShopEasy" \
     --description "Modern e-commerce platform" \
     --features "product catalog,shopping cart,checkout,user reviews" \
     --frontend "React" \
     --backend "Express" \
     --database "PostgreSQL"
```

### Programmatic

```typescript
import { AgentTeam } from "econ";

const team = new AgentTeam({
  name: "MyApp",
  description: "A project management tool",
  features: ["task boards", "team chat", "file sharing"],
});

const result = await team.run();
console.log(`Produced ${result.artifacts.length} files`);
```

## What Gets Generated

Each run produces a complete set of artifacts:

- **Requirements** — User stories, acceptance criteria, feature priorities
- **Architecture** — Tech stack decisions, ADRs, project structure
- **Frontend** — Design tokens, component hierarchy, global styles, React app, routing, state management, API client, error boundary, accessibility utilities
- **Backend** — OpenAPI spec, shared API types, Express server, auth routes, middleware, services, security report, security config guide
- **Database** — Schema, migrations, seed data
- **Tests** — Jest config, unit tests, integration tests, e2e test plan
- **DevOps** — Dockerfile, docker-compose, GitHub Actions CI/CD, env config
- **Docs** — README, contributing guide, accessibility audit

## Project Structure

```
src/
├── core/               # Base agent class and shared types
│   ├── agent.ts        # Abstract Agent base class
│   └── types.ts        # TypeScript types for tasks, artifacts, messages
├── agents/             # The 9 agents
│   ├── team-lead.ts    # Orchestrator
│   ├── planning/       # Product Manager, Architect
│   ├── frontend/       # Frontend Dev (design + a11y + implementation)
│   ├── backend/        # Backend Dev (API design + security + implementation), Database Engineer
│   ├── quality/        # QA Engineer
│   └── delivery/       # DevOps, Technical Writer
├── pipeline/           # Team runner and execution pipeline
│   └── team.ts         # AgentTeam orchestration
├── cli.ts              # CLI entry point
└── index.ts            # Public API
```

## Architecture

The system follows a **pipeline architecture** with dependency-aware task scheduling:

1. **Team Lead** decomposes the project spec into a task graph with dependencies
2. Tasks are executed in topological order — agents whose dependencies are met run in parallel
3. Each agent produces **artifacts** (code, config, docs, specs)
4. The pipeline progresses through phases: Requirements → Architecture → Implementation → Testing → Documentation → Deployment

## License

MIT
