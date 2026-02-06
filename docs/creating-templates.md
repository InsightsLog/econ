# Creating Custom Templates

This guide explains how to create custom project templates for Vibecoder.

## Overview

Templates define the structure and content of projects that Vibecoder creates. Each template is a collection of files with their content generators.

## Template Structure

A template consists of:
- **Metadata**: Name and description
- **Files**: Map of file paths to content generators
- **Generators**: Functions that create file content

## Creating a New Template

### Step 1: Define the Template

Add your template to the `loadTemplates()` method in `src/project-generator.js`:

```javascript
this.templates.set('mytemplate', {
  name: 'My Custom Template',
  description: 'Description of what this template creates',
  files: {
    'package.json': this.generateMyPackageJson,
    'src/index.js': this.generateMyIndex,
    'README.md': this.generateMyReadme,
    'config/settings.json': this.generateMyConfig
  }
});
```

### Step 2: Create Generator Functions

Add generator functions to the `ProjectGenerator` class:

```javascript
generateMyPackageJson(options) {
  return JSON.stringify({
    name: options.projectName || 'my-project',
    version: '1.0.0',
    description: 'My custom project',
    main: 'src/index.js',
    scripts: {
      start: 'node src/index.js',
      test: 'echo "No tests yet"'
    },
    dependencies: {
      // Add your dependencies
    }
  }, null, 2);
}

generateMyIndex(options) {
  return `// ${options.projectName || 'My Project'}
// Main entry point

console.log('Hello from ${options.projectName}!');

function main() {
  // Your code here
}

main();
`;
}

generateMyReadme(options) {
  return `# ${options.projectName || 'My Project'}

Description of your project.

## Getting Started

\`\`\`bash
npm install
npm start
\`\`\`

## Features

- Feature 1
- Feature 2

## License

MIT
`;
}

generateMyConfig(options) {
  return JSON.stringify({
    projectName: options.projectName,
    environment: 'development',
    settings: {
      // Your settings
    }
  }, null, 2);
}
```

### Step 3: Test Your Template

```bash
node src/cli.js create mytemplate test-project
cd test-project
npm install
npm start
```

## Template Options

Generators receive an `options` object with:
- `projectName`: Name of the project being created
- Any custom options passed to the generator

Use these options to customize the generated content:

```javascript
generateMyFile(options) {
  const name = options.projectName || 'default-name';
  const author = options.author || 'Anonymous';
  
  return `// Project: ${name}
// Author: ${author}

console.log('Hello!');
`;
}
```

## Advanced Templates

### Multi-Language Templates

You can create templates for any programming language:

```javascript
this.templates.set('rust', {
  name: 'Rust Application',
  description: 'Rust project with Cargo',
  files: {
    'Cargo.toml': this.generateCargoToml,
    'src/main.rs': this.generateMainRs,
    'README.md': this.generateRustReadme
  }
});
```

### Complex Directory Structures

Create nested directories by using paths in file keys:

```javascript
files: {
  'src/main/java/App.java': this.generateJavaApp,
  'src/test/java/AppTest.java': this.generateJavaTest,
  'pom.xml': this.generatePomXml,
  'README.md': this.generateJavaReadme
}
```

### Dynamic File Generation

Generate files based on options:

```javascript
async generate(templateName, projectPath, options = {}) {
  // ... existing code ...
  
  // Generate additional files based on options
  if (options.includeTests) {
    const testFile = this.generateTestFile(options);
    fs.writeFileSync(
      path.join(projectPath, 'test/index.test.js'),
      testFile
    );
  }
}
```

## Template Best Practices

1. **Keep It Simple**: Start with minimal files, add more as needed
2. **Use Comments**: Help users understand the generated code
3. **Include Documentation**: Always generate a README
4. **Follow Conventions**: Match the conventions of the ecosystem
5. **Make It Runnable**: Ensure projects work immediately after generation
6. **Add Examples**: Include example code to guide users

## Example: Full Stack Template

Here's an example of a more complex template:

```javascript
this.templates.set('fullstack', {
  name: 'Full Stack Application',
  description: 'React frontend with Node.js backend',
  files: {
    // Root files
    'package.json': this.generateFullstackPackageJson,
    'README.md': this.generateFullstackReadme,
    '.gitignore': this.generateFullstackGitignore,
    
    // Frontend
    'client/package.json': this.generateClientPackageJson,
    'client/src/App.jsx': this.generateAppJsx,
    'client/src/index.html': this.generateClientHtml,
    
    // Backend
    'server/package.json': this.generateServerPackageJson,
    'server/src/index.js': this.generateServerIndex,
    'server/src/routes/api.js': this.generateServerRoutes,
    
    // Config
    'config/development.json': this.generateDevConfig,
    'config/production.json': this.generateProdConfig
  }
});
```

## Contributing Templates

When contributing a new template:

1. Ensure it follows the existing template structure
2. Test it thoroughly with different project names
3. Add documentation for any special options
4. Update the README with the new template
5. Add an example in the examples directory

## Template Ideas

Consider creating templates for:
- React/Vue/Angular applications
- GraphQL APIs
- Microservices
- Discord/Slack bots
- Chrome extensions
- Mobile apps (React Native)
- Desktop apps (Electron)
- Game development
- Data science projects
- DevOps tools

## Next Steps

After creating your template:
1. Test it with various project names
2. Document any special requirements
3. Share it with the community
4. Consider making it configurable
