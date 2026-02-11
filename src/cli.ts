#!/usr/bin/env node

import { AgentTeam } from "./pipeline/team";
import { ProjectSpec } from "./core/types";

/**
 * CLI entry point for the econ agent team.
 *
 * Usage:
 *   npx econ                        — Run with default demo project
 *   npx econ --name "My App" ...    — Run with custom project spec
 */
async function main() {
  const args = process.argv.slice(2);

  let spec: ProjectSpec;

  if (args.includes("--help") || args.includes("-h")) {
    printUsage();
    return;
  }

  if (args.includes("--name")) {
    spec = parseArgs(args);
  } else if (args.length > 0) {
    // Treat all args as a project description
    spec = {
      name: "WebApp",
      description: args.join(" "),
      features: extractFeatures(args.join(" ")),
    };
  } else {
    // Demo project
    spec = {
      name: "TaskFlow",
      description:
        "A modern task management application with real-time collaboration, project boards, and team analytics",
      features: [
        "User authentication and profiles",
        "Project boards with drag-and-drop",
        "Task creation with rich text editor",
        "Real-time collaboration",
        "Team analytics dashboard",
        "Notification system",
      ],
      techPreferences: {
        frontend: "React with TypeScript",
        backend: "Node.js with Express",
        database: "PostgreSQL",
        styling: "Tailwind CSS",
      },
    };
  }

  console.log("Starting agent team...\n");
  const team = new AgentTeam(spec);
  const finalState = await team.run();

  // Write artifact manifest
  const manifest = finalState.artifacts.map((a) => ({
    file: a.filePath,
    type: a.type,
    agent: a.createdBy,
    description: a.description,
  }));

  console.log(`\nArtifact manifest (${manifest.length} files):`);
  for (const entry of manifest) {
    console.log(`  ${entry.file}`);
  }
}

function printUsage(): void {
  console.log(`
econ — A team of 9 AI agents that ship any web app

USAGE
  econ                                Run with demo project (TaskFlow)
  econ <description>                  Run with project description
  econ --name "App" --features "..."  Run with detailed spec

OPTIONS
  --name <name>            Project name
  --description <desc>     Project description
  --features <f1,f2,...>   Comma-separated features
  --frontend <framework>   Frontend preference (default: React)
  --backend <framework>    Backend preference (default: Express)
  --database <db>          Database preference (default: PostgreSQL)
  -h, --help               Show this help

EXAMPLES
  econ "A social media app with posts, comments, and likes"
  econ --name "ShopEasy" --features "product catalog,shopping cart,checkout,user reviews"
`);
}

function parseArgs(args: string[]): ProjectSpec {
  const get = (flag: string): string | undefined => {
    const idx = args.indexOf(flag);
    return idx >= 0 ? args[idx + 1] : undefined;
  };

  const name = get("--name") ?? "WebApp";
  const description = get("--description") ?? `A web application called ${name}`;
  const featuresStr = get("--features") ?? "user authentication,dashboard,settings";
  const features = featuresStr.split(",").map((f) => f.trim());

  return {
    name,
    description,
    features,
    techPreferences: {
      frontend: get("--frontend"),
      backend: get("--backend"),
      database: get("--database"),
    },
  };
}

function extractFeatures(description: string): string[] {
  // Extract feature-like phrases from a natural language description
  const keywords = ["with", "and", "including", "featuring", "plus"];
  let features: string[] = [];

  for (const keyword of keywords) {
    const parts = description.split(new RegExp(`\\b${keyword}\\b`, "i"));
    if (parts.length > 1) {
      features.push(
        ...parts
          .slice(1)
          .flatMap((p) => p.split(","))
          .map((f) => f.trim())
          .filter((f) => f.length > 2 && f.length < 100)
      );
    }
  }

  if (features.length === 0) {
    features = ["Core application features", "User interface", "Data management"];
  }

  return [...new Set(features)];
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
