import { Agent } from "../../core/agent";
import {
  AgentRole,
  Artifact,
  ArtifactType,
  ProjectState,
  Task,
} from "../../core/types";

/**
 * Agent 5: Frontend Developer
 *
 * Implements the client-side application — React components,
 * pages, routing, state management, and API integration.
 */
export class FrontendDevAgent extends Agent {
  readonly role = AgentRole.FrontendDev;
  readonly name = "Frontend Developer";
  readonly description =
    "Builds React components, pages, routing, state management, and API client integration";
  readonly capabilities = [
    "react-components",
    "state-management",
    "client-routing",
    "api-integration",
    "responsive-implementation",
    "form-handling",
  ];

  getSystemPrompt(): string {
    return `You are a senior Frontend Developer on a 13-agent AI engineering team.
Your job is to:
- Implement React components based on the UI Designer's specs
- Set up client-side routing with React Router
- Implement state management for global and local state
- Build API client layer for communicating with the backend
- Handle forms with validation, error states, and loading states
- Implement responsive layouts using the design tokens
- Follow React best practices: hooks, composition, error boundaries`;
  }

  async execute(task: Task, state: ProjectState): Promise<Artifact[]> {
    this.log("Implementing frontend application...");
    const artifacts: Artifact[] = [];
    const projectName = state.spec.name;

    // App entry point
    artifacts.push(
      this.createArtifact(
        ArtifactType.SourceCode,
        "src/client/App.tsx",
        `import React, { Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AppProvider } from "./stores/AppContext";
import { DashboardLayout } from "./components/layouts/DashboardLayout";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { Spinner } from "./components/ui/Spinner";

const HomePage = React.lazy(() => import("./pages/HomePage"));
const DashboardPage = React.lazy(() => import("./pages/DashboardPage"));
const SettingsPage = React.lazy(() => import("./pages/SettingsPage"));
const NotFoundPage = React.lazy(() => import("./pages/NotFoundPage"));

export default function App() {
  return (
    <ErrorBoundary>
      <AppProvider>
        <BrowserRouter>
          <Suspense fallback={<Spinner size="lg" />}>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route element={<DashboardLayout />}>
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/settings" element={<SettingsPage />} />
              </Route>
              <Route path="/404" element={<NotFoundPage />} />
              <Route path="*" element={<Navigate to="/404" replace />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </AppProvider>
    </ErrorBoundary>
  );
}
`,
        "Main App component with routing, code splitting, and error boundary"
      )
    );

    // API client
    artifacts.push(
      this.createArtifact(
        ArtifactType.SourceCode,
        "src/client/api/client.ts",
        `const API_BASE = import.meta.env.VITE_API_URL ?? "/api";

interface RequestOptions extends Omit<RequestInit, "body"> {
  body?: unknown;
  params?: Record<string, string>;
}

class ApiError extends Error {
  constructor(public status: number, message: string, public data?: unknown) {
    super(message);
    this.name = "ApiError";
  }
}

async function request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { body, params, headers: customHeaders, ...rest } = options;

  const url = new URL(\`\${API_BASE}\${endpoint}\`, window.location.origin);
  if (params) {
    Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value));
  }

  const headers: Record<string, string> = { "Content-Type": "application/json", ...customHeaders as Record<string, string> };
  const token = localStorage.getItem("auth_token");
  if (token) headers["Authorization"] = \`Bearer \${token}\`;

  const response = await fetch(url.toString(), {
    ...rest,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new ApiError(response.status, response.statusText, errorData);
  }

  if (response.status === 204) return undefined as T;
  return response.json();
}

export const api = {
  get: <T>(url: string, params?: Record<string, string>) => request<T>(url, { method: "GET", params }),
  post: <T>(url: string, body?: unknown) => request<T>(url, { method: "POST", body }),
  put: <T>(url: string, body?: unknown) => request<T>(url, { method: "PUT", body }),
  patch: <T>(url: string, body?: unknown) => request<T>(url, { method: "PATCH", body }),
  delete: <T>(url: string) => request<T>(url, { method: "DELETE" }),
};

export { ApiError };
`,
        "Type-safe API client with auth token handling and error classes"
      )
    );

    // State management context
    artifacts.push(
      this.createArtifact(
        ArtifactType.SourceCode,
        "src/client/stores/AppContext.tsx",
        `import React, { createContext, useContext, useReducer, type ReactNode } from "react";

interface AppState {
  user: { id: string; name: string; email: string } | null;
  theme: "light" | "dark";
  sidebarOpen: boolean;
  notifications: Notification[];
}

interface Notification {
  id: string;
  type: "info" | "success" | "warning" | "error";
  message: string;
}

type Action =
  | { type: "SET_USER"; payload: AppState["user"] }
  | { type: "SET_THEME"; payload: AppState["theme"] }
  | { type: "TOGGLE_SIDEBAR" }
  | { type: "ADD_NOTIFICATION"; payload: Notification }
  | { type: "REMOVE_NOTIFICATION"; payload: string };

const initialState: AppState = {
  user: null,
  theme: "light",
  sidebarOpen: true,
  notifications: [],
};

function appReducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case "SET_USER":
      return { ...state, user: action.payload };
    case "SET_THEME":
      return { ...state, theme: action.payload };
    case "TOGGLE_SIDEBAR":
      return { ...state, sidebarOpen: !state.sidebarOpen };
    case "ADD_NOTIFICATION":
      return { ...state, notifications: [...state.notifications, action.payload] };
    case "REMOVE_NOTIFICATION":
      return { ...state, notifications: state.notifications.filter((n) => n.id !== action.payload) };
    default:
      return state;
  }
}

const AppContext = createContext<{ state: AppState; dispatch: React.Dispatch<Action> } | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);
  return <AppContext.Provider value={{ state, dispatch }}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
`,
        "App-wide state management using React Context + useReducer"
      )
    );

    // useApi hook
    artifacts.push(
      this.createArtifact(
        ArtifactType.SourceCode,
        "src/client/hooks/useApi.ts",
        `import { useState, useCallback } from "react";

interface UseApiState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
}

export function useApi<T>(asyncFn: (...args: unknown[]) => Promise<T>) {
  const [state, setState] = useState<UseApiState<T>>({ data: null, loading: false, error: null });

  const execute = useCallback(async (...args: unknown[]) => {
    setState({ data: null, loading: true, error: null });
    try {
      const data = await asyncFn(...args);
      setState({ data, loading: false, error: null });
      return data;
    } catch (error) {
      setState({ data: null, loading: false, error: error as Error });
      throw error;
    }
  }, [asyncFn]);

  return { ...state, execute };
}
`,
        "Reusable hook for API calls with loading/error state"
      )
    );

    // Error boundary
    artifacts.push(
      this.createArtifact(
        ArtifactType.SourceCode,
        "src/client/components/ErrorBoundary.tsx",
        `import React, { Component, type ReactNode, type ErrorInfo } from "react";

interface Props { children: ReactNode; fallback?: ReactNode; }
interface State { hasError: boolean; error: Error | null; }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("ErrorBoundary caught:", error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? (
        <div role="alert" style={{ padding: "2rem", textAlign: "center" }}>
          <h2>Something went wrong</h2>
          <p style={{ color: "#6b7280", marginTop: "0.5rem" }}>{this.state.error?.message}</p>
          <button onClick={() => this.setState({ hasError: false, error: null })}
            style={{ marginTop: "1rem", padding: "0.5rem 1rem", cursor: "pointer" }}>
            Try again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
`,
        "React error boundary component with retry capability"
      )
    );

    this.log(`Generated ${artifacts.length} frontend source files`);
    return artifacts;
  }
}
