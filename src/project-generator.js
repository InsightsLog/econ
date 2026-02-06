/**
 * Project Generator
 * Generates projects based on templates and user requirements
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class ProjectGenerator {
  constructor(workflowEngine) {
    this.workflowEngine = workflowEngine;
    this.templates = new Map();
    this.loadTemplates();
  }

  /**
   * Load available project templates
   */
  loadTemplates() {
    // Built-in templates
    this.templates.set('web', {
      name: 'Modern Web Application',
      description: 'Full-stack web application with React frontend',
      files: {
        'package.json': this.generateWebPackageJson,
        'src/index.html': this.generateIndexHtml,
        'src/app.js': this.generateAppJs,
        'README.md': this.generateWebReadme
      }
    });

    this.templates.set('api', {
      name: 'REST API Server',
      description: 'Node.js REST API with Express',
      files: {
        'package.json': this.generateApiPackageJson,
        'src/server.js': this.generateServerJs,
        'src/routes/index.js': this.generateRoutes,
        'README.md': this.generateApiReadme
      }
    });

    this.templates.set('cli', {
      name: 'CLI Tool',
      description: 'Command-line interface tool',
      files: {
        'package.json': this.generateCliPackageJson,
        'src/cli.js': this.generateCliJs,
        'README.md': this.generateCliReadme
      }
    });

    this.templates.set('ml', {
      name: 'Machine Learning Project',
      description: 'Python ML project with Jupyter notebooks',
      files: {
        'requirements.txt': this.generateRequirementsTxt,
        'main.py': this.generateMainPy,
        'README.md': this.generateMlReadme
      }
    });
  }

  /**
   * Generate a project from a template
   * @param {string} templateName - Name of the template to use
   * @param {string} projectPath - Path where to create the project
   * @param {Object} options - Project options
   */
  async generate(templateName, projectPath, options = {}) {
    const template = this.templates.get(templateName);
    
    if (!template) {
      throw new Error(`Template "${templateName}" not found`);
    }

    console.log(`\n🎨 Creating ${template.name}...`);
    console.log(`📁 Location: ${projectPath}`);

    // Create project directory
    if (!fs.existsSync(projectPath)) {
      fs.mkdirSync(projectPath, { recursive: true });
    }

    // Generate files from template
    for (const [filePath, generator] of Object.entries(template.files)) {
      const fullPath = path.join(projectPath, filePath);
      const dir = path.dirname(fullPath);
      
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      const content = typeof generator === 'function' 
        ? generator(options) 
        : generator;
      
      fs.writeFileSync(fullPath, content);
      console.log(`  ✅ Created ${filePath}`);
    }

    console.log(`\n✨ Project created successfully!`);
    return { projectPath, template: templateName };
  }

  /**
   * Get list of available templates
   */
  getTemplates() {
    return Array.from(this.templates.entries()).map(([key, template]) => ({
      id: key,
      name: template.name,
      description: template.description
    }));
  }

  // Template generators for web project
  generateWebPackageJson(options) {
    return JSON.stringify({
      name: options.projectName || 'web-app',
      version: '1.0.0',
      description: 'Modern web application',
      main: 'src/app.js',
      scripts: {
        start: 'node src/app.js',
        dev: 'node src/app.js'
      },
      dependencies: {
        express: '^4.18.0'
      }
    }, null, 2);
  }

  generateIndexHtml(options) {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${options.projectName || 'Web App'}</title>
</head>
<body>
    <div id="app">
        <h1>Welcome to ${options.projectName || 'Your Web App'}!</h1>
        <p>Start building your amazing project here.</p>
    </div>
</body>
</html>`;
  }

  generateAppJs(options) {
    return `import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname)));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
  console.log(\`🚀 Server running at http://localhost:\${PORT}\`);
});
`;
  }

  generateWebReadme(options) {
    return `# ${options.projectName || 'Web Application'}

A modern web application created with vibecoder.

## Getting Started

\`\`\`bash
npm install
npm start
\`\`\`

Visit http://localhost:3000

## Features

- Modern web stack
- Easy to customize
- Ready to deploy

## License

MIT
`;
  }

  // Template generators for API project
  generateApiPackageJson(options) {
    return JSON.stringify({
      name: options.projectName || 'api-server',
      version: '1.0.0',
      description: 'REST API server',
      main: 'src/server.js',
      type: 'module',
      scripts: {
        start: 'node src/server.js'
      },
      dependencies: {
        express: '^4.18.0'
      }
    }, null, 2);
  }

  generateServerJs(options) {
    return `import express from 'express';
import routes from './routes/index.js';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use('/api', routes);

app.get('/', (req, res) => {
  res.json({ message: 'Welcome to ${options.projectName || 'API Server'}' });
});

app.listen(PORT, () => {
  console.log(\`🚀 API server running at http://localhost:\${PORT}\`);
});
`;
  }

  generateRoutes(options) {
    return `import express from 'express';
const router = express.Router();

router.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

router.get('/items', (req, res) => {
  res.json({ items: [] });
});

export default router;
`;
  }

  generateApiReadme(options) {
    return `# ${options.projectName || 'API Server'}

REST API server created with vibecoder.

## Getting Started

\`\`\`bash
npm install
npm start
\`\`\`

## API Endpoints

- GET / - Welcome message
- GET /api/health - Health check
- GET /api/items - Get items

## License

MIT
`;
  }

  // Template generators for CLI project
  generateCliPackageJson(options) {
    return JSON.stringify({
      name: options.projectName || 'cli-tool',
      version: '1.0.0',
      description: 'Command-line tool',
      main: 'src/cli.js',
      type: 'module',
      bin: {
        [options.projectName || 'cli-tool']: './src/cli.js'
      },
      scripts: {
        start: 'node src/cli.js'
      }
    }, null, 2);
  }

  generateCliJs(options) {
    return `#!/usr/bin/env node

console.log('Welcome to ${options.projectName || 'CLI Tool'}!');

const args = process.argv.slice(2);

if (args.length === 0) {
  console.log('Usage: cli-tool <command>');
  process.exit(0);
}

const command = args[0];

switch (command) {
  case 'help':
    console.log('Available commands: help, version');
    break;
  case 'version':
    console.log('Version 1.0.0');
    break;
  default:
    console.log(\`Unknown command: \${command}\`);
}
`;
  }

  generateCliReadme(options) {
    return `# ${options.projectName || 'CLI Tool'}

Command-line tool created with vibecoder.

## Installation

\`\`\`bash
npm install
npm link
\`\`\`

## Usage

\`\`\`bash
${options.projectName || 'cli-tool'} help
\`\`\`

## License

MIT
`;
  }

  // Template generators for ML project
  generateRequirementsTxt(options) {
    return `numpy>=1.21.0
pandas>=1.3.0
scikit-learn>=1.0.0
jupyter>=1.0.0
matplotlib>=3.4.0
`;
  }

  generateMainPy(options) {
    return `"""
${options.projectName || 'ML Project'}
Machine Learning project created with vibecoder
"""

import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split

def main():
    print("Welcome to ${options.projectName || 'ML Project'}!")
    print("Starting your machine learning workflow...")
    
    # Your ML code here
    data = np.random.rand(100, 5)
    print(f"Generated sample data: {data.shape}")
    
if __name__ == "__main__":
    main()
`;
  }

  generateMlReadme(options) {
    return `# ${options.projectName || 'ML Project'}

Machine Learning project created with vibecoder.

## Setup

\`\`\`bash
pip install -r requirements.txt
\`\`\`

## Usage

\`\`\`bash
python main.py
\`\`\`

## Project Structure

- main.py - Main entry point
- requirements.txt - Python dependencies

## License

MIT
`;
  }
}
