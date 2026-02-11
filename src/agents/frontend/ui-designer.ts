import { Agent } from "../../core/agent";
import {
  AgentRole,
  Artifact,
  ArtifactType,
  ProjectState,
  Task,
} from "../../core/types";

/**
 * Agent 4: UI Designer
 *
 * Creates the visual design system — component hierarchy,
 * design tokens (colors, spacing, typography), responsive layouts,
 * and interaction patterns.
 */
export class UIDesignerAgent extends Agent {
  readonly role = AgentRole.UIDesigner;
  readonly name = "UI Designer";
  readonly description =
    "Designs component hierarchy, design tokens, responsive layouts, and interaction patterns";
  readonly capabilities = [
    "component-design",
    "design-tokens",
    "responsive-layout",
    "interaction-design",
    "visual-hierarchy",
  ];

  getSystemPrompt(): string {
    return `You are a senior UI Designer on a 13-agent AI engineering team.
Your job is to:
- Create a coherent design system with tokens for colors, typography, spacing, and breakpoints
- Design the component hierarchy (atoms, molecules, organisms, templates, pages)
- Define responsive layout rules for mobile-first design
- Specify interaction patterns (hover states, transitions, loading indicators)
- Ensure visual consistency across all pages and components
- Hand off designs in a developer-friendly format`;
  }

  async execute(task: Task, state: ProjectState): Promise<Artifact[]> {
    this.log("Creating design system and component specs...");
    const artifacts: Artifact[] = [];

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
    const globalCss = `/* Global Styles — generated by UI Designer Agent */
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

    this.log(`Created design system: ${tokens.colors.primary[500]} primary, ${components.atoms.length} atoms, ${components.molecules.length} molecules, ${components.organisms.length} organisms`);
    return artifacts;
  }
}
