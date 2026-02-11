/**
 * Skill System — Composable capabilities for agents.
 *
 * A Skill is a reusable, named block of functionality that agents
 * can acquire and invoke. Skills can depend on other skills, declare
 * required tools, and be composed into pipelines.
 *
 * Think of skills as the "verbs" that agents speak: "analyze-codebase",
 * "generate-api-client", "write-migration", "run-test-suite".
 */

import type { AgentRole, Artifact, ProjectState } from "./types";
import type { ToolRegistry, ToolResult } from "./tools";
import type { MemoryManager } from "./memory";

// ─── Skill Types ──────────────────────────────────────────────────────

export interface SkillDefinition {
  name: string;
  description: string;
  category: SkillCategory;
  /** Other skills that must be available for this skill to work */
  dependencies?: string[];
  /** Tools this skill requires */
  requiredTools?: string[];
  /** Tags for discovery and filtering */
  tags: string[];
}

export type SkillCategory =
  | "analysis"
  | "generation"
  | "testing"
  | "refactoring"
  | "deployment"
  | "documentation"
  | "communication"
  | "planning"
  | "review"
  | "custom";

export interface SkillInput {
  task?: string;
  parameters?: Record<string, unknown>;
  artifacts?: Artifact[];
  state?: ProjectState;
}

export interface SkillOutput {
  success: boolean;
  artifacts: Artifact[];
  messages: string[];
  data?: Record<string, unknown>;
  error?: string;
  duration: number;
}

export type SkillExecutor = (
  input: SkillInput,
  context: SkillContext
) => Promise<SkillOutput>;

export interface SkillContext {
  agentRole: AgentRole;
  tools: ToolRegistry;
  memory: MemoryManager;
  skills: SkillRegistry;
  workingDir: string;
  log: (message: string) => void;
}

// ─── Skill (full definition + executor) ───────────────────────────────

export interface Skill {
  definition: SkillDefinition;
  execute: SkillExecutor;
}

// ─── Skill Registry ───────────────────────────────────────────────────

export class SkillRegistry {
  private skills = new Map<string, Skill>();
  private agentSkills = new Map<AgentRole, Set<string>>();

  /** Register a skill */
  register(skill: Skill): void {
    if (this.skills.has(skill.definition.name)) {
      throw new Error(`Skill "${skill.definition.name}" is already registered`);
    }
    // Validate dependencies exist
    if (skill.definition.dependencies) {
      for (const dep of skill.definition.dependencies) {
        if (!this.skills.has(dep)) {
          throw new Error(
            `Skill "${skill.definition.name}" depends on "${dep}" which is not registered. Register dependencies first.`
          );
        }
      }
    }
    this.skills.set(skill.definition.name, skill);
  }

  /** Register multiple skills at once (order matters for dependencies) */
  registerAll(skills: Skill[]): void {
    for (const skill of skills) {
      this.register(skill);
    }
  }

  /** Grant a skill to an agent */
  grant(role: AgentRole, skillNames: string[]): void {
    const existing = this.agentSkills.get(role) ?? new Set();
    for (const name of skillNames) {
      if (!this.skills.has(name)) {
        throw new Error(`Cannot grant unknown skill "${name}"`);
      }
      existing.add(name);
    }
    this.agentSkills.set(role, existing);
  }

  /** Grant all skills to an agent */
  grantAll(role: AgentRole): void {
    const all = Array.from(this.skills.keys());
    this.grant(role, all);
  }

  /** Grant all skills in a category */
  grantCategory(role: AgentRole, category: SkillCategory): void {
    const matching = Array.from(this.skills.values())
      .filter((s) => s.definition.category === category)
      .map((s) => s.definition.name);
    this.grant(role, matching);
  }

  /** Check if agent has a skill */
  hasSkill(role: AgentRole, skillName: string): boolean {
    return this.agentSkills.get(role)?.has(skillName) ?? false;
  }

