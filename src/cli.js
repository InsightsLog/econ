#!/usr/bin/env node

/**
 * Vibecoder CLI
 * Command-line interface for the agentic workflow system
 */

import { WorkflowEngine } from './workflow-engine.js';
import { ProjectGenerator } from './project-generator.js';
import { createProject } from './index.js';

const args = process.argv.slice(2);

function printHelp() {
  console.log(`
🎨 Vibecoder - Agentic Workflow for Project Creation

Usage:
  vibecoder <command> [options]

Commands:
  create <template> <name>  Create a new project
  list                      List available templates
  workflow <config>         Run a custom workflow
  help                      Show this help message

Examples:
  vibecoder create web my-app
  vibecoder create api my-api
  vibecoder create cli my-tool
  vibecoder create ml my-ml-project
  vibecoder list

Templates:
  web   - Modern web application
  api   - REST API server
  cli   - Command-line tool
  ml    - Machine Learning project
  `);
}

function printVersion() {
  console.log('Vibecoder v1.0.0');
}

async function listTemplates() {
  const engine = new WorkflowEngine();
  const generator = new ProjectGenerator(engine);
  const templates = generator.getTemplates();

  console.log('\n📋 Available Templates:\n');
  templates.forEach(t => {
    console.log(`  ${t.id.padEnd(10)} - ${t.name}`);
    console.log(`  ${' '.repeat(15)}${t.description}\n`);
  });
}

async function handleCreate(template, projectName) {
  if (!template || !projectName) {
    console.error('❌ Error: Template and project name are required');
    console.log('Usage: vibecoder create <template> <name>');
    process.exit(1);
  }

  try {
    await createProject(template, projectName);
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    process.exit(1);
  }
}

async function handleWorkflow(configPath) {
  console.log(`Running workflow from: ${configPath}`);
  console.log('Custom workflow execution not yet implemented');
  // Future: Load and execute custom workflow configs
}

async function main() {
  const command = args[0];

  switch (command) {
    case 'create':
      await handleCreate(args[1], args[2]);
      break;
    case 'list':
      await listTemplates();
      break;
    case 'workflow':
      await handleWorkflow(args[1]);
      break;
    case 'version':
    case '--version':
    case '-v':
      printVersion();
      break;
    case 'help':
    case '--help':
    case '-h':
    case undefined:
      printHelp();
      break;
    default:
      console.error(`❌ Unknown command: ${command}`);
      printHelp();
      process.exit(1);
  }
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
