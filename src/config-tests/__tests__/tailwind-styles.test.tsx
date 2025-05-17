import fs from 'fs';
import path from 'path';

describe('Tailwind CSS Configuration Integration', () => {
  // Test PostCSS Configuration
  test('postcss.config.mjs file exists and has correct structure', () => {
    const configPath = path.resolve(process.cwd(), 'postcss.config.mjs');
    expect(fs.existsSync(configPath)).toBe(true);
    
    // Read and check content
    const fileContent = fs.readFileSync(configPath, 'utf8');
    expect(fileContent).toContain('const postcssConfig = {');
    expect(fileContent).toContain('plugins: {');
    expect(fileContent).toContain('postcss-nested');
    expect(fileContent).toContain('@tailwindcss/postcss');
    expect(fileContent).toContain('autoprefixer');
    expect(fileContent).toContain('export default postcssConfig');
  });
  
  // Test Tailwind Configuration
  test('tailwind.config.ts file exists and has correct structure', () => {
    const configPath = path.resolve(process.cwd(), 'tailwind.config.ts');
    expect(fs.existsSync(configPath)).toBe(true);
    
    // Read and check content
    const fileContent = fs.readFileSync(configPath, 'utf8');
    expect(fileContent).toContain('import type { Config } from \'tailwindcss\'');
    expect(fileContent).toContain('const config: Config = {');
    expect(fileContent).toContain('content: [');
    expect(fileContent).toContain('./src/app/');
    expect(fileContent).toContain('./src/components/');
    expect(fileContent).toContain('theme: {');
    expect(fileContent).toContain('export default config');
  });
  
  // Test for globals.css to have Tailwind directives
  test('globals.css has required Tailwind directives', () => {
    const globalsPath = path.resolve(process.cwd(), 'src/app/globals.css');
    expect(fs.existsSync(globalsPath)).toBe(true);
    
    const fileContent = fs.readFileSync(globalsPath, 'utf8');
    expect(fileContent).toContain('@import "tailwindcss/preflight.css"');
    expect(fileContent).toContain('@import "tailwindcss/utilities.css"');
  });
});
