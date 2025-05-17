import React from 'react';
import { render, screen } from '@testing-library/react';
import { GlobalStylesDemo } from './GlobalStylesDemo';

describe('GlobalStylesDemo', () => {
  it('renders heading elements with proper hierarchy', () => {
    render(<GlobalStylesDemo />);
    
    // Check main heading
    const mainHeading = screen.getByRole('heading', { level: 1, name: /Narraitor Global Styles/i });
    expect(mainHeading).toBeInTheDocument();
    
    // Check section headings
    const sectionHeadings = screen.getAllByRole('heading', { level: 2 });
    expect(sectionHeadings.length).toBeGreaterThanOrEqual(5); // Typography, Lists, Form Elements, Tables, Custom Components
    
    // Check for specific sections
    expect(screen.getByText(/Typography/i)).toBeInTheDocument();
    expect(screen.getByText(/Lists/i)).toBeInTheDocument();
    expect(screen.getByText(/Form Elements/i)).toBeInTheDocument();
    expect(screen.getByText(/Tables/i)).toBeInTheDocument();
    expect(screen.getByText(/Custom Components/i)).toBeInTheDocument();
  });
  
  it('renders semantic HTML elements', () => {
    render(<GlobalStylesDemo />);
    
    // Check for semantic HTML elements
    expect(screen.getByRole('main')).toBeInTheDocument();
    expect(screen.getByRole('banner')).toBeInTheDocument(); // <header>
    expect(screen.getByRole('contentinfo')).toBeInTheDocument(); // <footer>
    
    // Check for sections
    const sections = document.querySelectorAll('section');
    expect(sections.length).toBeGreaterThanOrEqual(5);
  });
  
  it('renders form elements', () => {
    render(<GlobalStylesDemo />);
    
    // Check for form elements
    expect(screen.getByRole('textbox', { name: /Text Input/i })).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: /Select Input/i })).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: /Text Area/i })).toBeInTheDocument();
    
    // Check for buttons
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThanOrEqual(3);
    
    // Check for specific buttons
    expect(screen.getByRole('button', { name: /Primary Button/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Secondary Button/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Accent Button/i })).toBeInTheDocument();
  });
  
  it('renders table with correct structure', () => {
    render(<GlobalStylesDemo />);
    
    // Check for table
    const table = screen.getByRole('table');
    expect(table).toBeInTheDocument();
    
    // Check table headers
    const tableHeaders = screen.getAllByRole('columnheader');
    expect(tableHeaders.length).toBe(3);
    expect(tableHeaders[0]).toHaveTextContent(/Name/i);
    expect(tableHeaders[1]).toHaveTextContent(/Type/i);
    expect(tableHeaders[2]).toHaveTextContent(/Description/i);
    
    // Check table rows
    const tableRows = screen.getAllByRole('row');
    expect(tableRows.length).toBe(4); // Header row + 3 data rows
  });
  
  it('renders custom components', () => {
    render(<GlobalStylesDemo />);
    
    // Check for card component
    const cardHeading = screen.getByRole('heading', { name: /Card Component/i });
    expect(cardHeading).toBeInTheDocument();
    
    // Check if the card has the correct class
    const cardElement = cardHeading.closest('.card');
    expect(cardElement).toBeInTheDocument();
  });
});