import fs from 'fs';
import path from 'path';

// These tests won't pass until the PostCSS configuration is fixed
describe('PostCSS Configuration', () => {
  // Adjust test to match the actual file format in use
  test('postcss.config.mjs has plugins in correct order', () => {
    const filePath = path.resolve(process.cwd(), 'postcss.config.mjs');
    const fileContent = fs.readFileSync(filePath, 'utf8');
    
    // Instead of using string indices, we'll verify the structure more reliably
    expect(fileContent).toContain('postcss-nested');
    expect(fileContent).toContain('@tailwindcss/postcss');
    expect(fileContent).toContain('autoprefixer');
    
    // Verify that postcss-nested comes before tailwindcss
    const nestedIndex = fileContent.indexOf('postcss-nested');
    const tailwindIndex = fileContent.indexOf('@tailwindcss/postcss');
    expect(nestedIndex).toBeLessThan(tailwindIndex);
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
