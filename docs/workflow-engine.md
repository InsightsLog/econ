# Workflow Engine Architecture

The Workflow Engine is the core component of Vibecoder that manages the execution of agentic workflows.

## Overview

The workflow engine executes a series of steps in sequence, maintaining context between steps and handling errors gracefully. It's designed to be extensible and support both function-based and agent-based steps.

## Key Concepts

### Workflow

A workflow is a collection of steps that are executed in order. Each workflow has:
- **Steps**: Individual actions to perform
- **Context**: Shared state between steps
- **Results**: Output from each step

### Steps

A step represents a single action in the workflow. Steps can be:

1. **Function Steps**: Execute JavaScript functions
2. **Agent Steps**: Call AI agents for intelligent decision-making
3. **Optional Steps**: Can fail without stopping the workflow

### Context

Context is the shared state that flows through the workflow. Each step can:
- Read from the context
- Add new data to the context
- Transform existing context data

## Usage

### Creating a Workflow

```javascript
import { WorkflowEngine } from './src/workflow-engine.js';

const engine = new WorkflowEngine();
```

### Adding Steps

```javascript
// Function-based step
engine.addStep({
  name: 'Initialize',
  action: async (context) => {
    console.log('Initializing...');
    return { initialized: true };
  }
});

// Agent-based step
engine.addStep({
  name: 'Generate Code',
  agent: 'codeGenerator',
  prompt: 'Generate a React component',
  inputs: { componentName: 'MyComponent' }
});

// Optional step (won't fail workflow if it errors)
engine.addStep({
  name: 'Optional Optimization',
  action: async (context) => {
    // Some optimization logic
    return { optimized: true };
  },
  optional: true
});
```

### Executing the Workflow

```javascript
const result = await engine.execute({
  projectName: 'my-project',
  template: 'web'
});

console.log('Workflow result:', result);
```

## Step Configuration

Each step can have the following properties:

- `name` (required): Human-readable name for the step
- `action` (optional): Function to execute
- `agent` (optional): Name of the AI agent to call
- `prompt` (optional): Prompt for the AI agent
- `inputs` (optional): Additional inputs for the agent
- `optional` (optional): Whether step failure should stop the workflow

## Error Handling

The workflow engine handles errors at multiple levels:

1. **Step-level errors**: Each step is wrapped in try-catch
2. **Optional steps**: Can fail without stopping the workflow
3. **Workflow-level errors**: Critical failures stop execution

## Context Flow

Context flows through the workflow like this:

```
Initial Context
    ↓
  Step 1 → Updates Context
    ↓
  Step 2 → Reads & Updates Context
    ↓
  Step 3 → Reads & Updates Context
    ↓
Final Context
```

## Extension Points

The workflow engine can be extended by:

1. **Custom Step Types**: Add new step execution logic
2. **Agent Integration**: Connect to different AI providers
3. **Context Middleware**: Transform context between steps
4. **Event Hooks**: React to workflow events

## Example: Multi-Step Project Creation

```javascript
const engine = new WorkflowEngine();

engine.addStep({
  name: 'Validate Input',
  action: async (context) => {
    if (!context.projectName) {
      throw new Error('Project name is required');
    }
    return { validated: true };
  }
});

engine.addStep({
  name: 'Create Directory',
  action: async (context) => {
    // Create project directory
    return { directory: `/projects/${context.projectName}` };
  }
});

engine.addStep({
  name: 'Generate Files',
  agent: 'fileGenerator',
  prompt: 'Generate project files based on template'
});

engine.addStep({
  name: 'Install Dependencies',
  action: async (context) => {
    // Install dependencies
    return { dependenciesInstalled: true };
  }
});

const result = await engine.execute({
  projectName: 'awesome-app',
  template: 'web'
});
```

## Best Practices

1. **Keep Steps Focused**: Each step should do one thing well
2. **Use Context Wisely**: Only add necessary data to context
3. **Handle Errors**: Use optional steps for non-critical operations
4. **Log Progress**: Use console.log to track workflow progress
5. **Test Steps Independently**: Each step should be testable on its own

## Future Enhancements

- Parallel step execution
- Conditional step execution
- Step dependencies graph
- Workflow visualization
- Step retry logic
- Rollback support
