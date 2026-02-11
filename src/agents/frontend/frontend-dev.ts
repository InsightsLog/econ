import { Agent } from "../../core/agent";
import {
  AgentRole,
  Artifact,
  ArtifactType,
  ProjectState,
  Task,
} from "../../core/types";

/**
 * Agent: Frontend Developer
 *
 * Implements the client-side application — design system, React components,
 * pages, routing, state management, API integration, and accessibility.
 */
export class FrontendDevAgent extends Agent {
  readonly role = AgentRole.FrontendDev;
  readonly name = "Frontend Developer";
  readonly description =
    "Builds design system, React components, pages, routing, state management, API client integration, and accessibility utilities";
  readonly capabilities = [
    "react-components",
    "state-management",
    "client-routing",
    "api-integration",
    "responsive-implementation",
    "form-handling",
    "component-design",
    "design-tokens",
    "responsive-layout",
    "interaction-design",
    "visual-hierarchy",
    "wcag-audit",
    "aria-labels",
    "keyboard-navigation",
    "screen-reader-testing",
    "color-contrast",
    "focus-management",
  ];

  getSystemPrompt(): string {
    return `You are a senior Frontend Developer on a 9-agent AI engineering team.
Your job is to:
- Create a coherent design system with tokens for colors, typography, spacing, and breakpoints
- Design the component hierarchy (atoms, molecules, organisms, templates, pages)
- Implement React components with proper accessibility (ARIA attributes, keyboard navigation, focus management)
- Set up client-side routing with React Router
- Implement state management for global and local state
- Build API client layer for communicating with the backend
- Handle forms with validation, error states, and loading states
- Implement responsive layouts using the design tokens
- Ensure WCAG 2.1 AA compliance across all components
- Follow React best practices: hooks, composition, error boundaries`;
  }

