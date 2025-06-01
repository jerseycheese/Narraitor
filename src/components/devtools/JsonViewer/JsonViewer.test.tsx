import React from 'react';
import { render, screen } from '@testing-library/react';
import { JsonViewer } from './JsonViewer';


describe('JsonViewer', () => {
  const testData = {
    name: 'Test Object',
    number: 42,
    nested: {
      property: 'value',
      array: [1, 2, 3]
    }
  };
  
  it('renders JSON data in a formatted way', () => {
    render(<JsonViewer data={testData} />);
    
    const container = screen.getByTestId('json-viewer');
    expect(container).toBeInTheDocument();
    
    // Check for key content presence (without exact matching)
    const content = container.textContent || '';
    expect(content).toContain('name');
    expect(content).toContain('Test Object');
    expect(content).toContain('number');
    expect(content).toContain('42');
  });
  
  it('renders null and undefined values correctly', () => {
    const data = {
      nullValue: null,
      undefinedValue: undefined
    };
    
    render(<JsonViewer data={data} />);
    
    const content = screen.getByTestId('json-viewer').textContent || '';
    expect(content).toContain('nullValue');
    expect(content).toContain('null');
    expect(content).toContain('undefinedValue');
    expect(content).toContain('undefined');
  });
  
  it('handles empty data', () => {
    render(<JsonViewer data={{}} />);
    
    const container = screen.getByTestId('json-viewer');
    expect(container.textContent).toContain('{}');
  });
  
  it('renders with custom className if provided', () => {
    render(<JsonViewer data={testData} className="custom-class" />);
    
    const container = screen.getByTestId('json-viewer');
    expect(container).toHaveClass('custom-class');
  });
  
  it('handles complex data with dates and functions', () => {
    const complexData = {
      date: new Date('2023-01-01T00:00:00Z'),
      func: function testFunc() { return true; },
      reference: 'Some reference'
    };
    
    render(<JsonViewer data={complexData} />);
    
    const container = screen.getByTestId('json-viewer');
    expect(container).toBeInTheDocument();
    
    const content = container.textContent || '';
    expect(content).toContain('2023-01-01');
    expect(content).toContain('[Function]');
  });
  
});