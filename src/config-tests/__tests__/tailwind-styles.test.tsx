import fs from 'fs';
import path from 'path';

describe('Tailwind CSS Configuration Integration', () => {
  // Test PostCSS Configuration
  test('postcss.config.mjs file exists and has correct structure', () => {
    const configPath = path.resolve(process.cwd(), 'postcss.config.mjs');
    expect(fs.existsSync(configPath)).toBe(true);
    
    // Read and check content for Tailwind v4 format
    const fileContent = fs.readFileSync(configPath, 'utf8');
    expect(fileContent).toContain('export default');
    expect(fileContent).toContain('plugins:');
    expect(fileContent).toContain('@tailwindcss/postcss');
    
    // Should NOT contain postcss-nested in v4 configuration
    expect(fileContent).not.toContain('postcss-nested');
  });
  
  // Test for globals.css to have Tailwind directives
  test('globals.css has required Tailwind v4 directives', () => {
    const globalsPath = path.resolve(process.cwd(), 'src/app/globals.css');
    expect(fs.existsSync(globalsPath)).toBe(true);
    
    const fileContent = fs.readFileSync(globalsPath, 'utf8');
    // Tailwind v4 uses single import
    expect(fileContent).toContain('@import "tailwindcss"');
  });
});
