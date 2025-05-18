import fs from 'fs';
import path from 'path';

// These tests won't pass until the PostCSS configuration is fixed
describe('PostCSS Configuration', () => {
  // Adjust test to match the actual file format in use
  test('postcss.config.mjs has correct Tailwind CSS v4 structure', () => {
    const filePath = path.resolve(process.cwd(), 'postcss.config.mjs');
    const fileContent = fs.readFileSync(filePath, 'utf8');
    
    // Tailwind CSS v4 uses a different plugin structure
    expect(fileContent).toContain('@tailwindcss/postcss');
    expect(fileContent).toContain('autoprefixer');
    
    // Should NOT contain postcss-nested in v4 configuration
    expect(fileContent).not.toContain('postcss-nested');
  });
  
  // Update syntax test to handle ESM format
  test('postcss.config.mjs does not have malformed syntax', () => {
    const filePath = path.resolve(process.cwd(), 'postcss.config.mjs');
    const fileContent = fs.readFileSync(filePath, 'utf8');
    
    // More appropriate checks for ESM files
    expect(fileContent).toContain('const postcssConfig = {');
    expect(fileContent).toContain('plugins: {');
    expect(fileContent).toContain('export default postcssConfig');
    
    // Check for balanced braces - simple check for correct syntax
    const openBraces = (fileContent.match(/{/g) || []).length;
    const closeBraces = (fileContent.match(/}/g) || []).length;
    expect(openBraces).toEqual(closeBraces);
    
    // Check for missing commas or braces
    expect(fileContent).not.toContain(',,');
    expect(fileContent).not.toContain('{,');
    expect(fileContent).not.toContain(',}');
  });
});
