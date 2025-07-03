#!/usr/bin/env node

import { cp, mkdir } from 'fs/promises';
import { dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function copyStorybook() {
  try {
    const projectRoot = dirname(__dirname);
    const source = `${projectRoot}/storybook-static`;
    const destination = `${projectRoot}/public/storybook`;
    
    console.log('Copying Storybook build to public directory...');
    console.log(`Source: ${source}`);
    console.log(`Destination: ${destination}`);
    
    // Ensure public directory exists
    await mkdir(`${projectRoot}/public`, { recursive: true });
    
    // Copy storybook-static to public/storybook
    await cp(source, destination, { recursive: true });
    
    console.log('✅ Storybook copied successfully!');
  } catch (error) {
    console.error('❌ Error copying Storybook:', error.message);
    process.exit(1);
  }
}

copyStorybook();