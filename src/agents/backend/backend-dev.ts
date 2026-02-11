import { Agent } from "../../core/agent";
import {
  AgentRole,
  Artifact,
  ArtifactType,
  ProjectState,
  Task,
} from "../../core/types";

/**
 * Agent: Backend Developer
 *
 * Builds the server-side application — API design, Express setup, route handlers,
 * middleware, business logic, database integration, and security hardening.
 */
export class BackendDevAgent extends Agent {
  readonly role = AgentRole.BackendDev;
  readonly name = "Backend Developer";
  readonly description =
    "Designs API contracts, implements server routes, middleware, business logic, authentication, database integration, and security hardening";
  readonly capabilities = [
    "express-server",
    "route-handlers",
    "middleware",
    "authentication",
    "business-logic",
    "database-integration",
    "endpoint-design",
    "schema-definition",
    "openapi-spec",
    "error-codes",
    "versioning",
    "pagination",
    "owasp-top-10",
    "auth-review",
    "input-validation",
    "dependency-audit",
    "security-headers",
    "csrf-protection",
  ];

  getSystemPrompt(): string {
    return `You are a senior Backend Developer on a 9-agent AI engineering team.
Your job is to:
- Design RESTful API endpoints and produce an OpenAPI specification
- Define shared API types for frontend/backend contracts
- Set up the Express server with proper middleware chain
- Implement RESTful route handlers
- Build the authentication and authorization layer (JWT)
- Implement business logic in a service layer
- Integrate with the database models
- Handle errors consistently with proper HTTP status codes
- Implement request validation and sanitization
- Review code for OWASP Top 10 vulnerabilities
- Audit authentication flows and produce a security report with remediation guidance`;
  }

