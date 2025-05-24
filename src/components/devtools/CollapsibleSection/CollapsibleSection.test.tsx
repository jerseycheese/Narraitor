import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { CollapsibleSection } from './CollapsibleSection';

describe('CollapsibleSection', () => {
  it('renders title and content properly', () => {
    render(
      <CollapsibleSection title="Test Section">
        <div data-testid="section-content">Content</div>
      </CollapsibleSection>
    );
    
    expect(screen.getByTestId('collapsible-section-title')).toHaveTextContent('Test Section');
    expect(screen.getByTestId('section-content')).toBeInTheDocument();
  });
  
  it('is expanded by default', () => {
    render(
      <CollapsibleSection title="Test Section">
        <div data-testid="section-content">Content</div>
      </CollapsibleSection>
    );
    
    expect(screen.getByTestId('section-content')).toBeVisible();
  });
  
  it('collapses when the toggle is clicked', () => {
    render(
      <CollapsibleSection title="Test Section">
        <div data-testid="section-content">Content</div>
      </CollapsibleSection>
    );
    
    // Click the toggle button
    fireEvent.click(screen.getByTestId('collapsible-section-toggle'));
    
    // Content container should have the 'hidden' class
    const contentContainer = screen.getByTestId('collapsible-section-content');
    expect(contentContainer).toHaveClass('hidden');
  });
  
  it('renders with collapsed state when configured', () => {
    const { rerender } = render(
      <CollapsibleSection title="Test Section" initiallyExpanded={false}>
        <div data-testid="section-content">Content</div>
      </CollapsibleSection>
    );
    
    expect(screen.getByTestId('collapsible-section-toggle')).toHaveAttribute('aria-expanded', 'false');
    
    rerender(
      <CollapsibleSection title="Test Section" initialCollapsed={true}>
        <div data-testid="section-content">Content</div>
      </CollapsibleSection>
    );
    
    expect(screen.getByTestId('collapsible-section-toggle')).toHaveAttribute('aria-expanded', 'false');
  });
  
  
  it('shows correct toggle icon based on expanded state', () => {
    render(
      <CollapsibleSection title="Test Section">
        <div>Content</div>
      </CollapsibleSection>
    );
    
    const toggle = screen.getByTestId('collapsible-section-toggle');
    
    // Initially expanded
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    
    // Click to collapse
    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
  });
});