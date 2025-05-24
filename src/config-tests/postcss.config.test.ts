import fs from 'fs';
import path from 'path';

describe('PostCSS Configuration', () => {
  test('postcss.config.mjs has correct Tailwind CSS v4 structure', () => {
    const filePath = path.resolve(process.cwd(), 'postcss.config.mjs');
    const fileContent = fs.readFileSync(filePath, 'utf8');
    
    // Tailwind CSS v4 uses simplified plugin structure
    expect(fileContent).toContain('@tailwindcss/postcss');
    expect(fileContent).toContain('export default');
    expect(fileContent).toContain('plugins:');
    
    // Should NOT contain postcss-nested in v4 configuration
    expect(fileContent).not.toContain('postcss-nested');
    
    // Autoprefixer is not required in Tailwind v4
    // expect(fileContent).toContain('autoprefixer');
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
