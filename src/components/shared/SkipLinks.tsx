'use client';

import React from 'react';

/**
 * SkipLinks - Accessibility navigation component
 * 
 * Provides skip navigation links for screen readers and keyboard users
 * to quickly jump to main content areas. Links are visually hidden by
 * default but become visible when focused.
 * 
 * WCAG 2.1 AA Compliance:
 * - Provides bypass mechanism for repeated navigation
 * - Visible focus indicators when activated
 * - Proper semantic structure for screen readers
 */
export function SkipLinks() {
  const handleSkipToMain = (event: React.MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    
    const mainContent = document.getElementById('main-content');
    if (mainContent) {
      mainContent.focus();
      // Check if scrollIntoView exists (not available in test environment)
      if (typeof mainContent.scrollIntoView === 'function') {
        mainContent.scrollIntoView();
      }
    }
  };

  return (
    <div className="sr-only focus-within:not-sr-only">
      <a
        href="#main-content"
        onClick={handleSkipToMain}
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-blue-600 focus:text-white focus:rounded-md focus:shadow-lg focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none"
      >
        Skip to main content
      </a>
    </div>
  );
}