import { Agent } from "../../core/agent";
import {
  AgentRole,
  Artifact,
  ArtifactType,
  ProjectState,
  Task,
} from "../../core/types";

/**
 * Agent 12: DevOps Engineer
 *
 * Sets up CI/CD pipelines, Docker containerization,
 * environment configuration, and deployment scripts.
 */
export class DevOpsAgent extends Agent {
  readonly role = AgentRole.DevOps;
  readonly name = "DevOps Engineer";
  readonly description =
    "Creates CI/CD pipelines, Docker configs, environment setup, and deployment automation";
  readonly capabilities = [
    "docker",
    "ci-cd",
    "environment-config",
    "deployment-scripts",
    "monitoring",
    "infrastructure",
  ];

  getSystemPrompt(): string {
    return `You are a senior DevOps Engineer on a 13-agent AI engineering team.
Your job is to:
- Create Dockerfile for containerized deployment
- Set up CI/CD pipeline (GitHub Actions)
- Configure environment variables for dev/staging/production
- Write deployment scripts
- Set up health checks and basic monitoring
- Create docker-compose for local development`;
  }

  async execute(task: Task, state: ProjectState): Promise<Artifact[]> {
    this.log("Setting up CI/CD and deployment infrastructure...");
    const artifacts: Artifact[] = [];

    // Dockerfile
    artifacts.push(
      this.createArtifact(
        ArtifactType.Pipeline,
        "Dockerfile",
        `# Multi-stage build for production
FROM node:20-alpine AS base
WORKDIR /app
COPY package*.json ./

# Dependencies stage
FROM base AS deps
RUN npm ci --only=production

# Build stage
FROM base AS build
RUN npm ci
COPY . .
RUN npm run build

# Production stage
FROM node:20-alpine AS production
WORKDIR /app
ENV NODE_ENV=production

# Create non-root user
RUN addgroup -g 1001 -S appgroup && \\
    adduser -S appuser -u 1001 -G appgroup

COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY package*.json ./

USER appuser
EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \\
  CMD wget --no-verbose --tries=1 --spider http://localhost:3001/health || exit 1

CMD ["node", "dist/server/index.js"]
`,
        "Multi-stage Dockerfile with non-root user and health check"
      )
    );

    // Docker Compose
    artifacts.push(
      this.createArtifact(
        ArtifactType.Pipeline,
        "docker-compose.yml",
        `version: "3.9"

services:
  app:
    build: .
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=development
      - PORT=3001
      - DATABASE_URL=postgres://postgres:postgres@db:5432/${state.spec.name.toLowerCase().replace(/\s+/g, "_")}
      - JWT_SECRET=dev-secret-change-in-production
      - CORS_ORIGIN=http://localhost:3000
    depends_on:
      db:
        condition: service_healthy
    volumes:
      - ./src:/app/src
    restart: unless-stopped

  db:
    image: postgres:16-alpine
    ports:
      - "5432:5432"
    environment:
      - POSTGRES_DB=${state.spec.name.toLowerCase().replace(/\s+/g, "_")}
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=postgres
    volumes:
      - pgdata:/var/lib/postgresql/data
      - ./migrations:/docker-entrypoint-initdb.d
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 5s
      timeout: 5s
      retries: 5

volumes:
  pgdata:
`,
        "Docker Compose config for local development with PostgreSQL"
      )
    );

    // GitHub Actions CI/CD
    artifacts.push(
      this.createArtifact(
        ArtifactType.Pipeline,
        ".github/workflows/ci.yml",
        `name: CI/CD Pipeline

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  lint-and-type-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci
      - run: npm run lint

  test:
    runs-on: ubuntu-latest
    needs: lint-and-type-check
    services:
      postgres:
        image: postgres:16-alpine
        env:
          POSTGRES_DB: test_db
          POSTGRES_USER: postgres
          POSTGRES_PASSWORD: postgres
        ports:
          - 5432:5432
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci
      - run: npm test -- --coverage
        env:
          DATABASE_URL: postgres://postgres:postgres@localhost:5432/test_db
          JWT_SECRET: test-secret
      - uses: actions/upload-artifact@v4
        with:
          name: coverage-report
          path: coverage/

  build:
    runs-on: ubuntu-latest
    needs: test
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci
      - run: npm run build

  docker:
    runs-on: ubuntu-latest
    needs: build
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v4
      - uses: docker/setup-buildx-action@v3
      - uses: docker/build-push-action@v5
        with:
          context: .
          push: false
          tags: ${state.spec.name.toLowerCase().replace(/\s+/g, "-")}:latest
          cache-from: type=gha
          cache-to: type=gha,mode=max
`,
        "GitHub Actions CI/CD pipeline with lint, test, build, and Docker stages"
      )
    );

    // Environment config template
    artifacts.push(
      this.createArtifact(
        ArtifactType.Config,
        ".env.example",
        `# Server
NODE_ENV=development
PORT=3001

# Database
DATABASE_URL=postgres://postgres:postgres@localhost:5432/${state.spec.name.toLowerCase().replace(/\s+/g, "_")}

# Authentication
JWT_SECRET=change-me-in-production

# CORS
CORS_ORIGIN=http://localhost:3000

# Logging
LOG_LEVEL=debug
`,
        "Environment variable template"
      )
    );

    // .dockerignore
    artifacts.push(
      this.createArtifact(
        ArtifactType.Config,
        ".dockerignore",
        `node_modules
dist
.git
.github
.env
.env.local
*.md
tests
coverage
.vscode
`,
        "Docker ignore file to reduce build context"
      )
    );

    // .gitignore
    artifacts.push(
      this.createArtifact(
        ArtifactType.Config,
        ".gitignore",
        `node_modules/
dist/
coverage/
.env
.env.local
*.log
.DS_Store
`,
        "Git ignore file"
      )
    );

    this.log(`Created Dockerfile, docker-compose, CI/CD pipeline, and environment configs`);
    return artifacts;
  }
}
