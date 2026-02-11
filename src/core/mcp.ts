/**
 * MCP Integration — Model Context Protocol client.
 *
 * Connects agents to external tool servers via the Model Context
 * Protocol. MCP servers expose tools, resources, and prompts that
 * agents can discover and invoke at runtime.
 *
 * This enables the agent team to integrate with:
 * - File systems, databases, APIs
 * - Code editors, browsers, terminals
 * - Custom enterprise tools
 * - Other AI services
 */

import type { AgentRole } from "./types";
import type { Tool, ToolInput, ToolSchema, ToolCategory } from "./tools";

// ─── MCP Types ────────────────────────────────────────────────────────

export interface MCPServerConfig {
  /** Unique identifier for this server */
  name: string;
  /** Human-readable description */
  description?: string;
  /** Transport type */
  transport: MCPTransport;
  /** Server capabilities we care about */
  capabilities?: MCPCapability[];
  /** Auto-connect on startup */
  autoConnect?: boolean;
  /** Timeout for requests in ms */
  timeoutMs?: number;
  /** Retry config */
  retry?: { maxRetries: number; backoffMs: number };
}

export type MCPTransport =
  | { type: "stdio"; command: string; args?: string[]; env?: Record<string, string> }
  | { type: "sse"; url: string; headers?: Record<string, string> }
  | { type: "http"; url: string; headers?: Record<string, string> };

export type MCPCapability = "tools" | "resources" | "prompts" | "sampling";

export interface MCPToolDefinition {
  name: string;
  description: string;
  inputSchema: {
    type: "object";
    properties: Record<string, { type: string; description?: string; enum?: string[] }>;
    required?: string[];
  };
}

export interface MCPResource {
  uri: string;
  name: string;
  description?: string;
  mimeType?: string;
}

export interface MCPPrompt {
  name: string;
  description?: string;
  arguments?: Array<{ name: string; description?: string; required?: boolean }>;
}

export interface MCPCallResult {
  content: Array<{ type: "text" | "image" | "resource"; text?: string; data?: string; mimeType?: string }>;
  isError?: boolean;
}

// ─── MCP Connection State ─────────────────────────────────────────────

export type MCPConnectionStatus = "disconnected" | "connecting" | "connected" | "error";

export interface MCPConnection {
  config: MCPServerConfig;
  status: MCPConnectionStatus;
  tools: MCPToolDefinition[];
  resources: MCPResource[];
  prompts: MCPPrompt[];
  lastError?: string;
  connectedAt?: number;
}

// ─── MCP Client ───────────────────────────────────────────────────────

/**
 * Manages connections to MCP servers and provides a unified
 * interface for discovering and invoking external tools.
 */
export class MCPClient {
  private connections = new Map<string, MCPConnection>();
  private callLog: Array<{
    server: string;
    tool: string;
    duration: number;
    success: boolean;
    timestamp: number;
  }> = [];

  /** Register an MCP server configuration */
  addServer(config: MCPServerConfig): void {
    if (this.connections.has(config.name)) {
      throw new Error(`MCP server "${config.name}" is already registered`);
    }
    this.connections.set(config.name, {
      config,
      status: "disconnected",
      tools: [],
      resources: [],
      prompts: [],
    });
  }

  /** Remove an MCP server */
  removeServer(name: string): boolean {
    const conn = this.connections.get(name);
    if (!conn) return false;
    if (conn.status === "connected") {
      conn.status = "disconnected";
    }
    return this.connections.delete(name);
  }

  /** Connect to an MCP server and discover its capabilities */
  async connect(serverName: string): Promise<MCPConnection> {
    const conn = this.connections.get(serverName);
    if (!conn) throw new Error(`MCP server "${serverName}" not registered`);

    conn.status = "connecting";

    try {
      // In a real implementation, this would establish a transport connection
      // and call initialize/list endpoints. Here we simulate the protocol.
      const transport = conn.config.transport;

      if (transport.type === "stdio") {
        // Would spawn process and communicate via stdin/stdout
        conn.status = "connected";
        conn.connectedAt = Date.now();
      } else if (transport.type === "sse" || transport.type === "http") {
        // Would establish HTTP/SSE connection
        conn.status = "connected";
        conn.connectedAt = Date.now();
      }

      return conn;
    } catch (err) {
      conn.status = "error";
      conn.lastError = err instanceof Error ? err.message : String(err);
      throw err;
    }
  }

  /** Connect to all registered servers that have autoConnect enabled */
  async connectAll(): Promise<Map<string, MCPConnection>> {
    const results = new Map<string, MCPConnection>();
    for (const [name, conn] of this.connections) {
      if (conn.config.autoConnect) {
        try {
          const result = await this.connect(name);
          results.set(name, result);
        } catch {
          results.set(name, conn);
        }
      }
    }
    return results;
  }

  /** Disconnect from a server */
  async disconnect(serverName: string): Promise<void> {
    const conn = this.connections.get(serverName);
    if (!conn) return;
    conn.status = "disconnected";
    conn.tools = [];
    conn.resources = [];
    conn.prompts = [];
  }

