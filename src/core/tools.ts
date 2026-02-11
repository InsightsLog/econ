/**
 * Tool System — The hands of the agents.
 *
 * Tools are typed, validated, composable operations that agents invoke
 * to interact with the world. Each tool declares its input/output schema,
 * permissions, and retry behavior. The ToolRegistry manages discovery,
 * access control, and execution telemetry.
 */

import type { AgentRole } from "./types";

// ─── Tool Schema ──────────────────────────────────────────────────────

export interface ToolParameter {
  name: string;
  type: "string" | "number" | "boolean" | "object" | "array";
  description: string;
  required?: boolean;
  default?: unknown;
  enum?: string[];
}

export interface ToolSchema {
  name: string;
  description: string;
  category: ToolCategory;
  parameters: ToolParameter[];
  returns: { type: string; description: string };
  permissions: ToolPermission[];
  retryable?: boolean;
  maxRetries?: number;
  timeoutMs?: number;
}

export type ToolCategory =
  | "filesystem"
  | "shell"
  | "http"
  | "code-analysis"
  | "database"
  | "search"
  | "transform"
  | "ai"
  | "mcp"
  | "custom";

export type ToolPermission =
  | "read"
  | "write"
  | "execute"
  | "network"
  | "elevated";

// ─── Tool Execution ───────────────────────────────────────────────────

export interface ToolInput {
  [key: string]: unknown;
}

export interface ToolResult<T = unknown> {
  success: boolean;
  data: T | null;
  error?: string;
  duration: number;
  retries: number;
  toolName: string;
  timestamp: number;
}

export type ToolExecutor = (
  input: ToolInput,
  context: ToolExecutionContext
) => Promise<unknown>;

export interface ToolExecutionContext {
  agentRole: AgentRole;
  workingDir: string;
  env: Record<string, string>;
  onProgress?: (message: string) => void;
}

// ─── Tool Definition ──────────────────────────────────────────────────

export interface Tool {
  schema: ToolSchema;
  execute: (input: ToolInput, context: ToolExecutionContext) => Promise<unknown>;
  validate?: (input: ToolInput) => string | null;
}

// ─── Tool Registry ────────────────────────────────────────────────────

export class ToolRegistry {
  private tools = new Map<string, Tool>();
  private accessControl = new Map<AgentRole, Set<string>>();
  private executionLog: ToolResult[] = [];

  /** Register a tool, making it available to agents */
  register(tool: Tool): void {
    if (this.tools.has(tool.schema.name)) {
      throw new Error(`Tool "${tool.schema.name}" is already registered`);
    }
    this.tools.set(tool.schema.name, tool);
  }

  /** Register multiple tools at once */
  registerAll(tools: Tool[]): void {
    for (const tool of tools) {
      this.register(tool);
    }
  }

  /** Grant an agent access to specific tools */
  grant(role: AgentRole, toolNames: string[]): void {
    const existing = this.accessControl.get(role) ?? new Set();
    for (const name of toolNames) {
      existing.add(name);
    }
    this.accessControl.set(role, existing);
  }

  /** Grant an agent access to all tools in a category */
  grantCategory(role: AgentRole, category: ToolCategory): void {
    const matching = Array.from(this.tools.values())
      .filter((t) => t.schema.category === category)
      .map((t) => t.schema.name);
    this.grant(role, matching);
  }

  /** Grant an agent access to every registered tool */
  grantAll(role: AgentRole): void {
    const all = Array.from(this.tools.keys());
    this.grant(role, all);
  }

  /** Check whether an agent can use a specific tool */
  canUse(role: AgentRole, toolName: string): boolean {
    const allowed = this.accessControl.get(role);
    if (!allowed) return false;
    return allowed.has(toolName) || allowed.has("*");
  }

  /** Look up a tool by name */
  get(name: string): Tool | undefined {
    return this.tools.get(name);
  }

  /** Get all tools an agent is allowed to use */
  getToolsForAgent(role: AgentRole): Tool[] {
    const allowed = this.accessControl.get(role);
    if (!allowed) return [];
    return Array.from(this.tools.values()).filter(
      (t) => allowed.has(t.schema.name) || allowed.has("*")
    );
  }

  /** Get all registered tools */
  getAllTools(): Tool[] {
    return Array.from(this.tools.values());
  }

  /** List tool names grouped by category */
  listByCategory(): Record<ToolCategory, string[]> {
    const result: Partial<Record<ToolCategory, string[]>> = {};
    for (const tool of this.tools.values()) {
      const cat = tool.schema.category;
      (result[cat] ??= []).push(tool.schema.name);
    }
    return result as Record<ToolCategory, string[]>;
  }

