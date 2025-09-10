import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { CollapsibleSection } from './CollapsibleSection';

describe('CollapsibleSection', () => {
  it('renders title and content properly', () => {
    render(
      <CollapsibleSection title="Test Section">
        <div>Content</div>
      </CollapsibleSection>
    );
    
    expect(screen.getByText('Test Section')).toBeInTheDocument();
    expect(screen.getByText('Content')).toBeInTheDocument();
  });
  
  it('shows content when expanded by default', () => {
    render(
      <CollapsibleSection title="Test Section">
        <div>Content</div>
      </CollapsibleSection>
    );
    
    expect(screen.getByText('Content')).toBeVisible();
    expect(screen.getByTestId('collapsible-section-toggle')).toHaveAttribute('aria-expanded', 'true');
  });
  
  it('hides content when toggle is clicked', () => {
    render(
      <CollapsibleSection title="Test Section">
        <div>Content</div>
      </CollapsibleSection>
    );
    
    // Initially content should be visible and button expanded
    expect(screen.getByText('Content')).toBeInTheDocument();
    expect(screen.getByTestId('collapsible-section-toggle')).toHaveAttribute('aria-expanded', 'true');
    
    // Click the toggle button
    const toggleButton = screen.getByTestId('collapsible-section-toggle');
    fireEvent.click(toggleButton);
    
    // Button should now show collapsed state
    expect(screen.getByTestId('collapsible-section-toggle')).toHaveAttribute('aria-expanded', 'false');
    // Button text should change from − to +
    expect(screen.getByText('+')).toBeInTheDocument();
    expect(screen.queryByText('−')).not.toBeInTheDocument();
  });
  
  it('starts collapsed when configured', () => {
    render(
      <CollapsibleSection title="Test Section" initiallyExpanded={false}>
        <div>Content</div>
      </CollapsibleSection>
    );
    
    // Should start with collapsed state
    expect(screen.getByTestId('collapsible-section-toggle')).toHaveAttribute('aria-expanded', 'false');
    expect(screen.getByText('+')).toBeInTheDocument();
  });
  
  it('starts collapsed when using initialCollapsed prop', () => {
    render(
      <CollapsibleSection title="Test Section" initialCollapsed={true}>
        <div>Content</div>
      </CollapsibleSection>
    );
    
    // Should start with collapsed state
    expect(screen.getByTestId('collapsible-section-toggle')).toHaveAttribute('aria-expanded', 'false');
    expect(screen.getByText('+')).toBeInTheDocument();
  });
  
  it('can be expanded after being collapsed', () => {
    render(
      <CollapsibleSection title="Test Section" initialCollapsed={true}>
        <div>Content</div>
      </CollapsibleSection>
    );
    
    // Initially collapsed
    expect(screen.getByTestId('collapsible-section-toggle')).toBeInTheDocument();
    expect(screen.getByText('+')).toBeInTheDocument();
    
    // Click to expand
    const toggleButton = screen.getByTestId('collapsible-section-toggle');
    fireEvent.click(toggleButton);
    
    // Now should be expanded
    expect(screen.getByTestId('collapsible-section-toggle')).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText('−')).toBeInTheDocument();
    expect(screen.queryByText('+')).not.toBeInTheDocument();
  });
});