  /** Disconnect from all servers */
  async disconnectAll(): Promise<void> {
    for (const name of this.connections.keys()) {
      await this.disconnect(name);
    }
  }

  /** Discover tools from a connected server */
  async listTools(serverName: string): Promise<MCPToolDefinition[]> {
    const conn = this.connections.get(serverName);
    if (!conn) throw new Error(`MCP server "${serverName}" not registered`);
    if (conn.status !== "connected") throw new Error(`MCP server "${serverName}" not connected`);
    return conn.tools;
  }

  /** Discover resources from a connected server */
  async listResources(serverName: string): Promise<MCPResource[]> {
    const conn = this.connections.get(serverName);
    if (!conn) throw new Error(`MCP server "${serverName}" not registered`);
    if (conn.status !== "connected") throw new Error(`MCP server "${serverName}" not connected`);
    return conn.resources;
  }

  /** Call a tool on an MCP server */
  async callTool(
    serverName: string,
    toolName: string,
    args: Record<string, unknown>
  ): Promise<MCPCallResult> {
    const start = Date.now();
    const conn = this.connections.get(serverName);
    if (!conn) throw new Error(`MCP server "${serverName}" not registered`);
    if (conn.status !== "connected") throw new Error(`MCP server "${serverName}" not connected`);

    try {
      // In a real implementation, this would send a tools/call JSON-RPC message
      // over the transport and parse the response.
      const transport = conn.config.transport;
      let result: MCPCallResult;

      if (transport.type === "http" || transport.type === "sse") {
        const url = `${transport.url}/tools/${toolName}`;
        const response = await globalThis.fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(transport.headers ?? {}),
          },
          body: JSON.stringify({ arguments: args }),
        });
        const data = await response.json();
        result = data as MCPCallResult;
      } else {
        // stdio transport would write to stdin and read from stdout
        result = {
          content: [{ type: "text", text: JSON.stringify({ tool: toolName, args, status: "executed" }) }],
        };
      }

      this.callLog.push({
        server: serverName,
        tool: toolName,
        duration: Date.now() - start,
        success: !result.isError,
        timestamp: Date.now(),
      });

      return result;
    } catch (err) {
      this.callLog.push({
        server: serverName,
        tool: toolName,
        duration: Date.now() - start,
        success: false,
        timestamp: Date.now(),
      });
      throw err;
    }
  }

  /** Read a resource from an MCP server */
  async readResource(serverName: string, uri: string): Promise<MCPCallResult> {
    const conn = this.connections.get(serverName);
    if (!conn) throw new Error(`MCP server "${serverName}" not registered`);
    if (conn.status !== "connected") throw new Error(`MCP server "${serverName}" not connected`);

    // In a real implementation, this would send a resources/read message
    return {
      content: [{ type: "text", text: `Resource content for: ${uri}` }],
    };
  }

  /**
   * Convert MCP tools to the internal Tool format so they can be
   * registered in the ToolRegistry and used by agents seamlessly.
   */
  toInternalTools(serverName: string): Tool[] {
    const conn = this.connections.get(serverName);
    if (!conn) return [];

    return conn.tools.map((mcpTool) => {
      const tool: Tool = {
        schema: {
          name: `mcp:${serverName}:${mcpTool.name}`,
          description: `[MCP:${serverName}] ${mcpTool.description}`,
          category: "mcp" as ToolCategory,
          parameters: Object.entries(mcpTool.inputSchema.properties ?? {}).map(
            ([name, prop]) => ({
              name,
              type: prop.type as any,
              description: prop.description ?? "",
              required: mcpTool.inputSchema.required?.includes(name),
              enum: prop.enum,
            })
          ),
          returns: { type: "object", description: "MCP tool result" },
          permissions: ["network"],
          retryable: true,
          maxRetries: 2,
          timeoutMs: conn.config.timeoutMs ?? 30_000,
        },
        execute: async (input: ToolInput) => {
          const result = await this.callTool(serverName, mcpTool.name, input);
          if (result.isError) {
            throw new Error(
              result.content.map((c) => c.text ?? "").join("\n") || "MCP tool call failed"
            );
          }
          return result;
        },
      };
      return tool;
    });
  }

  /** Get all connections */
  getConnections(): Map<string, MCPConnection> {
    return new Map(this.connections);
  }

  /** Get a specific connection */
  getConnection(name: string): MCPConnection | undefined {
    return this.connections.get(name);
  }

  /** Get connected server names */
  getConnectedServers(): string[] {
    return Array.from(this.connections.entries())
      .filter(([, conn]) => conn.status === "connected")
      .map(([name]) => name);
  }

  /** Get call history */
  getCallLog() {
    return [...this.callLog];
  }

  /** Stats */
  stats(): { servers: number; connected: number; totalCalls: number; failedCalls: number } {
    return {
      servers: this.connections.size,
      connected: this.getConnectedServers().length,
      totalCalls: this.callLog.length,
      failedCalls: this.callLog.filter((c) => !c.success).length,
    };
  }
}