  /**
   * Execute a tool with full validation, access control, retry, and telemetry.
   * This is the primary way agents invoke tools.
   */
  async execute<TOut = unknown>(
    toolName: string,
    input: ToolInput,
    context: ToolExecutionContext
  ): Promise<ToolResult<TOut>> {
    const start = Date.now();
    let retries = 0;

    const tool = this.tools.get(toolName);
    if (!tool) {
      return this.fail(toolName, `Tool "${toolName}" not found`, start, retries);
    }

    // Access control
    if (!this.canUse(context.agentRole, toolName)) {
      return this.fail(
        toolName,
        `Agent "${context.agentRole}" does not have access to tool "${toolName}"`,
        start,
        retries
      );
    }

    // Input validation
    if (tool.validate) {
      const error = tool.validate(input);
      if (error) {
        return this.fail(toolName, `Validation failed: ${error}`, start, retries);
      }
    }

    // Parameter defaults
    const resolvedInput = { ...input };
    for (const param of tool.schema.parameters) {
      if (resolvedInput[param.name] === undefined && param.default !== undefined) {
        resolvedInput[param.name] = param.default;
      }
    }

    // Required parameter check
    for (const param of tool.schema.parameters) {
      if (param.required && resolvedInput[param.name] === undefined) {
        return this.fail(
          toolName,
          `Missing required parameter: "${param.name}"`,
          start,
          retries
        );
      }
    }

    // Execute with retry
    const maxRetries = tool.schema.maxRetries ?? (tool.schema.retryable ? 3 : 0);

    while (true) {
      try {
        const timeoutMs = tool.schema.timeoutMs ?? 30_000;
        const data = await this.withTimeout(
          tool.execute(resolvedInput, context),
          timeoutMs
        );
        const result: ToolResult<TOut> = {
          success: true,
          data: data as TOut,
          duration: Date.now() - start,
          retries,
          toolName,
          timestamp: Date.now(),
        };
        this.executionLog.push(result as ToolResult);
        return result;
      } catch (err) {
        retries++;
        if (retries > maxRetries) {
          const result = this.fail<TOut>(
            toolName,
            err instanceof Error ? err.message : String(err),
            start,
            retries
          );
          this.executionLog.push(result as ToolResult);
          return result;
        }
        // Exponential backoff: 100ms, 200ms, 400ms...
        await this.sleep(100 * Math.pow(2, retries - 1));
      }
    }
  }

  /** Get execution history for auditing/debugging */
  getExecutionLog(): ToolResult[] {
    return [...this.executionLog];
  }

  /** Clear execution log */
  clearLog(): void {
    this.executionLog = [];
  }

  private fail<TOut>(
    toolName: string,
    error: string,
    start: number,
    retries: number
  ): ToolResult<TOut> {
    return {
      success: false,
      data: null,
      error,
      duration: Date.now() - start,
      retries,
      toolName,
      timestamp: Date.now(),
    };
  }

  private withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error(`Timed out after ${ms}ms`)), ms);
      promise
        .then((v) => {
          clearTimeout(timer);
          resolve(v);
        })
        .catch((e) => {
          clearTimeout(timer);
          reject(e);
        });
    });
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// ─── Built-in Tools ───────────────────────────────────────────────────

/** Read a file from the workspace */
export const readFileTool: Tool = {
  schema: {
    name: "read_file",
    description: "Read the contents of a file in the project workspace",
    category: "filesystem",
    parameters: [
      { name: "path", type: "string", description: "Relative file path", required: true },
      { name: "encoding", type: "string", description: "File encoding", default: "utf-8" },
    ],
    returns: { type: "string", description: "File contents" },
    permissions: ["read"],
    retryable: true,
    maxRetries: 2,
  },
  execute: async (input, ctx) => {
    const fs = await import("node:fs/promises");
    const path = await import("node:path");
    const fullPath = path.resolve(ctx.workingDir, input.path as string);
    return fs.readFile(fullPath, { encoding: (input.encoding as BufferEncoding) ?? "utf-8" });
  },
};

