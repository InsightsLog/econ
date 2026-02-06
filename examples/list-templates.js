/**
 * Example: List all available templates
 */

import { getTemplates } from '../src/index.js';

async function main() {
  console.log('Example: Listing all available templates\n');
  
  const templates = getTemplates();
  
  console.log('📋 Available Templates:\n');
  
  templates.forEach((template, index) => {
    console.log(`${index + 1}. ${template.name} (${template.id})`);
    console.log(`   ${template.description}\n`);
  });
  
  console.log(`Total templates: ${templates.length}`);
}

main();