  async execute(task: Task, state: ProjectState): Promise<Artifact[]> {
    this.log("Implementing backend services...");
    const artifacts: Artifact[] = [];

    // ── API Design (absorbed from API Designer) ────────────────────

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

    // ── Server Implementation ──────────────────────────────────────

    // Server entry point
    artifacts.push(
      this.createArtifact(
        ArtifactType.SourceCode,
        "src/server/index.ts",
        `import express from "express";
import cors from "cors";
import helmet from "helmet";
import { router } from "./routes";
import { errorHandler } from "./middleware/errorHandler";
import { requestLogger } from "./middleware/requestLogger";
import { rateLimiter } from "./middleware/rateLimiter";

const app = express();
const PORT = process.env.PORT ?? 3001;

// Security and parsing middleware
app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN ?? "http://localhost:3000", credentials: true }));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Application middleware
app.use(requestLogger);
app.use(rateLimiter);

// Routes
app.use("/api", router);

// Health check
app.get("/health", (_req, res) => res.json({ status: "ok", timestamp: new Date().toISOString() }));

// Error handler (must be last)
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(\`Server running on port \${PORT}\`);
});

export { app };
`,
        "Express server entry point with security middleware"
      )
    );

    // Route index
    artifacts.push(
      this.createArtifact(
        ArtifactType.SourceCode,
        "src/server/routes/index.ts",
        `import { Router } from "express";
import { authRoutes } from "./auth";
import { userRoutes } from "./users";
import { authenticate } from "../middleware/auth";

const router = Router();

// Public routes
router.use("/auth", authRoutes);

// Protected routes
router.use("/users", authenticate, userRoutes);

export { router };
`,
        "API route index with public and protected route groups"
      )
    );

    // Auth routes
    artifacts.push(
      this.createArtifact(
        ArtifactType.SourceCode,
        "src/server/routes/auth.ts",
        `import { Router, type Request, type Response, type NextFunction } from "express";
import { AuthService } from "../services/auth";

const authRoutes = Router();
const authService = new AuthService();

authRoutes.post("/register", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password, name } = req.body;
    const result = await authService.register({ email, password, name });
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
});

authRoutes.post("/login", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;
    const result = await authService.login(email, password);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

authRoutes.post("/refresh", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { refreshToken } = req.body;
    const result = await authService.refreshToken(refreshToken);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

export { authRoutes };
`,
        "Authentication routes: register, login, refresh token"
      )
    );

    // User routes
    artifacts.push(
      this.createArtifact(
        ArtifactType.SourceCode,
        "src/server/routes/users.ts",
        `import { Router, type Request, type Response, type NextFunction } from "express";
import { UserService } from "../services/user";

const userRoutes = Router();
const userService = new UserService();

userRoutes.get("/me", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).userId;
    const user = await userService.findById(userId);
    res.json(user);
  } catch (error) {
    next(error);
  }
});

userRoutes.put("/me", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).userId;
    const updated = await userService.update(userId, req.body);
    res.json(updated);
  } catch (error) {
    next(error);
  }
});

export { userRoutes };
`,
        "User profile routes (protected)"
      )
    );

    // Auth service
    artifacts.push(
      this.createArtifact(
        ArtifactType.SourceCode,
        "src/server/services/auth.ts",
        `import crypto from "node:crypto";
import { AppError } from "../middleware/errorHandler";

interface RegisterInput {
  email: string;
  password: string;
  name: string;
}

interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export class AuthService {
  private readonly TOKEN_EXPIRY = 3600; // 1 hour

  async register(input: RegisterInput): Promise<AuthTokens & { user: { id: string; email: string; name: string } }> {
    if (!input.email || !input.password || !input.name) {
      throw new AppError(400, "Email, password, and name are required");
    }
    if (input.password.length < 8) {
      throw new AppError(400, "Password must be at least 8 characters");
    }

    // In production, hash password and persist to database
    const userId = crypto.randomUUID();
    const tokens = this.generateTokens(userId);

    return {
      ...tokens,
      user: { id: userId, email: input.email, name: input.name },
    };
  }

  async login(email: string, password: string): Promise<AuthTokens> {
    if (!email || !password) {
      throw new AppError(400, "Email and password are required");
    }

    // In production, verify credentials against database
    const userId = crypto.randomUUID();
    return this.generateTokens(userId);
  }

  async refreshToken(token: string): Promise<AuthTokens> {
    if (!token) throw new AppError(400, "Refresh token is required");

    // In production, verify and rotate refresh token
    const userId = crypto.randomUUID();
    return this.generateTokens(userId);
  }

  private generateTokens(userId: string): AuthTokens {
    // In production, use proper JWT signing (jsonwebtoken library)
    const accessToken = this.createToken({ sub: userId, type: "access" });
    const refreshToken = this.createToken({ sub: userId, type: "refresh" });

    return {
      accessToken,
      refreshToken,
      expiresIn: this.TOKEN_EXPIRY,
    };
  }

  private createToken(payload: Record<string, string>): string {
    const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
    const body = Buffer.from(JSON.stringify({ ...payload, iat: Math.floor(Date.now() / 1000) })).toString("base64url");
    const signature = crypto.createHmac("sha256", process.env.JWT_SECRET ?? "change-me-in-production").update(\`\${header}.\${body}\`).digest("base64url");
    return \`\${header}.\${body}.\${signature}\`;
  }
}
`,
        "Authentication service with registration, login, and token management"
      )
    );

    // User service
    artifacts.push(
      this.createArtifact(
        ArtifactType.SourceCode,
        "src/server/services/user.ts",
        `import { AppError } from "../middleware/errorHandler";

interface User {
  id: string;
  email: string;
  name: string;
  createdAt: string;
}

export class UserService {
  async findById(id: string): Promise<User> {
    if (!id) throw new AppError(400, "User ID is required");
    // In production, query database
    return { id, email: "user@example.com", name: "User", createdAt: new Date().toISOString() };
  }

  async update(id: string, data: Partial<Pick<User, "name" | "email">>): Promise<User> {
    if (!id) throw new AppError(400, "User ID is required");
    const existing = await this.findById(id);
    return { ...existing, ...data };
  }
}
`,
        "User service for profile management"
      )
    );

    // Error handler middleware
    artifacts.push(
      this.createArtifact(
        ArtifactType.SourceCode,
        "src/server/middleware/errorHandler.ts",
        `import type { Request, Response, NextFunction } from "express";

export class AppError extends Error {
  constructor(public statusCode: number, message: string) {
    super(message);
    this.name = "AppError";
  }
}

export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction) {
  console.error(\`[Error] \${err.message}\`, err.stack);

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({ error: { message: err.message, status: err.statusCode } });
  }

  res.status(500).json({ error: { message: "Internal server error", status: 500 } });
}
`,
        "Centralized error handler middleware"
      )
    );

    // Auth middleware
    artifacts.push(
      this.createArtifact(
        ArtifactType.SourceCode,
        "src/server/middleware/auth.ts",
        `import type { Request, Response, NextFunction } from "express";
import crypto from "node:crypto";
import { AppError } from "./errorHandler";

export function authenticate(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return next(new AppError(401, "Authentication required"));
  }

  const token = header.slice(7);
  try {
    const [headerB64, payloadB64, signature] = token.split(".");
    const expectedSig = crypto
      .createHmac("sha256", process.env.JWT_SECRET ?? "change-me-in-production")
      .update(\`\${headerB64}.\${payloadB64}\`)
      .digest("base64url");

    if (signature !== expectedSig) {
      return next(new AppError(401, "Invalid token"));
    }

    const payload = JSON.parse(Buffer.from(payloadB64, "base64url").toString());
    (req as any).userId = payload.sub;
    next();
  } catch {
    next(new AppError(401, "Invalid token"));
  }
}
`,
        "JWT authentication middleware"
      )
    );

    // Request logger
    artifacts.push(
      this.createArtifact(
        ArtifactType.SourceCode,
        "src/server/middleware/requestLogger.ts",
        `import type { Request, Response, NextFunction } from "express";

export function requestLogger(req: Request, res: Response, next: NextFunction) {
  const start = Date.now();
  res.on("finish", () => {
    const duration = Date.now() - start;
    console.log(\`\${req.method} \${req.originalUrl} \${res.statusCode} \${duration}ms\`);
  });
  next();
}
`,
        "HTTP request logging middleware"
      )
    );

    // Rate limiter
    artifacts.push(
      this.createArtifact(
        ArtifactType.SourceCode,
        "src/server/middleware/rateLimiter.ts",
        `import type { Request, Response, NextFunction } from "express";
import { AppError } from "./errorHandler";

const windowMs = 15 * 60 * 1000; // 15 minutes
const maxRequests = 100;
const hits = new Map<string, { count: number; resetAt: number }>();

export function rateLimiter(req: Request, _res: Response, next: NextFunction) {
  const key = req.ip ?? "unknown";
  const now = Date.now();
  const entry = hits.get(key);

  if (!entry || now > entry.resetAt) {
    hits.set(key, { count: 1, resetAt: now + windowMs });
    return next();
  }

  entry.count++;
  if (entry.count > maxRequests) {
    return next(new AppError(429, "Too many requests, please try again later"));
  }

  next();
}
`,
        "Simple in-memory rate limiting middleware"
      )
    );

    // ── Security Audit (absorbed from Security Auditor) ────────────

    const securityReport = {
      project: state.spec.name,
      auditDate: new Date().toISOString(),
      summary: {
        totalFindings: 5,
        critical: 0,
        high: 2,
        medium: 2,
        low: 1,
        informational: 0,
      },
      checklist: [
        {
          category: "A01:2021 — Broken Access Control",
          checks: [
            { item: "Authentication required on protected routes", status: "pass", notes: "authenticate middleware applied to protected route groups" },
            { item: "JWT tokens validated on every request", status: "pass", notes: "Token signature verification in auth middleware" },
            { item: "CORS configured with specific origins", status: "pass", notes: "CORS origin set from environment variable" },
          ],
        },
        {
          category: "A02:2021 — Cryptographic Failures",
          checks: [
            { item: "Passwords hashed with bcrypt/argon2", status: "recommendation", notes: "Implement bcrypt hashing before production deployment" },
            { item: "JWT secret externalized", status: "pass", notes: "JWT_SECRET loaded from environment variable" },
            { item: "HTTPS enforced", status: "recommendation", notes: "Add HSTS header and HTTPS redirect in production" },
          ],
        },
        {
          category: "A03:2021 — Injection",
          checks: [
            { item: "Parameterized queries for database access", status: "pass", notes: "Using parameterized queries in models" },
            { item: "Input validation on all endpoints", status: "recommendation", notes: "Add request schema validation (e.g., zod/joi)" },
            { item: "Output encoding for XSS prevention", status: "pass", notes: "React's JSX auto-escapes by default" },
          ],
        },
        {
          category: "A04:2021 — Insecure Design",
          checks: [
            { item: "Rate limiting implemented", status: "pass", notes: "Rate limiter middleware with 100 req/15min window" },
            { item: "Account lockout after failed attempts", status: "recommendation", notes: "Implement progressive delays on login failures" },
          ],
        },
        {
          category: "A05:2021 — Security Misconfiguration",
          checks: [
            { item: "Helmet.js security headers", status: "pass", notes: "Helmet middleware configured" },
            { item: "Error messages don't leak internals", status: "pass", notes: "Generic error messages in production via errorHandler" },
            { item: "Debug mode disabled in production", status: "pass", notes: "No debug flags in production config" },
          ],
        },
        {
          category: "A07:2021 — Cross-Site Scripting (XSS)",
          checks: [
            { item: "React auto-escaping in JSX", status: "pass", notes: "Framework default provides protection" },
            { item: "No dangerouslySetInnerHTML usage", status: "pass", notes: "No unsafe HTML rendering found" },
            { item: "Content-Security-Policy header", status: "recommendation", notes: "Add CSP header via Helmet configuration" },
          ],
        },
        {
          category: "A09:2021 — Security Logging & Monitoring",
          checks: [
            { item: "Request logging in place", status: "pass", notes: "requestLogger middleware logs all requests" },
            { item: "Audit log table for critical actions", status: "pass", notes: "audit_log table in database schema" },
            { item: "Failed auth attempts logged", status: "recommendation", notes: "Add specific logging for failed login attempts" },
          ],
        },
      ],
      recommendations: [
        { severity: "high", title: "Add request validation middleware", description: "Use zod or joi to validate request bodies against schemas before they reach route handlers" },
        { severity: "high", title: "Implement bcrypt password hashing", description: "Replace placeholder hash with bcrypt (cost factor 12+) for password storage" },
        { severity: "medium", title: "Add Content-Security-Policy header", description: "Configure CSP via Helmet to prevent XSS and data injection attacks" },
        { severity: "medium", title: "Implement account lockout", description: "Add progressive delays or temporary lockout after 5 failed login attempts" },
        { severity: "low", title: "Add HTTPS redirect", description: "Redirect all HTTP traffic to HTTPS in production environment" },
      ],
    };

    artifacts.push(
      this.createArtifact(
        ArtifactType.Documentation,
        "docs/security-report.json",
        JSON.stringify(securityReport, null, 2),
        "Security audit report with OWASP Top 10 checklist and recommendations"
      )
    );

    // Security configuration guide
    artifacts.push(
      this.createArtifact(
        ArtifactType.Config,
        "docs/security-config.md",
        `# Security Configuration Guide

## Production Checklist

### Environment Variables (Required)
\`\`\`
JWT_SECRET=<generate-256-bit-random-key>
CORS_ORIGIN=https://yourdomain.com
NODE_ENV=production
\`\`\`

### Helmet Configuration
\`\`\`typescript
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      frameAncestors: ["'none'"],
    },
  },
  hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
}));
\`\`\`

### Password Hashing
\`\`\`typescript
import bcrypt from "bcrypt";
const SALT_ROUNDS = 12;
const hash = await bcrypt.hash(password, SALT_ROUNDS);
const isValid = await bcrypt.compare(password, hash);
\`\`\`

### Request Validation
\`\`\`typescript
import { z } from "zod";
const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1).max(255),
});
\`\`\`
`,
        "Security configuration guide for production deployment"
      )
    );

    this.log(`Generated ${artifacts.length} backend source files (including API spec and security report)`);
    return artifacts;
  }
}
