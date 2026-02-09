'use client';

import React, { useEffect, useState, ReactNode } from 'react';

/**
 * CollapsibleSection props
 */
interface CollapsibleSectionProps {
  /** Section title */
  title: string;
  /** Section content */
  children: ReactNode;
  /** Whether the section is initially collapsed */
  initialCollapsed?: boolean;
  /** Optional additional class names */
  className?: string;
  /** Optional callback when expanded state changes */
  onToggle?: (isExpanded: boolean) => void;
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
  initialCollapsed,
  className = '',
  onToggle,
}: CollapsibleSectionProps) => {
  const [isExpanded, setIsExpanded] = useState(!initialCollapsed);

  useEffect(() => {
    onToggle?.(isExpanded);
  }, [isExpanded, onToggle]);

  const toggleExpanded = () => {
    setIsExpanded(prev => !prev);
  };

  return (
    <div 
      data-testid="collapsible-section" 
      className={['component-collapsible-section', className].filter(Boolean).join(' ')}
      role="region"
      aria-labelledby={`section-title-${title.replace(/\s+/g, '-').toLowerCase()}`}
    >
      <div 
        
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
          
        >
          {isExpanded ? '−' : '+'}
        </button>
      </div>
      <div
        id={`section-content-${title.replace(/\s+/g, '-').toLowerCase()}`}
        data-testid="collapsible-section-content"
        aria-hidden={!isExpanded}
      >
        {children}
      </div>
    </div>
  );
};
