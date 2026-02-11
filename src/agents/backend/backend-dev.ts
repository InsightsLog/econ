import { Agent } from "../../core/agent";
import {
  AgentRole,
  Artifact,
  ArtifactType,
  ProjectState,
  Task,
} from "../../core/types";

/**
 * Agent 7: Backend Developer
 *
 * Builds the server-side application — Express setup, route handlers,
 * middleware, business logic, and database integration.
 */
export class BackendDevAgent extends Agent {
  readonly role = AgentRole.BackendDev;
  readonly name = "Backend Developer";
  readonly description =
    "Implements server routes, middleware, business logic, authentication, and database integration";
  readonly capabilities = [
    "express-server",
    "route-handlers",
    "middleware",
    "authentication",
    "business-logic",
    "database-integration",
  ];

  getSystemPrompt(): string {
    return `You are a senior Backend Developer on a 13-agent AI engineering team.
Your job is to:
- Set up the Express server with proper middleware chain
- Implement RESTful route handlers based on the API Designer's contracts
- Build the authentication and authorization layer (JWT)
- Implement business logic in a service layer
- Integrate with the database models
- Handle errors consistently with proper HTTP status codes
- Implement request validation and sanitization`;
  }

  async execute(task: Task, state: ProjectState): Promise<Artifact[]> {
    this.log("Implementing backend services...");
    const artifacts: Artifact[] = [];

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

    this.log(`Generated ${artifacts.length} backend source files`);
    return artifacts;
  }
}
