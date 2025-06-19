import fs from 'fs';
import path from 'path';

describe('PostCSS Configuration', () => {
  test('postcss.config.mjs has correct Tailwind CSS v3 structure', () => {
    const filePath = path.resolve(process.cwd(), 'postcss.config.mjs');
    const fileContent = fs.readFileSync(filePath, 'utf8');
    
    // Tailwind CSS v3 uses traditional plugin structure
    expect(fileContent).toContain('tailwindcss: {}');
    expect(fileContent).toContain('autoprefixer: {}');
    expect(fileContent).toContain('export default');
    expect(fileContent).toContain('plugins:');
    
    // Should NOT contain v4 syntax while using v3
    expect(fileContent).not.toContain('@tailwindcss/postcss');
  });
  
  test('postcss.config.mjs has valid syntax', () => {
    const filePath = path.resolve(process.cwd(), 'postcss.config.mjs');
    const fileContent = fs.readFileSync(filePath, 'utf8');
    
    // Check for basic ESM export structure
    expect(fileContent).toContain('export default');
    expect(fileContent).toContain('plugins:');
    
    // Check for balanced braces
    const openBraces = (fileContent.match(/{/g) || []).length;
    const closeBraces = (fileContent.match(/}/g) || []).length;
    expect(openBraces).toEqual(closeBraces);
    
    // Check for common syntax errors
    expect(fileContent).not.toContain(',,');
    expect(fileContent).not.toContain('{,');
    expect(fileContent).not.toContain(',}');
  });
});
