import React from 'react';
import { render, screen } from '@testing-library/react';
import { StateSection } from './StateSection';

// Mock the stores
jest.mock('@/state', () => {
  // Return a module with a worldStore function that has getState
  const mockWorldStore = () => {};
  mockWorldStore.getState = jest.fn().mockReturnValue({
    worlds: {
      'world-1': { id: 'world-1', name: 'Test World' }
    },
    currentWorld: 'world-1'
  });
  
  return {
    worldStore: mockWorldStore
  };
});

// Mock the CollapsibleSection component
jest.mock('../CollapsibleSection', () => ({
  CollapsibleSection: ({ title, children }: { title: string, children: React.ReactNode }) => (
    <div data-testid="collapsible-section-title">{title}
      <div data-testid="collapsible-section-content">{children}</div>
    </div>
  )
}));

// Mock the JsonViewer component
jest.mock('../JsonViewer', () => ({
  JsonViewer: ({ data }: { data: unknown }) => (
    <pre data-testid="json-viewer">{JSON.stringify(data)}</pre>
  )
}));

describe('StateSection', () => {
  it('renders all store states', () => {
    render(<StateSection />);
    
    expect(screen.getByTestId('devtools-state-section')).toBeInTheDocument();
    
    // Check for world store state
    expect(screen.getByText(/worldStore/)).toBeInTheDocument();
  });
  
  it('renders each store in its own collapsible section', () => {
    render(<StateSection />);
    
    // Check for collapsible sections
    const sections = screen.getAllByTestId('collapsible-section-title');
    expect(sections.length).toBeGreaterThan(0); // At least one section
  });
  
  it('uses JsonViewer to display state', () => {
    render(<StateSection />);
    
    // Each store should have a JsonViewer
    const jsonViewers = screen.getAllByTestId('json-viewer');
    expect(jsonViewers.length).toBeGreaterThan(0); // At least one JsonViewer
  });
});