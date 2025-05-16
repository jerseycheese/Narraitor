import React from 'react';
import { render, screen } from '@testing-library/react';
import fs from 'fs';
import path from 'path';
import StyleTest from '../StyleTest';

describe('Tailwind CSS Configuration Integration', () => {
  // Test PostCSS Configuration
  test('postcss.config.mjs file exists and has correct structure', () => {
    const configPath = path.resolve(process.cwd(), 'postcss.config.mjs');
    expect(fs.existsSync(configPath)).toBe(true);
    
    // Read and check content
    const fileContent = fs.readFileSync(configPath, 'utf8');
    expect(fileContent).toContain('export default {');
    expect(fileContent).toContain('plugins: {');
    expect(fileContent).toContain('postcss-nested');
    expect(fileContent).toContain('tailwindcss');
    expect(fileContent).toContain('autoprefixer');
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
  
  // Test style application
  test('renders Tailwind CSS styles correctly', () => {
    render(<StyleTest />);
    
    // Test basic styling
    const basicElement = screen.getByTestId('style-test-basic');
    expect(basicElement).toHaveClass('bg-blue-500');
    expect(basicElement).toHaveClass('text-white');
    expect(basicElement).toHaveClass('p-4');
    expect(basicElement).toHaveClass('rounded');
    
    // Test text styling
    const textElement = screen.getByTestId('style-test-text');
    expect(textElement).toHaveClass('text-lg');
    expect(textElement).toHaveClass('font-bold');
  });
  
  // Test responsive styling
  test('renders responsive styles correctly', () => {
    render(<StyleTest showResponsive={true} />);
    
    const responsiveElement = screen.getByTestId('style-test-responsive');
    expect(responsiveElement).toBeInTheDocument();
    expect(responsiveElement).toHaveClass('bg-gray-200');
    expect(responsiveElement).toHaveClass('p-2');
    expect(responsiveElement).toHaveClass('sm:p-4');
    expect(responsiveElement).toHaveClass('md:p-6');
    expect(responsiveElement).toHaveClass('lg:p-8');
  });
  
  // Test hover states
  test('renders hover states correctly', () => {
    render(<StyleTest showHover={true} />);
    
    const hoverElement = screen.getByTestId('style-test-hover');
    expect(hoverElement).toBeInTheDocument();
    expect(hoverElement).toHaveClass('bg-purple-500');
    expect(hoverElement).toHaveClass('hover:bg-purple-700');
    expect(hoverElement).toHaveClass('transition-colors');
  });
  
  // Test for globals.css to have Tailwind directives
  test('globals.css has required Tailwind directives', () => {
    const globalsPath = path.resolve(process.cwd(), 'src/app/globals.css');
    expect(fs.existsSync(globalsPath)).toBe(true);
    
    const fileContent = fs.readFileSync(globalsPath, 'utf8');
    expect(fileContent).toContain('@tailwind base');
    expect(fileContent).toContain('@tailwind components');
    expect(fileContent).toContain('@tailwind utilities');
  });
  
  // Test for no inline styles in layout.tsx
  test('layout.tsx does not use inline styles', () => {
    const layoutPath = path.resolve(process.cwd(), 'src/app/layout.tsx');
    expect(fs.existsSync(layoutPath)).toBe(true);
    
    const fileContent = fs.readFileSync(layoutPath, 'utf8');
    expect(fileContent).not.toContain('style=');
    expect(fileContent).toContain('className=');
  });
});
