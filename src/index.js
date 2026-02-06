/**
 * Vibecoder - Agentic Workflow System
 * Main entry point for programmatic usage
 */

import path from 'path';
import { WorkflowEngine } from './workflow-engine.js';
import { ProjectGenerator } from './project-generator.js';

/**
 * Create a new project using the agentic workflow
 * @param {string} templateName - Template to use (web, api, cli, ml)
 * @param {string} projectName - Name of the project to create
 * @param {Object} options - Additional options
 */
export async function createProject(templateName, projectName, options = {}) {
  console.log(`\n🚀 Starting Vibecoder Agentic Workflow\n`);
  console.log(`Project: ${projectName}`);
  console.log(`Template: ${templateName}\n`);

  // Create workflow engine
  const engine = new WorkflowEngine();
  
  // Add workflow steps
  engine.addStep({
    name: 'Initialize Project Context',
    action: async (context) => {
      console.log(`  📝 Project Name: ${projectName}`);
      console.log(`  📦 Template: ${templateName}`);
      return {
        projectName,
        templateName,
        projectPath: options.output || path.join(process.cwd(), projectName)
      };
    }
  });

  engine.addStep({
    name: 'Validate Template',
    action: async (context) => {
      const generator = new ProjectGenerator(engine);
      const templates = generator.getTemplates();
      const template = templates.find(t => t.id === templateName);
      
      if (!template) {
        throw new Error(`Template "${templateName}" not found. Available: ${templates.map(t => t.id).join(', ')}`);
      }
      
      console.log(`  ✅ Template validated: ${template.name}`);
      return { template };
    }
  });

  engine.addStep({
    name: 'Generate Project Structure',
    action: async (context) => {
      const generator = new ProjectGenerator(engine);
      const result = await generator.generate(
        context.templateName,
        context.projectPath,
        { projectName: context.projectName }
      );
      return result;
    }
  });

  engine.addStep({
    name: 'Finalize Project',
    action: async (context) => {
      console.log(`\n📊 Project Summary:`);
      console.log(`  Name: ${context.projectName}`);
      console.log(`  Type: ${context.template.name}`);
      console.log(`  Path: ${context.projectPath}`);
      
      console.log(`\n🎉 Next steps:`);
      console.log(`  cd ${context.projectName}`);
      
      if (context.templateName === 'ml') {
        console.log(`  pip install -r requirements.txt`);
        console.log(`  python main.py`);
      } else {
        console.log(`  npm install`);
        console.log(`  npm start`);
      }
      
      return { completed: true };
    }
  });

  // Execute the workflow
  const result = await engine.execute();
  
  return result;
}

/**
 * Create a custom workflow
 * @param {Array} steps - Array of workflow steps
 * @param {Object} initialContext - Initial context
 */
export async function createCustomWorkflow(steps, initialContext = {}) {
  const engine = new WorkflowEngine();
  
  steps.forEach(step => {
    engine.addStep(step);
  });
  
  return await engine.execute(initialContext);
}

/**
 * Get available project templates
 */
export function getTemplates() {
  const engine = new WorkflowEngine();
  const generator = new ProjectGenerator(engine);
  return generator.getTemplates();
}

// Export classes for advanced usage
export { WorkflowEngine } from './workflow-engine.js';
export { ProjectGenerator } from './project-generator.js';
