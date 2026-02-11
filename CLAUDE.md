# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Development Commands

```bash
npm install          # Install dependencies
npm run build        # Compile TypeScript (tsc → dist/)
npm start            # Run compiled CLI: node dist/cli.js
npm run dev          # Run with ts-node: ts-node src/cli.ts
npm run lint         # Type check only: tsc --noEmit
```

No test framework is configured yet.

## CLI Usage

```bash
econ "A social media app with real-time chat"        # Natural language
econ --name myapp --features "auth,chat" --frontend react --backend express --database postgresql
```

Running with no arguments launches a demo project (TaskFlow).

## Architecture

**econ** is a TypeScript multi-agent orchestration system that generates complete web applications from high-level specs. 9 specialized AI agents collaborate through a phased pipeline.

### Core Framework (`src/core/`)

- **`agent.ts`** — Abstract `Agent` base class. All agents extend this and implement `execute(task, state): Promise<Artifact[]>` and `getSystemPrompt(): string`.
- **`context.ts`** — `AgentContext` (unified execution environment), `EventBus` (pub/sub inter-agent communication), `KnowledgeGraph` (semantic entity relationships).
- **`tools.ts`** — Tool registry with schema validation, access control, retry logic, and built-in tools (filesystem, shell, HTTP, search, code analysis).
- **`memory.ts`** — Three-tier memory: Working (per-task scratch), Episodic (session action log), Semantic (persistent facts).
- **`skills.ts`** — Composable capability registry with dependency resolution.
- **`hooks.ts`** — Lifecycle middleware at 12 stages (beforeExecute, afterExecute, onError, etc.).
- **`mcp.ts`** — Model Context Protocol client for external tool server integration.
- **`types.ts`** — All core types and enums (`AgentRole`, `Task`, `Artifact`, `ProjectState`, `ProjectPhase`, etc.).

### Agent Groups (`src/agents/`)

| Phase | Agents |
|---|---|
| Planning | `ProductManagerAgent`, `ArchitectAgent` |
| Implementation | `FrontendDevAgent` (design + a11y + UI), `BackendDevAgent` (API design + security + server), `DatabaseEngineerAgent` |
| Quality | `QAEngineerAgent` |
| Delivery | `DevOpsAgent`, `TechnicalWriterAgent` |
| Orchestration | `TeamLeadAgent` (decomposes specs into task graphs, manages phases) |

### Pipeline (`src/pipeline/team.ts`)

`AgentTeam` orchestrates the full workflow:
1. Team Lead decomposes the project spec into a dependency-aware task graph
2. Pipeline iterates phases: Requirements → Architecture → Implementation → Testing → Documentation → Deployment
3. Within each phase, tasks with met dependencies execute in parallel via `Promise.allSettled`
4. Each agent's `executeWithContext()` wraps execution with hooks, memory tracking, event emission, and knowledge graph updates
5. Phase transitions occur when all tasks in the current phase complete (max 20 iterations)

### Key Execution Flow

`AgentTeam.execute(spec)` → `TeamLeadAgent.execute()` creates task graph → pipeline loop picks ready tasks → assigns to agents → agents produce `Artifact[]` → artifacts/state tracked in `ProjectState` → final state returned with all generated code, configs, docs.

## Conventions

- **Agent classes**: `{Name}Agent` (e.g., `FrontendDevAgent`)
- **Tool names**: snake_case (`read_file`, `write_file`)
- **Skill names**: kebab-case (`analyze-codebase`, `run-tests`)
- **Artifact paths**: relative from project root (`src/client/App.tsx`)
- **Logging**: `this.log()` in agents, format `[HH:MM:SS] [AgentName] message`
- **Async**: All async operations use async/await; parallel execution uses `Promise.allSettled`
- **Strict TypeScript**: `strict: true`, target ES2022, CommonJS modules
- **Config extensibility**: `TeamConfig` accepts custom tools, skills, hooks, MCP servers