/** Write a file to the workspace */
export const writeFileTool: Tool = {
  schema: {
    name: "write_file",
    description: "Write content to a file in the project workspace, creating directories if needed",
    category: "filesystem",
    parameters: [
      { name: "path", type: "string", description: "Relative file path", required: true },
      { name: "content", type: "string", description: "File content to write", required: true },
      { name: "mkdir", type: "boolean", description: "Create parent directories", default: true },
    ],
    returns: { type: "string", description: "Absolute path of written file" },
    permissions: ["write"],
  },
  execute: async (input, ctx) => {
    const fs = await import("node:fs/promises");
    const path = await import("node:path");
    const fullPath = path.resolve(ctx.workingDir, input.path as string);
    if (input.mkdir !== false) {
      await fs.mkdir(path.dirname(fullPath), { recursive: true });
    }
    await fs.writeFile(fullPath, input.content as string, "utf-8");
    return fullPath;
  },
};

/** List files matching a glob pattern */
export const globTool: Tool = {
  schema: {
    name: "glob",
    description: "List files matching a glob pattern in the workspace",
    category: "filesystem",
    parameters: [
      { name: "pattern", type: "string", description: "Glob pattern (e.g. **/*.ts)", required: true },
      { name: "cwd", type: "string", description: "Directory to search in" },
    ],
    returns: { type: "array", description: "Matching file paths" },
    permissions: ["read"],
    retryable: true,
  },
  execute: async (input, ctx) => {
    const fs = await import("node:fs/promises");
    const path = await import("node:path");
    const searchDir = path.resolve(ctx.workingDir, (input.cwd as string) ?? ".");
    // Simple recursive glob implementation
    const results: string[] = [];
    const walk = async (dir: string): Promise<void> => {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        const relPath = path.relative(ctx.workingDir, fullPath);
        if (entry.isDirectory() && !entry.name.startsWith(".") && entry.name !== "node_modules") {
          await walk(fullPath);
        } else if (entry.isFile()) {
          if (matchGlob(relPath, input.pattern as string)) {
            results.push(relPath);
          }
        }
      }
    };
    await walk(searchDir);
    return results;
  },
};

/** Execute a shell command in the workspace */
export const shellTool: Tool = {
  schema: {
    name: "shell",
    description: "Execute a shell command in the workspace. Use responsibly.",
    category: "shell",
    parameters: [
      { name: "command", type: "string", description: "Shell command to execute", required: true },
      { name: "cwd", type: "string", description: "Working directory" },
      { name: "timeout", type: "number", description: "Timeout in ms", default: 30000 },
    ],
    returns: { type: "object", description: "Command output with stdout, stderr, exitCode" },
    permissions: ["execute"],
    retryable: false,
    timeoutMs: 60_000,
  },
  execute: async (input, ctx) => {
    const { execSync } = await import("node:child_process");
    const path = await import("node:path");
    const cwd = path.resolve(ctx.workingDir, (input.cwd as string) ?? ".");
    try {
      const stdout = execSync(input.command as string, {
        cwd,
        timeout: (input.timeout as number) ?? 30000,
        encoding: "utf-8",
        env: { ...process.env, ...ctx.env },
        maxBuffer: 10 * 1024 * 1024,
      });
      return { stdout: stdout.toString(), stderr: "", exitCode: 0 };
    } catch (err: any) {
      return {
        stdout: err.stdout?.toString() ?? "",
        stderr: err.stderr?.toString() ?? err.message,
        exitCode: err.status ?? 1,
      };
    }
  },
};

/** Make an HTTP request */
export const httpTool: Tool = {
  schema: {
    name: "http_request",
    description: "Make an HTTP request to an external URL",
    category: "http",
    parameters: [
      { name: "url", type: "string", description: "Request URL", required: true },
      { name: "method", type: "string", description: "HTTP method", default: "GET", enum: ["GET", "POST", "PUT", "PATCH", "DELETE"] },
      { name: "headers", type: "object", description: "Request headers" },
      { name: "body", type: "string", description: "Request body" },
    ],
    returns: { type: "object", description: "Response with status, headers, body" },
    permissions: ["network"],
    retryable: true,
    maxRetries: 3,
    timeoutMs: 15_000,
  },
  execute: async (input) => {
    const response = await globalThis.fetch(input.url as string, {
      method: (input.method as string) ?? "GET",
      headers: input.headers as Record<string, string>,
      body: input.body as string | undefined,
    });
    const responseHeaders: Record<string, string> = {};
    response.headers.forEach((value: string, key: string) => {
      responseHeaders[key] = value;
    });
    const body = await response.text();
    return { status: response.status, headers: responseHeaders, body };
  },
};

