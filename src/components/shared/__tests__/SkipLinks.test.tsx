import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { SkipLinks } from '../SkipLinks';

describe('SkipLinks Component', () => {
  beforeEach(() => {
    // Clear the DOM before each test
    document.body.innerHTML = '';
  });

  test('renders skip to main content link', () => {
    render(<SkipLinks />);
    
    const skipLink = screen.getByRole('link', { name: /skip to main content/i });
    expect(skipLink).toBeInTheDocument();
    expect(skipLink).toHaveAttribute('href', '#main-content');
  });

  test('skip link is visually hidden by default but visible on focus', () => {
    render(<SkipLinks />);
    
    const skipLink = screen.getByRole('link', { name: /skip to main content/i });
    
    // Should have screen reader only classes by default
    expect(skipLink).toHaveClass('sr-only');
    
    // Should become visible on focus
    expect(skipLink).toHaveClass('focus:not-sr-only');
  });

  test('skip link is the first focusable element on the page', async () => {
    const user = userEvent.setup();
    
    render(
      <div>
        <SkipLinks />
        <button>Other Button</button>
        <input type="text" />
      </div>
    );
    
    // Tab should focus the skip link first
    await user.tab();
    
    const skipLink = screen.getByRole('link', { name: /skip to main content/i });
    expect(skipLink).toHaveFocus();
  });

  test('clicking skip link moves focus to main content', async () => {
    const user = userEvent.setup();
    
    // Add main content element to document
    const mainContent = document.createElement('main');
    mainContent.id = 'main-content';
    mainContent.tabIndex = -1;
    document.body.appendChild(mainContent);
    
    render(<SkipLinks />);
    
    const skipLink = screen.getByRole('link', { name: /skip to main content/i });
    
    // Click the skip link
    await user.click(skipLink);
    
    // Main content should now have focus
    expect(mainContent).toHaveFocus();
  });

  test('skip link has proper ARIA attributes', () => {
    render(<SkipLinks />);
    
    const skipLink = screen.getByRole('link', { name: /skip to main content/i });
    
    // Should have descriptive text
    expect(skipLink).toHaveAccessibleName('Skip to main content');
    
    // Should be properly labeled for screen readers
    expect(skipLink).toHaveAttribute('href', '#main-content');
  });

  test('skip link works with keyboard navigation', async () => {
    const user = userEvent.setup();
    
    // Add main content element
    const mainContent = document.createElement('main');
    mainContent.id = 'main-content';
    mainContent.tabIndex = -1;
    document.body.appendChild(mainContent);
    
    render(<SkipLinks />);
    
    const skipLink = screen.getByRole('link', { name: /skip to main content/i });
    
    // Focus the skip link
    skipLink.focus();
    expect(skipLink).toHaveFocus();
    
    // Press Enter to activate
    await user.keyboard('{Enter}');
    
    // Main content should have focus
    expect(mainContent).toHaveFocus();
  });

  test('multiple skip links are supported', () => {
    render(<SkipLinks />);
    
    // Should have at least the main content skip link
    const skipLinks = screen.getAllByRole('link');
    const mainContentLink = skipLinks.find(link => 
      link.getAttribute('href') === '#main-content'
    );
    
    expect(mainContentLink).toBeInTheDocument();
    expect(skipLinks.length).toBeGreaterThanOrEqual(1);
  });
});