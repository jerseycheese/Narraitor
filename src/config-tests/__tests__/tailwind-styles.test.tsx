import fs from 'fs';
import path from 'path';

describe('Tailwind CSS Configuration Integration', () => {
  // Test PostCSS Configuration
  test('postcss.config.mjs file exists and has correct structure', () => {
    const configPath = path.resolve(process.cwd(), 'postcss.config.mjs');
    expect(fs.existsSync(configPath)).toBe(true);
    
    // Read and check content for Tailwind v3 format
    const fileContent = fs.readFileSync(configPath, 'utf8');
    expect(fileContent).toContain('export default');
    expect(fileContent).toContain('plugins:');
    expect(fileContent).toContain('tailwindcss: {}');
    expect(fileContent).toContain('autoprefixer: {}');
    
    // Should NOT contain v4 syntax while using v3
    expect(fileContent).not.toContain('@tailwindcss/postcss');
  });
  
  // Test for globals.css to have Tailwind directives
  test('globals.css has required Tailwind v3 directives', () => {
    const globalsPath = path.resolve(process.cwd(), 'src/app/globals.css');
    expect(fs.existsSync(globalsPath)).toBe(true);
    
    const fileContent = fs.readFileSync(globalsPath, 'utf8');
    // Tailwind v3 uses separate directives
    expect(fileContent).toContain('@tailwind base');
    expect(fileContent).toContain('@tailwind components'); 
    expect(fileContent).toContain('@tailwind utilities');
  });
});
