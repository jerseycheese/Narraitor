import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SkipLinks } from '../SkipLinks';

describe('SkipLinks - Accessibility Navigation', () => {
  it('renders a skip to main content link', () => {
    render(<SkipLinks />);
    
    const skipLink = screen.getByRole('link', { name: /skip to main content/i });
    expect(skipLink).toBeInTheDocument();
  });

  it('has href pointing to main content landmark', () => {
    render(<SkipLinks />);
    
    const skipLink = screen.getByRole('link', { name: /skip to main content/i });
    expect(skipLink).toHaveAttribute('href', '#main-content');
  });

  it('becomes visible on focus for keyboard users', async () => {
    const user = userEvent.setup();
    render(<SkipLinks />);
    
    const skipLink = screen.getByRole('link', { name: /skip to main content/i });
    
    // Should be visually hidden initially but still in DOM
    expect(skipLink).toHaveClass('sr-only');
    
    // Should become visible when focused
    await user.tab();
    expect(skipLink).toHaveFocus();
    expect(skipLink).toHaveClass('sr-only:focus:not-sr-only');
  });

  it('moves focus to main content when activated', async () => {
    const user = userEvent.setup();
    
    // Mock main content element
    render(
      <>
        <SkipLinks />
        <main id="main-content" tabIndex={-1}>
          <h1>Main Content</h1>
        </main>
      </>
    );
    
    const skipLink = screen.getByRole('link', { name: /skip to main content/i });
    
    // Tab to skip link and activate it
    await user.tab();
    expect(skipLink).toHaveFocus();
    
    await user.click(skipLink);
    
    // Focus should move to main content
    const mainContent = screen.getByRole('main');
    expect(mainContent).toHaveFocus();
  });

  it('is the first focusable element in the page', async () => {
    const user = userEvent.setup();
    
    render(
      <>
        <SkipLinks />
        <button>Other Button</button>
        <a href="/link">Other Link</a>
      </>
    );
    
    // First tab should focus skip link
    await user.tab();
    const skipLink = screen.getByRole('link', { name: /skip to main content/i });
    expect(skipLink).toHaveFocus();
  });
});