/**
 * Tests for Tailwind CSS v4 configuration via PostCSS
 * @jest-environment node
 */

import fs from 'fs';
import path from 'path';

describe('Tailwind v4 Configuration', () => {
  const postcssConfigPath = path.resolve(process.cwd(), 'postcss.config.mjs');
  const globalsPath = path.resolve(process.cwd(), 'src/app/globals.css');
  
  test('PostCSS config includes Tailwind v4 plugin', () => {
    expect(fs.existsSync(postcssConfigPath)).toBe(true);
    const fileContent = fs.readFileSync(postcssConfigPath, 'utf8');
    
    // Check for Tailwind v4 PostCSS plugin
    expect(fileContent).toContain('@tailwindcss/postcss');
  });
  
  test('globals.css includes Tailwind v4 import', () => {
    expect(fs.existsSync(globalsPath)).toBe(true);
    const fileContent = fs.readFileSync(globalsPath, 'utf8');
    
    // Check for Tailwind v4 import syntax
    expect(fileContent).toContain('@import "tailwindcss"');
  });
});