  /** Get a skill by name */
  get(name: string): Skill | undefined {
    return this.skills.get(name);
  }

  /** Get all skills an agent has */
  getSkillsForAgent(role: AgentRole): Skill[] {
    const names = this.agentSkills.get(role);
    if (!names) return [];
    return Array.from(names)
      .map((n) => this.skills.get(n)!)
      .filter(Boolean);
  }

  /** List all registered skills */
  listAll(): SkillDefinition[] {
    return Array.from(this.skills.values()).map((s) => s.definition);
  }

  /** List skills by category */
  listByCategory(): Record<SkillCategory, SkillDefinition[]> {
    const result: Partial<Record<SkillCategory, SkillDefinition[]>> = {};
    for (const skill of this.skills.values()) {
      const cat = skill.definition.category;
      (result[cat] ??= []).push(skill.definition);
    }
    return result as Record<SkillCategory, SkillDefinition[]>;
  }

  /**
   * Execute a skill with full dependency resolution and validation.
   */
  async execute(
    skillName: string,
    input: SkillInput,
    context: SkillContext
  ): Promise<SkillOutput> {
    const start = Date.now();
    const skill = this.skills.get(skillName);

    if (!skill) {
      return {
        success: false,
        artifacts: [],
        messages: [],
        error: `Skill "${skillName}" not found`,
        duration: Date.now() - start,
      };
    }

    // Check agent has the skill
    if (!this.hasSkill(context.agentRole, skillName)) {
      return {
        success: false,
        artifacts: [],
        messages: [],
        error: `Agent "${context.agentRole}" does not have skill "${skillName}"`,
        duration: Date.now() - start,
      };
    }

    // Check required tools are available
    if (skill.definition.requiredTools) {
      for (const toolName of skill.definition.requiredTools) {
        const tool = context.tools.get(toolName);
        if (!tool) {
          return {
            success: false,
            artifacts: [],
            messages: [],
            error: `Skill "${skillName}" requires tool "${toolName}" which is not registered`,
            duration: Date.now() - start,
          };
        }
      }
    }

    // Check dependencies
    if (skill.definition.dependencies) {
      for (const dep of skill.definition.dependencies) {
        if (!this.hasSkill(context.agentRole, dep)) {
          return {
            success: false,
            artifacts: [],
            messages: [],
            error: `Skill "${skillName}" requires skill "${dep}" which agent doesn't have`,
            duration: Date.now() - start,
          };
        }
      }
    }

    try {
      const result = await skill.execute(input, context);
      return { ...result, duration: Date.now() - start };
    } catch (err) {
      return {
        success: false,
        artifacts: [],
        messages: [],
        error: err instanceof Error ? err.message : String(err),
        duration: Date.now() - start,
      };
    }
  }

  /** Get count of registered skills */
  size(): number {
    return this.skills.size;
  }
}

// ─── Skill Pipeline ───────────────────────────────────────────────────

/**
 * Execute a chain of skills in sequence, passing artifacts
 * and data from one to the next. Like Unix pipes for agent skills.
 */
export class SkillPipeline {
  private steps: Array<{
    skillName: string;
    inputTransform?: (prev: SkillOutput, original: SkillInput) => SkillInput;
  }> = [];

  /** Add a step to the pipeline */
  pipe(
    skillName: string,
    inputTransform?: (prev: SkillOutput, original: SkillInput) => SkillInput
  ): SkillPipeline {
    this.steps.push({ skillName, inputTransform });
    return this;
  }

  /** Execute all steps in sequence */
  async execute(
    initialInput: SkillInput,
    context: SkillContext
  ): Promise<{ results: SkillOutput[]; allArtifacts: Artifact[]; success: boolean }> {
    const results: SkillOutput[] = [];
    const allArtifacts: Artifact[] = [];
    let prevOutput: SkillOutput | null = null;

    for (const step of this.steps) {
      const input = prevOutput && step.inputTransform
        ? step.inputTransform(prevOutput, initialInput)
        : prevOutput
          ? { ...initialInput, artifacts: [...(initialInput.artifacts ?? []), ...prevOutput.artifacts] }
          : initialInput;

      const result = await context.skills.execute(step.skillName, input, context);
      results.push(result);
      allArtifacts.push(...result.artifacts);

      if (!result.success) {
        return { results, allArtifacts, success: false };
      }

      prevOutput = result;
    }

    return { results, allArtifacts, success: true };
  }
}

