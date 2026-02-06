# Vibecoder Quick Start Guide

Get started with Vibecoder in 60 seconds!

## Installation

```bash
# Clone the repository
git clone https://github.com/InsightsLog/econ.git vibecoder
cd vibecoder

# Install dependencies (none required - pure Node.js!)
npm install
```

## Create Your First Project

### 1. List available templates

```bash
node src/cli.js list
```

You'll see:
- **web** - Modern web application
- **api** - REST API server
- **cli** - Command-line tool
- **ml** - Machine Learning project

### 2. Create a project

Pick any template and create your project:

```bash
# Create a web app
node src/cli.js create web my-awesome-app

# Or create an API
node src/cli.js create api my-cool-api

# Or create a CLI tool
node src/cli.js create cli my-handy-tool

# Or create an ML project
node src/cli.js create ml my-smart-model
```

### 3. Run your project

```bash
cd my-awesome-app
npm install
npm start
```

That's it! 🎉

## What Just Happened?

Vibecoder's agentic workflow:
1. ✅ Validated your template choice
2. ✅ Created project directory structure
3. ✅ Generated all necessary files
4. ✅ Configured build scripts
5. ✅ Created documentation

All in a few seconds!

## Next Steps

### Customize Your Project
Every generated project is fully functional and ready to customize:
- Edit the source files
- Add dependencies
- Modify configurations
- Deploy anywhere

### Try the Examples
```bash
# List templates programmatically
node examples/list-templates.js

# Create project programmatically
node examples/create-web-app.js

# Run custom workflows
node examples/custom-workflow.js
```

### Make It Global (Optional)
```bash
npm link
vibecoder create web another-app
```

### Create Custom Templates
Read `docs/creating-templates.md` to learn how to add your own templates.

### Learn More
- Read `README.md` for complete documentation
- Check `docs/workflow-engine.md` for architecture details
- Explore the `src/` directory to understand the code

## Pro Tips

1. **Template Preview**: Use `list` command to see what's available
2. **Custom Names**: Project names can be anything: `my-app`, `awesome-project`, `cool_stuff`
3. **Multiple Projects**: Create as many as you want - they're independent
4. **Programmatic Use**: Import Vibecoder in your own tools for automation

## Common Use Cases

### Rapid Prototyping
```bash
vibecoder create web prototype-1
cd prototype-1
npm install && npm start
# Start coding immediately!
```

### Learning New Tech
```bash
vibecoder create api learn-express
cd learn-express
# Explore the generated code
```

### Starting Side Projects
```bash
vibecoder create ml weekend-project
cd weekend-project
pip install -r requirements.txt
# Build something cool!
```

## Get Help

```bash
node src/cli.js help
```

## What's a Vibecoder?

Someone who:
- Values rapid iteration over perfect planning
- Creates based on intuition and vision
- Embraces AI-powered tools
- Focuses on the vibe and feel
- Wants less boilerplate, more innovation

Are you a vibecoder? Start creating! 🚀
