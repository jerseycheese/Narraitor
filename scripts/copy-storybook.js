#!/usr/bin/env node

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { cp, mkdir } from 'fs/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

async function copyStorybook() {
  try {
    const source = join(projectRoot, 'storybook-static');
    const destination = join(projectRoot, 'public', 'storybook');
    
    // Ensure the public directory exists
    await mkdir(join(projectRoot, 'public'), { recursive: true });
    
    // Copy storybook-static to public/storybook
    await cp(source, destination, { recursive: true, force: true });
    
    console.log('✅ Storybook files copied to public/storybook');
  } catch (error) {
    console.error('❌ Failed to copy Storybook files:', error.message);
    process.exit(1);
  }
}

copyStorybook();