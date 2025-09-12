'use client';

import React, { useState, ReactNode } from 'react';

/**
 * CollapsibleSection props
 */
interface CollapsibleSectionProps {
  /** Section title */
  title: string;
  /** Section content */
  children: ReactNode;
  /** Whether the section is initially expanded (legacy prop) */
  initiallyExpanded?: boolean;
  /** Whether the section is initially collapsed */
  initialCollapsed?: boolean;
  /** Optional additional class names */
  className?: string;
}

/**
 * CollapsibleSection Component
 * 
 * A reusable component for creating collapsible sections with a title
 * and toggle functionality. Used throughout the application for organizing
 * content into expandable/collapsible sections.
 */
export const CollapsibleSection = ({
  title,
  children,
  initiallyExpanded = true,
  initialCollapsed,
  className = ''
}: CollapsibleSectionProps) => {
  // If initialCollapsed is provided, it takes precedence over initiallyExpanded
  const startExpanded = initialCollapsed !== undefined 
    ? !initialCollapsed 
    : initiallyExpanded;
    
  const [isExpanded, setIsExpanded] = useState(startExpanded);

  const toggleExpanded = () => {
    setIsExpanded(prev => !prev);
  };

  return (
    <div 
      data-testid="collapsible-section" 
      className={`component-collapsible-section border border-border rounded-md mb-3 bg-card shadow-sm ${className}`}
      role="region"
      aria-labelledby={`section-title-${title.replace(/\s+/g, '-').toLowerCase()}`}
    >
      <div 
        className="border-b border-border p-3 flex justify-between items-center bg-muted cursor-pointer hover:bg-accent transition-colors"
        onClick={toggleExpanded}
        data-testid="collapsible-section-header"
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            toggleExpanded();
          }
        }}
        aria-expanded={isExpanded}
        aria-controls={`section-content-${title.replace(/\s+/g, '-').toLowerCase()}`}
      >
        <h3 
          id={`section-title-${title.replace(/\s+/g, '-').toLowerCase()}`}
          data-testid="collapsible-section-title"
          className="font-semibold text-sm text-foreground select-none"
        >
          {title}
        </h3>
        <button
          type="button"
          data-testid="collapsible-section-toggle"
          onClick={(e) => {
            e.stopPropagation(); // Prevent double toggle when clicking button
            toggleExpanded();
          }}
          aria-expanded={isExpanded}
          aria-label={isExpanded ? `Collapse ${title}` : `Expand ${title}`}
          className="text-base font-bold ml-2 bg-primary text-primary-foreground px-3 py-1 rounded-md border border-primary hover:bg-primary/90 focus:ring-2 focus:ring-ring focus:outline-none transition-colors"
        >
          {isExpanded ? '−' : '+'}
        </button>
      </div>
      <div 
        id={`section-content-${title.replace(/\s+/g, '-').toLowerCase()}`}
        data-testid="collapsible-section-content"
        className={`p-3 text-muted-foreground ${isExpanded ? 'block' : 'hidden'}`}
        aria-hidden={!isExpanded}
      >
        {children}
      </div>
    </div>
  );
};
