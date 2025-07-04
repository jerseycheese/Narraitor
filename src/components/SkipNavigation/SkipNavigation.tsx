'use client';

import React from 'react';

export interface SkipNavigationProps {
  links?: Array<{
    href: string;
    label: string;
  }>;
  className?: string;
}

/**
 * SkipNavigation - Provides skip links for screen readers and keyboard users
 * 
 * Renders invisible skip links that become visible when focused, allowing
 * keyboard and screen reader users to quickly jump to main content areas.
 * 
 * Features:
 * - Hidden by default, visible on focus
 * - Supports custom skip targets
 * - Proper ARIA labeling
 * - High contrast focus indicators
 * - Smooth scrolling to targets
 * 
 * @param links - Array of skip link targets (optional, uses defaults if not provided)
 * @param className - Additional CSS classes
 */
export function SkipNavigation({ links, className = '' }: SkipNavigationProps) {
  // Default skip links if none provided
  const defaultLinks = [
    { href: '#main-content', label: 'Skip to main content' },
    { href: '#navigation', label: 'Skip to navigation' },
    { href: '#footer', label: 'Skip to footer' }
  ];

  const skipLinks = links || defaultLinks;

  const handleSkipClick = (event: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    event.preventDefault();
    
    // Remove the # from href to get the element ID
    const targetId = href.replace('#', '');
    const targetElement = document.getElementById(targetId);
    
    if (targetElement) {
      // Scroll to the target element
      targetElement.scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
      });
      
      // Set focus to the target element
      // Make it focusable temporarily if it's not normally focusable
      const originalTabIndex = targetElement.tabIndex;
      if (originalTabIndex < 0) {
        targetElement.tabIndex = -1;
      }
      
      targetElement.focus();
      
      // Restore original tabIndex after a short delay
      if (originalTabIndex < 0) {
        setTimeout(() => {
          targetElement.tabIndex = originalTabIndex;
        }, 100);
      }

      // Announce the skip action to screen readers
      const announcement = `Skipped to ${targetElement.getAttribute('aria-label') || targetElement.textContent || targetId}`;
      announceToScreenReader(announcement);
    }
  };

  // Helper function to announce to screen readers
  const announceToScreenReader = (message: string) => {
    const announcer = document.createElement('div');
    announcer.setAttribute('aria-live', 'polite');
    announcer.setAttribute('aria-atomic', 'true');
    announcer.className = 'sr-only';
    announcer.textContent = message;
    
    document.body.appendChild(announcer);
    
    // Remove after announcement
    setTimeout(() => {
      if (document.body.contains(announcer)) {
        document.body.removeChild(announcer);
      }
    }, 1000);
  };

  return (
    <nav 
      aria-label="Skip navigation links"
      className={`skip-navigation ${className}`}
    >
      <ul className="sr-only focus-within:not-sr-only focus-within:fixed focus-within:top-0 focus-within:left-0 focus-within:z-[9999] focus-within:bg-white focus-within:border focus-within:border-gray-300 focus-within:shadow-lg focus-within:p-2 focus-within:rounded-br-md">
        {skipLinks.map((link, index) => (
          <li key={link.href} className={index > 0 ? 'mt-1' : ''}>
            <a
              href={link.href}
              onClick={(e) => handleSkipClick(e, link.href)}
              className="
                block px-3 py-2 text-sm font-medium text-blue-600 
                bg-white border border-blue-600 rounded
                hover:bg-blue-50 hover:text-blue-800
                focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                transition-colors duration-150 ease-in-out
                underline decoration-blue-600 decoration-2 underline-offset-2
              "
              onFocus={(e) => {
                // Ensure the skip link is visible when focused
                e.currentTarget.scrollIntoView({ block: 'nearest' });
              }}
            >
              {link.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}

/**
 * Hook to ensure skip navigation targets exist and are properly labeled
 */
export function useSkipNavigationTargets() {
  React.useEffect(() => {
    // Ensure main content area has proper ID and labeling
    const mainContent = document.querySelector('main') || document.querySelector('[role="main"]');
    if (mainContent && !mainContent.id) {
      mainContent.id = 'main-content';
    }
    if (mainContent && !mainContent.getAttribute('aria-label')) {
      mainContent.setAttribute('aria-label', 'Main content');
    }

    // Ensure navigation has proper ID and labeling
    const navigation = document.querySelector('nav[role="banner"]') || document.querySelector('header nav');
    if (navigation && !navigation.id) {
      navigation.id = 'navigation';
    }
    if (navigation && !navigation.getAttribute('aria-label')) {
      navigation.setAttribute('aria-label', 'Main navigation');
    }

    // Ensure footer has proper ID and labeling
    const footer = document.querySelector('footer');
    if (footer && !footer.id) {
      footer.id = 'footer';
    }
    if (footer && !footer.getAttribute('aria-label')) {
      footer.setAttribute('aria-label', 'Footer');
    }
  }, []);
}