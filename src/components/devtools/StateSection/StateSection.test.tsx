import React from 'react';
import { render, screen } from '@testing-library/react';
import { StateSection } from './StateSection';

// Mock the stores using mock abstraction
jest.mock('@/state', () => {
  const { createMockStore } = require('@/lib/test-utils/mockStore');
  return {
    worldStore: createMockStore({
      worlds: {
        'world-1': { id: 'world-1', name: 'Test World' }
      },
      currentWorld: 'world-1'
    })
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
  it('integrates with store and displays state data', () => {
    render(<StateSection />);
    
    // Main section should be present
    expect(screen.getByTestId('devtools-state-section')).toBeInTheDocument();
    
    // Should render store sections with actual content
    expect(screen.getByText(/worldStore/)).toBeInTheDocument();
    expect(screen.getAllByTestId('json-viewer').length).toBeGreaterThan(0);
    
    // Should show the mock world data
    const jsonContent = screen.getAllByTestId('json-viewer')[0].textContent;
    expect(jsonContent).toContain('Test World');
  });
});
