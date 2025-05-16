/**
 * Tests for the Tailwind CSS configuration file
 * @jest-environment node
 */

import fs from 'fs';
import path from 'path';

describe('Tailwind Configuration', () => {
  const configPath = path.resolve(process.cwd(), 'tailwind.config.ts');
  
  test('tailwind.config.ts file exists', () => {
    expect(fs.existsSync(configPath)).toBe(true);
  });
  
  test('tailwind.config.ts is properly structured', () => {
    const fileContent = fs.readFileSync(configPath, 'utf8');
    
    // Check for expected content
    expect(fileContent).toContain('import type { Config } from \'tailwindcss\'');
    expect(fileContent).toContain('const config: Config = {');
    expect(fileContent).toContain('content: [');
    expect(fileContent).toContain('./src/app/');
    expect(fileContent).toContain('./src/components/');
    expect(fileContent).toContain('theme: {');
    expect(fileContent).toContain('export default config');
  });
  
  test('tailwind.config.ts includes all required content paths', () => {
    const fileContent = fs.readFileSync(configPath, 'utf8');
    
    // Check that the content array includes all required paths
    expect(fileContent).toMatch(/\.\/src\/app\/.*?\.{js,ts,jsx,tsx}/);
    expect(fileContent).toMatch(/\.\/src\/components\/.*?\.{js,ts,jsx,tsx}/);
    expect(fileContent).toMatch(/\.\/src\/lib\/.*?\.{js,ts,jsx,tsx}/);
  });
  
  test('tailwind.config.ts includes appropriate Tailwind v4 configuration', () => {
    const fileContent = fs.readFileSync(configPath, 'utf8');
    
    // Check for Tailwind v4 specific configuration
    expect(fileContent).toContain('future:');
    expect(fileContent).toContain('hoverOnlyWhenSupported');
  });
});