  async execute(task: Task, state: ProjectState): Promise<Artifact[]> {
    this.log("Implementing frontend application...");
    const artifacts: Artifact[] = [];
    const projectName = state.spec.name;

    // ── Design System (absorbed from UI Designer) ──────────────────

    // Design tokens
    const tokens = {
      colors: {
        primary: { 50: "#eff6ff", 500: "#3b82f6", 600: "#2563eb", 700: "#1d4ed8", 900: "#1e3a5f" },
        neutral: { 50: "#f9fafb", 100: "#f3f4f6", 200: "#e5e7eb", 500: "#6b7280", 700: "#374151", 900: "#111827" },
        success: { 500: "#22c55e", 700: "#15803d" },
        warning: { 500: "#f59e0b", 700: "#b45309" },
        error: { 500: "#ef4444", 700: "#b91c1c" },
      },
      typography: {
        fontFamily: { sans: "Inter, system-ui, sans-serif", mono: "JetBrains Mono, monospace" },
        fontSize: { xs: "0.75rem", sm: "0.875rem", base: "1rem", lg: "1.125rem", xl: "1.25rem", "2xl": "1.5rem", "3xl": "1.875rem", "4xl": "2.25rem" },
        fontWeight: { normal: 400, medium: 500, semibold: 600, bold: 700 },
        lineHeight: { tight: 1.25, normal: 1.5, relaxed: 1.75 },
      },
      spacing: { xs: "0.25rem", sm: "0.5rem", md: "1rem", lg: "1.5rem", xl: "2rem", "2xl": "3rem", "3xl": "4rem" },
      breakpoints: { sm: "640px", md: "768px", lg: "1024px", xl: "1280px" },
      borderRadius: { sm: "0.25rem", md: "0.375rem", lg: "0.5rem", xl: "0.75rem", full: "9999px" },
      shadows: {
        sm: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
        md: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
        lg: "0 10px 15px -3px rgb(0 0 0 / 0.1)",
      },
    };

    artifacts.push(
      this.createArtifact(
        ArtifactType.Design,
        "src/client/styles/design-tokens.json",
        JSON.stringify(tokens, null, 2),
        "Design token system with colors, typography, spacing, and breakpoints"
      )
    );

    // Component hierarchy
    const components = {
      atoms: [
        { name: "Button", variants: ["primary", "secondary", "ghost", "danger"], props: ["size", "disabled", "loading"] },
        { name: "Input", variants: ["text", "email", "password", "search"], props: ["label", "error", "placeholder"] },
        { name: "Badge", variants: ["default", "success", "warning", "error"], props: ["label"] },
        { name: "Avatar", variants: ["image", "initials", "icon"], props: ["src", "name", "size"] },
        { name: "Spinner", variants: ["sm", "md", "lg"], props: ["color"] },
        { name: "Icon", variants: [], props: ["name", "size", "color"] },
      ],
      molecules: [
        { name: "FormField", composition: ["Input", "Label", "ErrorMessage"] },
        { name: "SearchBar", composition: ["Input", "Button", "Icon"] },
        { name: "Card", composition: ["CardHeader", "CardBody", "CardFooter"] },
        { name: "NavItem", composition: ["Icon", "Text", "Badge"] },
        { name: "Toast", composition: ["Icon", "Text", "Button"] },
        { name: "DropdownMenu", composition: ["Button", "MenuList", "MenuItem"] },
      ],
      organisms: [
        { name: "Navbar", composition: ["Logo", "NavItem[]", "Avatar", "DropdownMenu"] },
        { name: "Sidebar", composition: ["NavItem[]", "UserProfile"] },
        { name: "DataTable", composition: ["TableHeader", "TableRow[]", "Pagination"] },
        { name: "Form", composition: ["FormField[]", "Button"] },
        { name: "Modal", composition: ["ModalHeader", "ModalBody", "ModalFooter"] },
      ],
      templates: [
        { name: "DashboardLayout", sections: ["Navbar", "Sidebar", "MainContent", "Footer"] },
        { name: "AuthLayout", sections: ["Logo", "Form", "Footer"] },
        { name: "SettingsLayout", sections: ["Navbar", "SettingsSidebar", "SettingsContent"] },
      ],
    };

    artifacts.push(
      this.createArtifact(
        ArtifactType.Design,
        "docs/component-hierarchy.json",
        JSON.stringify(components, null, 2),
        "Component hierarchy following atomic design principles"
      )
    );

    // Global CSS reset / base styles
    const globalCss = `/* Global Styles — generated by Frontend Developer Agent */
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

*,
*::before,
*::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

html {
  font-family: Inter, system-ui, -apple-system, sans-serif;
  font-size: 16px;
  line-height: 1.5;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

body {
  min-height: 100vh;
  color: #111827;
  background-color: #f9fafb;
}

img, picture, video, canvas, svg {
  display: block;
  max-width: 100%;
}

input, button, textarea, select {
  font: inherit;
}

a {
  color: inherit;
  text-decoration: none;
}

/* Focus visible for accessibility */
:focus-visible {
  outline: 2px solid #3b82f6;
  outline-offset: 2px;
}

/* Screen-reader only utility */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}

/* Reduced motion preference */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
`;

    artifacts.push(
      this.createArtifact(
        ArtifactType.SourceCode,
        "src/client/styles/global.css",
        globalCss,
        "Global CSS reset and base styles with accessibility considerations"
      )
    );

    // ── Accessibility Utilities (absorbed from Accessibility Specialist) ──

    // A11y audit checklist
    const auditChecklist = {
      categories: [
        {
          name: "Perceivable",
          checks: [
            { rule: "All images have descriptive alt text", status: "required", wcag: "1.1.1" },
            { rule: "Color is not the sole means of conveying information", status: "required", wcag: "1.4.1" },
            { rule: "Text contrast ratio is at least 4.5:1", status: "required", wcag: "1.4.3" },
            { rule: "Content can be resized to 200% without loss", status: "required", wcag: "1.4.4" },
            { rule: "Non-text contrast ratio is at least 3:1", status: "required", wcag: "1.4.11" },
          ],
        },
        {
          name: "Operable",
          checks: [
            { rule: "All functionality available via keyboard", status: "required", wcag: "2.1.1" },
            { rule: "No keyboard traps", status: "required", wcag: "2.1.2" },
            { rule: "Focus order is logical and intuitive", status: "required", wcag: "2.4.3" },
            { rule: "Focus is visible on all interactive elements", status: "required", wcag: "2.4.7" },
            { rule: "Skip navigation link is present", status: "required", wcag: "2.4.1" },
            { rule: "Page titles are descriptive", status: "required", wcag: "2.4.2" },
          ],
        },
        {
          name: "Understandable",
          checks: [
            { rule: "Page language is declared in HTML", status: "required", wcag: "3.1.1" },
            { rule: "Form inputs have associated labels", status: "required", wcag: "3.3.2" },
            { rule: "Error messages identify the field and suggest fix", status: "required", wcag: "3.3.3" },
            { rule: "Navigation is consistent across pages", status: "required", wcag: "3.2.3" },
          ],
        },
        {
          name: "Robust",
          checks: [
            { rule: "HTML validates without errors", status: "required", wcag: "4.1.1" },
            { rule: "Custom components have proper ARIA roles", status: "required", wcag: "4.1.2" },
            { rule: "Status messages use aria-live regions", status: "required", wcag: "4.1.3" },
          ],
        },
      ],
    };

    artifacts.push(
      this.createArtifact(
        ArtifactType.Specification,
        "docs/accessibility-audit.json",
        JSON.stringify(auditChecklist, null, 2),
        "WCAG 2.1 AA accessibility audit checklist"
      )
    );

    // Accessible component utilities
    const a11yUtils = `/**
 * Accessibility utility hooks and helpers
 */

import { useEffect, useRef, useCallback } from "react";

/** Trap focus within a container (for modals and dialogs) */
export function useFocusTrap(active: boolean) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!active || !containerRef.current) return;

    const container = containerRef.current;
    const focusable = container.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );
    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key !== "Tab") return;
      if (e.shiftKey) {
        if (document.activeElement === first) { e.preventDefault(); last?.focus(); }
      } else {
        if (document.activeElement === last) { e.preventDefault(); first?.focus(); }
      }
    }

    container.addEventListener("keydown", handleKeyDown);
    first?.focus();

    return () => container.removeEventListener("keydown", handleKeyDown);
  }, [active]);

  return containerRef;
}

/** Announce a message to screen readers via aria-live */
export function useAnnounce() {
  const announce = useCallback((message: string, priority: "polite" | "assertive" = "polite") => {
    const el = document.createElement("div");
    el.setAttribute("aria-live", priority);
    el.setAttribute("aria-atomic", "true");
    el.setAttribute("role", priority === "assertive" ? "alert" : "status");
    el.className = "sr-only";
    el.textContent = message;
    document.body.appendChild(el);
    setTimeout(() => document.body.removeChild(el), 1000);
  }, []);

  return announce;
}

/** Hook to manage roving tabindex for composite widgets (tabs, toolbars, etc.) */
export function useRovingTabIndex(itemCount: number) {
  const activeIndex = useRef(0);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      let newIndex = activeIndex.current;
      if (e.key === "ArrowDown" || e.key === "ArrowRight") {
        e.preventDefault();
        newIndex = (activeIndex.current + 1) % itemCount;
      } else if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
        e.preventDefault();
        newIndex = (activeIndex.current - 1 + itemCount) % itemCount;
      } else if (e.key === "Home") {
        e.preventDefault();
        newIndex = 0;
      } else if (e.key === "End") {
        e.preventDefault();
        newIndex = itemCount - 1;
      }
      activeIndex.current = newIndex;
    },
    [itemCount]
  );

  return { activeIndex, handleKeyDown };
}
`;

    artifacts.push(
      this.createArtifact(
        ArtifactType.SourceCode,
        "src/client/utils/a11y.ts",
        a11yUtils,
        "Accessibility utility hooks: focus trap, screen reader announcements, roving tabindex"
      )
    );

    // ── App Implementation ─────────────────────────────────────────

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

    this.log(`Generated ${artifacts.length} frontend source files (including design system and a11y utilities)`);
    return artifacts;
  }
}
