# Vibecoder 🎨

An agentic workflow system that empowers vibecoders to create any project they wish using AI-powered workflows.

## Overview

Vibecoder is a modern project generation tool that uses an agentic workflow approach to help developers quickly bootstrap projects. Whether you're building a web app, REST API, CLI tool, or machine learning project, Vibecoder has you covered.

## Features

- 🤖 **Agentic Workflow Engine** - Smart, step-by-step project creation
- 📦 **Multiple Templates** - Web apps, APIs, CLI tools, ML projects
- 🎯 **Extensible Architecture** - Easy to add custom templates and workflows
- 🚀 **Zero Configuration** - Works out of the box
- 💡 **Vibe-Driven Development** - Create projects that match your vision

## Installation

```bash
git clone https://github.com/InsightsLog/econ.git vibecoder
cd vibecoder
npm install
npm link  # Optional: make 'vibecoder' available globally
```

Note: The repository is named 'econ' but the project is called 'Vibecoder'.

## Quick Start

### Create a Web Application

```bash
node src/cli.js create web my-web-app
cd my-web-app
npm install
npm start
```

### Create a REST API

```bash
node src/cli.js create api my-api
cd my-api
npm install
npm start
```

### Create a CLI Tool

```bash
node src/cli.js create cli my-tool
cd my-tool
npm install
npm start
```

### Create a Machine Learning Project

```bash
node src/cli.js create ml my-ml-project
cd my-ml-project
pip install -r requirements.txt
python main.py
```

## Available Templates

- **web** - Modern web application with Express backend
- **api** - REST API server with Express and routing
- **cli** - Command-line interface tool
- **ml** - Machine Learning project with Python

## CLI Commands

```bash
# List all available templates
node src/cli.js list

# Create a new project
node src/cli.js create <template> <project-name>

# Show help
node src/cli.js help

# Show version
node src/cli.js version
```

## Programmatic Usage

You can also use Vibecoder programmatically in your Node.js applications:

```javascript
import { createProject, getTemplates } from './src/index.js';

// Create a project
await createProject('web', 'my-project');

// Get available templates
const templates = getTemplates();
console.log(templates);
```

## Architecture

Vibecoder is built on three core components:

### 1. Workflow Engine (`workflow-engine.js`)

The workflow engine manages the execution of agentic workflows. It:
- Executes steps sequentially
- Maintains context between steps
- Handles errors gracefully
- Supports optional steps
- Enables agent-based execution

### 2. Project Generator (`project-generator.js`)

The project generator handles template-based project creation. It:
- Manages multiple project templates
- Generates file structures
- Customizes content based on options
- Supports multiple programming languages

### 3. CLI Interface (`cli.js`)

The command-line interface provides user-friendly access to Vibecoder features:
- Interactive project creation
- Template listing
- Help and documentation

## Creating Custom Workflows

You can create custom workflows by combining steps:

```javascript
import { WorkflowEngine } from './src/workflow-engine.js';

const engine = new WorkflowEngine();

engine.addStep({
  name: 'Custom Step',
  action: async (context) => {
    // Your custom logic here
    return { result: 'success' };
  }
});

engine.addStep({
  name: 'Agent Step',
  agent: 'codeGenerator',
  prompt: 'Generate a React component',
  optional: true
});

await engine.execute({ projectName: 'my-project' });
```

## Extending with New Templates

To add a new template, modify `src/project-generator.js`:

```javascript
this.templates.set('mytemplate', {
  name: 'My Custom Template',
  description: 'Description of my template',
  files: {
    'package.json': this.generateMyPackageJson,
    'src/index.js': this.generateMyIndex,
    'README.md': this.generateMyReadme
  }
});
```

## What is a "Vibecoder"?

A vibecoder is someone who:
- Creates projects based on vision and intuition
- Values rapid iteration and exploration
- Embraces AI-powered development tools
- Focuses on the vibe and feel of their work
- Wants to spend less time on boilerplate and more time on innovation

## Project Structure

```
econ/
├── src/
│   ├── cli.js              # CLI interface
│   ├── index.js            # Main entry point
│   ├── workflow-engine.js  # Workflow execution engine
│   └── project-generator.js # Template-based project generation
├── package.json
├── .gitignore
└── README.md
```

## Development

```bash
# Run the CLI
node src/cli.js

# Test project creation
node src/cli.js create web test-app

# Install globally for development
npm link
vibecoder create web my-app
```

## Future Enhancements

- [ ] AI agent integration for intelligent project customization
- [ ] Interactive project creation wizard
- [ ] Custom template repositories
- [ ] Project configuration files (.vibecoder.json)
- [ ] Plugin system for extending functionality
- [ ] More built-in templates (React, Vue, Next.js, etc.)
- [ ] Project migration tools
- [ ] Cloud deployment integration

## Contributing

Contributions are welcome! Feel free to:
- Add new templates
- Improve the workflow engine
- Enhance documentation
- Report bugs
- Suggest features

## License

MIT

## Credits

Created with ❤️ for vibecoders everywhere.