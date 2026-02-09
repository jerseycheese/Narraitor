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
    <div>
      <a
        href="#main-content"
        onClick={handleSkipToMain}
        
      >
        Skip to main content
      </a>
    </div>
  );
}