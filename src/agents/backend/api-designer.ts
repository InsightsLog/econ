import { Agent } from "../../core/agent";
import {
  AgentRole,
  Artifact,
  ArtifactType,
  ProjectState,
  Task,
} from "../../core/types";

/**
 * Agent 9: API Designer
 *
 * Defines the API contract — endpoints, request/response schemas,
 * authentication requirements, and error codes.
 */
export class APIDesignerAgent extends Agent {
  readonly role = AgentRole.APIDesigner;
  readonly name = "API Designer";
  readonly description =
    "Designs RESTful API endpoints, request/response schemas, auth requirements, and error contracts";
  readonly capabilities = [
    "endpoint-design",
    "schema-definition",
    "openapi-spec",
    "error-codes",
    "versioning",
    "pagination",
  ];

  getSystemPrompt(): string {
    return `You are a senior API Designer on a 13-agent AI engineering team.
Your job is to:
- Design RESTful API endpoints following best practices
- Define request/response schemas with validation rules
- Specify authentication and authorization requirements per endpoint
- Define standard error response format and error codes
- Design pagination, filtering, and sorting for collection endpoints
- Produce an OpenAPI-compatible specification`;
  }

  async execute(task: Task, state: ProjectState): Promise<Artifact[]> {
    this.log("Designing API contracts...");
    const artifacts: Artifact[] = [];

    const apiSpec = {
      openapi: "3.0.3",
      info: {
        title: `${state.spec.name} API`,
        version: "1.0.0",
        description: state.spec.description,
      },
      servers: [
        { url: "/api", description: "API base path" },
      ],
      paths: {
        "/auth/register": {
          post: {
            summary: "Register a new user",
            tags: ["Authentication"],
            requestBody: {
              required: true,
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    required: ["email", "password", "name"],
                    properties: {
                      email: { type: "string", format: "email" },
                      password: { type: "string", minLength: 8 },
                      name: { type: "string", minLength: 1 },
                    },
                  },
                },
              },
            },
            responses: {
              "201": { description: "User created successfully" },
              "400": { description: "Validation error" },
              "409": { description: "Email already registered" },
            },
          },
        },
        "/auth/login": {
          post: {
            summary: "Authenticate user",
            tags: ["Authentication"],
            requestBody: {
              required: true,
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    required: ["email", "password"],
                    properties: {
                      email: { type: "string", format: "email" },
                      password: { type: "string" },
                    },
                  },
                },
              },
            },
            responses: {
              "200": { description: "Authentication successful, returns tokens" },
              "401": { description: "Invalid credentials" },
            },
          },
        },
        "/auth/refresh": {
          post: {
            summary: "Refresh access token",
            tags: ["Authentication"],
            requestBody: {
              required: true,
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    required: ["refreshToken"],
                    properties: {
                      refreshToken: { type: "string" },
                    },
                  },
                },
              },
            },
            responses: {
              "200": { description: "New token pair" },
              "401": { description: "Invalid refresh token" },
            },
          },
        },
        "/users/me": {
          get: {
            summary: "Get current user profile",
            tags: ["Users"],
            security: [{ bearerAuth: [] }],
            responses: {
              "200": { description: "User profile" },
              "401": { description: "Not authenticated" },
            },
          },
          put: {
            summary: "Update current user profile",
            tags: ["Users"],
            security: [{ bearerAuth: [] }],
            requestBody: {
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      name: { type: "string" },
                      email: { type: "string", format: "email" },
                    },
                  },
                },
              },
            },
            responses: {
              "200": { description: "Updated profile" },
              "401": { description: "Not authenticated" },
            },
          },
        },
      },
      components: {
        securitySchemes: {
          bearerAuth: {
            type: "http",
            scheme: "bearer",
            bearerFormat: "JWT",
          },
        },
        schemas: {
          Error: {
            type: "object",
            properties: {
              error: {
                type: "object",
                properties: {
                  message: { type: "string" },
                  status: { type: "integer" },
                  code: { type: "string" },
                },
              },
            },
          },
          PaginatedResponse: {
            type: "object",
            properties: {
              data: { type: "array", items: {} },
              pagination: {
                type: "object",
                properties: {
                  page: { type: "integer" },
                  perPage: { type: "integer" },
                  total: { type: "integer" },
                  totalPages: { type: "integer" },
                },
              },
            },
          },
        },
      },
    };

    artifacts.push(
      this.createArtifact(
        ArtifactType.Specification,
        "docs/openapi.json",
        JSON.stringify(apiSpec, null, 2),
        "OpenAPI 3.0 specification for all API endpoints"
      )
    );

    // Shared types for frontend/backend
    const sharedTypes = `/** Shared API types — used by both client and server */

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  role: string;
  createdAt: string;
}

export interface ApiErrorResponse {
  error: {
    message: string;
    status: number;
    code?: string;
  };
}

export interface PaginationParams {
  page?: number;
  perPage?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    perPage: number;
    total: number;
    totalPages: number;
  };
}
`;

    artifacts.push(
      this.createArtifact(
        ArtifactType.SourceCode,
        "src/shared/api-types.ts",
        sharedTypes,
        "Shared TypeScript types for API contracts between frontend and backend"
      )
    );

    const endpointCount = Object.keys(apiSpec.paths).reduce(
      (sum, path) => sum + Object.keys((apiSpec.paths as any)[path]).length, 0
    );
    this.log(`Designed ${endpointCount} API endpoints across ${Object.keys(apiSpec.paths).length} paths`);
    return artifacts;
  }
}
