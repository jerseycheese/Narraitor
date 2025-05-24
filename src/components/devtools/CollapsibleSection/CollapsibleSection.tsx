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
  /** Any additional props */
  [key: string]: unknown;
}

/**
 * CollapsibleSection Component
 * 
 * A reusable component for creating collapsible sections with a title
 * and toggle functionality. Used throughout the DevTools panel.
 */
export const CollapsibleSection = ({
  title,
  children,
  initiallyExpanded = true,
  initialCollapsed,
  className = '',
  ...rest
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
      className={`border rounded mb-2 card ${className}`}
      {...rest}
    >
      <div className="border-b p-2 flex justify-between items-center" 
        style={{ backgroundColor: 'var(--color-background)', borderColor: 'var(--color-border)' }}>
        <h3 
          data-testid="collapsible-section-title"
          className="font-medium text-sm text-gray-700 dark:text-slate-200"
        >
          {title}
        </h3>
        <button
          data-testid="collapsible-section-toggle"
          onClick={toggleExpanded}
          aria-expanded={isExpanded}
          className="focus-visible text-base font-bold ml-2 bg-gray-200 dark:bg-slate-600 text-gray-700 dark:text-slate-200 px-2 py-1 rounded border border-gray-300 dark:border-slate-500 cursor-pointer hover:bg-gray-300 dark:hover:bg-slate-500 transition-colors"
        >
          {isExpanded ? '−' : '+'}
        </button>
      </div>
      <div 
        data-testid="collapsible-section-content"
        className={`p-2 ${isExpanded ? 'block' : 'hidden'}`}
      >
        {children}
      </div>
    </div>
  );
};