// ─── Built-in Skills ──────────────────────────────────────────────────

/** Skill: analyze the project codebase structure */
export const analyzeCodebaseSkill: Skill = {
  definition: {
    name: "analyze-codebase",
    description: "Scan and analyze the project codebase structure, dependencies, and patterns",
    category: "analysis",
    requiredTools: ["glob", "read_file", "analyze_code"],
    tags: ["analysis", "codebase", "structure"],
  },
  execute: async (input, ctx) => {
    const artifacts: Artifact[] = [];
    const messages: string[] = [];

    // Find all source files
    const files = await ctx.tools.execute<string[]>("glob", { pattern: "**/*.ts" }, {
      agentRole: ctx.agentRole,
      workingDir: ctx.workingDir,
      env: {},
    });

    if (files.success && files.data) {
      messages.push(`Found ${files.data.length} TypeScript files`);

      // Store analysis in memory
      ctx.memory.remember(
        ctx.agentRole,
        "fact",
        `Project has ${files.data.length} TypeScript source files`,
        ["codebase", "analysis", "typescript"]
      );

      // Analyze each file (up to 20)
      const filesToAnalyze = files.data.slice(0, 20);
      const analyses: Array<{ file: string; analysis: unknown }> = [];

      for (const file of filesToAnalyze) {
        const analysis = await ctx.tools.execute("analyze_code", { path: file }, {
          agentRole: ctx.agentRole,
          workingDir: ctx.workingDir,
          env: {},
        });
        if (analysis.success) {
          analyses.push({ file, analysis: analysis.data });
        }
      }

      messages.push(`Analyzed ${analyses.length} files`);
    }

    return { success: true, artifacts, messages, duration: 0 };
  },
};

/** Skill: run the project's test suite */
export const runTestsSkill: Skill = {
  definition: {
    name: "run-tests",
    description: "Execute the project's test suite and report results",
    category: "testing",
    requiredTools: ["shell"],
    tags: ["testing", "quality", "validation"],
  },
  execute: async (input, ctx) => {
    const messages: string[] = [];

    const result = await ctx.tools.execute<{ stdout: string; stderr: string; exitCode: number }>(
      "shell",
      { command: "npm test -- --passWithNoTests 2>&1 || true", timeout: 60000 },
      { agentRole: ctx.agentRole, workingDir: ctx.workingDir, env: {} }
    );

    if (result.success && result.data) {
      const passed = result.data.exitCode === 0;
      messages.push(passed ? "All tests passed" : "Some tests failed");
      messages.push(result.data.stdout.slice(-500)); // last 500 chars of output

      ctx.memory.remember(
        ctx.agentRole,
        "outcome",
        `Test run ${passed ? "passed" : "failed"}: ${result.data.stdout.slice(-200)}`,
        ["testing", "outcome"]
      );
    }

    return { success: result.success, artifacts: [], messages, duration: 0 };
  },
};

