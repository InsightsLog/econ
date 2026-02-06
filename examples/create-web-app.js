/**
 * Example: Creating a web application using Vibecoder
 */

import { createProject } from '../src/index.js';

async function main() {
  console.log('Example: Creating a web application\n');
  
  try {
    await createProject('web', 'example-web-app', {
      output: './output/example-web-app'
    });
    
    console.log('\n✅ Example completed successfully!');
  } catch (error) {
    console.error('❌ Example failed:', error.message);
    process.exit(1);
  }
}

main();
