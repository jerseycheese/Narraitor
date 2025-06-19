/**
 * Tests for Tailwind CSS v3 configuration via PostCSS
 * Note: Temporarily using v3 until Storybook supports v4
 * @jest-environment node
 */

import fs from 'fs';
import path from 'path';

describe('Tailwind v3 Configuration', () => {
  const postcssConfigPath = path.resolve(process.cwd(), 'postcss.config.mjs');
  const globalsPath = path.resolve(process.cwd(), 'src/app/globals.css');
  
  test('PostCSS config includes Tailwind v3 plugin', () => {
    expect(fs.existsSync(postcssConfigPath)).toBe(true);
    const fileContent = fs.readFileSync(postcssConfigPath, 'utf8');
    
    // Check for Tailwind v3 PostCSS plugin
    expect(fileContent).toContain('tailwindcss: {}');
    expect(fileContent).toContain('autoprefixer: {}');
  });
  
  test('globals.css includes Tailwind v3 directives', () => {
    expect(fs.existsSync(globalsPath)).toBe(true);
    const fileContent = fs.readFileSync(globalsPath, 'utf8');
    
    // Check for Tailwind v3 directive syntax
    expect(fileContent).toContain('@tailwind base');
    expect(fileContent).toContain('@tailwind components');
    expect(fileContent).toContain('@tailwind utilities');
  });
});
