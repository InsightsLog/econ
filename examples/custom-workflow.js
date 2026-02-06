/**
 * Example: Creating a custom workflow
 */

import { createCustomWorkflow } from '../src/index.js';
import fs from 'fs';
import path from 'path';

async function main() {
  console.log('Example: Custom workflow for creating a specialized project\n');
  
  const steps = [
    {
      name: 'Setup Phase',
      action: async (context) => {
        console.log('  Setting up project structure...');
        const projectPath = './output/custom-project';
        
        if (!fs.existsSync(projectPath)) {
          fs.mkdirSync(projectPath, { recursive: true });
        }
        
        return { projectPath };
      }
    },
    {
      name: 'Create Configuration',
      action: async (context) => {
        console.log('  Creating configuration files...');
        
        const configContent = JSON.stringify({
          name: 'custom-project',
          version: '1.0.0',
          type: 'custom'
        }, null, 2);
        
        fs.writeFileSync(
          path.join(context.projectPath, 'config.json'),
          configContent
        );
        
        return { configCreated: true };
      }
    },
    {
      name: 'Generate Documentation',
      action: async (context) => {
        console.log('  Generating documentation...');
        
        const readme = `# Custom Project

This project was created using a custom Vibecoder workflow.

## Getting Started

Follow these steps to get started with your custom project.

## Features

- Custom workflow execution
- Agentic approach
- Extensible architecture
`;
        
        fs.writeFileSync(
          path.join(context.projectPath, 'README.md'),
          readme
        );
        
        return { docsCreated: true };
      }
    },
    {
      name: 'Agent-Based Optimization',
      agent: 'optimizer',
      prompt: 'Optimize the project structure for best practices',
      optional: true
    },
    {
      name: 'Finalize',
      action: async (context) => {
        console.log('\n✨ Custom workflow completed!');
        console.log(`📁 Project created at: ${context.projectPath}`);
        return { completed: true };
      }
    }
  ];
  
  try {
    const result = await createCustomWorkflow(steps, {
      customOption: 'example-value'
    });
    
    console.log('\n✅ Custom workflow example completed successfully!');
    console.log(`Executed ${result.results.length} steps`);
  } catch (error) {
    console.error('❌ Custom workflow failed:', error.message);
    process.exit(1);
  }
}

main();