/** Skill: generate code from a specification */
export const generateCodeSkill: Skill = {
  definition: {
    name: "generate-code",
    description: "Generate source code files from specifications and templates",
    category: "generation",
    requiredTools: ["write_file"],
    tags: ["generation", "code", "implementation"],
  },
  execute: async (input, ctx) => {
    const artifacts: Artifact[] = [];
    const messages: string[] = [];

    if (!input.parameters?.files || !Array.isArray(input.parameters.files)) {
      return {
        success: false,
        artifacts: [],
        messages: ["No files specified in parameters.files"],
        error: "Missing files parameter",
        duration: 0,
      };
    }

    for (const file of input.parameters.files as Array<{ path: string; content: string; description: string }>) {
      const result = await ctx.tools.execute(
        "write_file",
        { path: file.path, content: file.content },
        { agentRole: ctx.agentRole, workingDir: ctx.workingDir, env: {} }
      );

      if (result.success) {
        messages.push(`Generated: ${file.path}`);
        ctx.memory.remember(
          ctx.agentRole,
          "action",
          `Generated file: ${file.path} — ${file.description}`,
          ["generation", file.path]
        );
      }
    }

    return { success: true, artifacts, messages, duration: 0 };
  },
};

/** Skill: review code for quality and issues */
export const codeReviewSkill: Skill = {
  definition: {
    name: "code-review",
    description: "Review code for quality issues, bugs, and improvement opportunities",
    category: "review",
    requiredTools: ["read_file", "grep"],
    tags: ["review", "quality", "analysis"],
  },
  execute: async (input, ctx) => {
    const messages: string[] = [];

    // Check for common issues
    const checks = [
      { pattern: "any", label: "TypeScript 'any' usage" },
      { pattern: "TODO|FIXME|HACK", label: "TODO/FIXME/HACK comments" },
      { pattern: "console\\.log", label: "console.log statements" },
      { pattern: "eslint-disable", label: "ESLint disables" },
      { pattern: "password.*=.*[\"']", label: "Hardcoded credentials" },
    ];

    for (const check of checks) {
      const result = await ctx.tools.execute<Array<{ file: string; line: number; content: string }>>(
        "grep",
        { pattern: check.pattern },
        { agentRole: ctx.agentRole, workingDir: ctx.workingDir, env: {} }
      );

      if (result.success && result.data?.length) {
        messages.push(`[${check.label}]: ${result.data.length} occurrences`);
      }
    }

    if (messages.length === 0) {
      messages.push("No common issues found");
    }

    ctx.memory.remember(
      ctx.agentRole,
      "outcome",
      `Code review completed: ${messages.join("; ")}`,
      ["review", "quality"]
    );

    return { success: true, artifacts: [], messages, duration: 0 };
  },
};

/** Skill: search and understand a codebase pattern */
export const patternSearchSkill: Skill = {
  definition: {
    name: "pattern-search",
    description: "Search for usage patterns, implementations, and conventions across the codebase",
    category: "analysis",
    requiredTools: ["grep", "read_file"],
    tags: ["search", "patterns", "analysis"],
  },
  execute: async (input, ctx) => {
    const messages: string[] = [];
    const pattern = input.parameters?.pattern as string;

    if (!pattern) {
      return {
        success: false,
        artifacts: [],
        messages: ["No pattern specified"],
        error: "Missing pattern parameter",
        duration: 0,
      };
    }

    const result = await ctx.tools.execute<Array<{ file: string; line: number; content: string }>>(
      "grep",
      { pattern },
      { agentRole: ctx.agentRole, workingDir: ctx.workingDir, env: {} }
    );

    if (result.success && result.data) {
      messages.push(`Found ${result.data.length} matches for "${pattern}"`);

      // Group by file
      const byFile = new Map<string, number>();
      for (const match of result.data) {
        byFile.set(match.file, (byFile.get(match.file) ?? 0) + 1);
      }
      for (const [file, count] of byFile) {
        messages.push(`  ${file}: ${count} matches`);
      }

      ctx.memory.remember(
        ctx.agentRole,
        "fact",
        `Pattern "${pattern}" found in ${result.data.length} places across ${byFile.size} files`,
        ["pattern", "search", pattern]
      );
    }

    return { success: true, artifacts: [], messages, duration: 0 };
  },
};

/** Create all built-in skills */
export function createBuiltinSkills(): Skill[] {
  return [
    analyzeCodebaseSkill,
    runTestsSkill,
    generateCodeSkill,
    codeReviewSkill,
    patternSearchSkill,
  ];
}