/** Search for text patterns across files */
export const grepTool: Tool = {
  schema: {
    name: "grep",
    description: "Search for a regex pattern across files in the workspace",
    category: "search",
    parameters: [
      { name: "pattern", type: "string", description: "Regex pattern to search for", required: true },
      { name: "path", type: "string", description: "Directory to search in", default: "." },
      { name: "filePattern", type: "string", description: "Filter files by glob pattern" },
    ],
    returns: { type: "array", description: "Matching lines with file, line number, and content" },
    permissions: ["read"],
    retryable: true,
  },
  execute: async (input, ctx) => {
    const fs = await import("node:fs/promises");
    const path = await import("node:path");
    const searchDir = path.resolve(ctx.workingDir, (input.path as string) ?? ".");
    const regex = new RegExp(input.pattern as string, "g");
    const results: Array<{ file: string; line: number; content: string }> = [];

    const walk = async (dir: string): Promise<void> => {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.name.startsWith(".") || entry.name === "node_modules") continue;
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          await walk(fullPath);
        } else if (entry.isFile() && entry.name.match(/\.(ts|tsx|js|jsx|json|md|css|html|sql|yaml|yml)$/)) {
          const relPath = path.relative(ctx.workingDir, fullPath);
          if (input.filePattern && !matchGlob(relPath, input.filePattern as string)) continue;
          try {
            const content = await fs.readFile(fullPath, "utf-8");
            const lines = content.split("\n");
            for (let i = 0; i < lines.length; i++) {
              if (regex.test(lines[i])) {
                results.push({ file: relPath, line: i + 1, content: lines[i].trim() });
              }
              regex.lastIndex = 0;
            }
          } catch {
            // skip unreadable files
          }
        }
      }
    };
    await walk(searchDir);
    return results;
  },
};

/** Analyze code structure -- extract exports, imports, and signatures */
export const codeAnalysisTool: Tool = {
  schema: {
    name: "analyze_code",
    description: "Analyze a source file's structure: exports, imports, classes, functions",
    category: "code-analysis",
    parameters: [
      { name: "path", type: "string", description: "File path to analyze", required: true },
    ],
    returns: { type: "object", description: "Structural analysis of the source file" },
    permissions: ["read"],
  },
  execute: async (input, ctx) => {
    const fs = await import("node:fs/promises");
    const pathMod = await import("node:path");
    const fullPath = pathMod.resolve(ctx.workingDir, input.path as string);
    const content = await fs.readFile(fullPath, "utf-8");
    const lines = content.split("\n");

    const exports = lines
      .filter((l: string) => /^export\s/.test(l))
      .map((l: string) => l.trim().slice(0, 120));
    const imports = lines
      .filter((l: string) => /^import\s/.test(l))
      .map((l: string) => l.trim().slice(0, 120));
    const classes = lines
      .filter((l: string) => /class\s+\w+/.test(l))
      .map((l: string) => {
        const m = l.match(/class\s+(\w+)/);
        return m ? m[1] : l.trim();
      });
    const functions = lines
      .filter((l: string) => /(?:function\s+\w+|(?:async\s+)?(?:readonly\s+)?\w+\s*\(|=>\s*\{)/.test(l) && !/import|require/.test(l))
      .map((l: string) => l.trim().slice(0, 120))
      .slice(0, 50);

    return { exports, imports, classes, functions, lineCount: lines.length };
  },
};

/** JSON transform / jq-like queries */
export const jsonTransformTool: Tool = {
  schema: {
    name: "json_transform",
    description: "Parse and query JSON data with dot-notation paths",
    category: "transform",
    parameters: [
      { name: "data", type: "string", description: "JSON string to query", required: true },
      { name: "query", type: "string", description: "Dot-notation path (e.g. 'users.0.name' or 'items.length')", required: true },
    ],
    returns: { type: "object", description: "Query result" },
    permissions: ["read"],
  },
  execute: async (input) => {
    const data = JSON.parse(input.data as string);
    const parts = (input.query as string).split(".");
    let current: any = data;
    for (const part of parts) {
      if (current === undefined || current === null) return null;
      current = current[part];
    }
    return current;
  },
};

// ─── Built-in tool collection ─────────────────────────────────────────

export function createBuiltinTools(): Tool[] {
  return [
    readFileTool,
    writeFileTool,
    globTool,
    shellTool,
    httpTool,
    grepTool,
    codeAnalysisTool,
    jsonTransformTool,
  ];
}

// ─── Helpers ──────────────────────────────────────────────────────────

function matchGlob(filePath: string, pattern: string): boolean {
  const regexStr = pattern
    .replace(/\./g, "\\.")
    .replace(/\*\*/g, "{{GLOBSTAR}}")
    .replace(/\*/g, "[^/]*")
    .replace(/\{\{GLOBSTAR\}\}/g, ".*");
  return new RegExp(`^${regexStr}$`).test(filePath);
}
