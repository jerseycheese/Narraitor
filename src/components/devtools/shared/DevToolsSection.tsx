'use client';

import React from 'react';
import { clsx } from 'clsx';

/**
 * Props for the DevToolsSection component
 */
interface DevToolsSectionProps {
  /** Optional title to display at the top of the section */
  title?: string;
  /** Content to render inside the section */
  children: React.ReactNode;
  /** Additional CSS classes to apply */
  className?: string;
}

/**
 * Reusable DevTools Section Component
 * 
 * A standardized container component for DevTools panels that provides consistent
 * dark theme styling and layout. This component eliminates code duplication across
 * DevTools sections by encapsulating the common UI pattern used throughout the interface.
 * 
 * ## Design Features
 * - **Dark Theme**: `` background with `` borders
 * - **Consistent Spacing**: Standard `` padding and `` corners
 * - **Optional Title**: Styled `h4` title with proper typography hierarchy
 * - **Flexible Content**: Accepts any React nodes as children
 * - **Extensible**: Additional classes can be merged via className prop
 * 
 * ## Usage Patterns
 * This component replaces the repeated pattern:
 * ```tsx * <div className="devtools-example"> * <h4 className="devtools-title">Title</h4> * {content} * </div> *```
 * 
 * @example
 * ```tsx * // Basic usage with title * <DevToolsSection title="Lore Statistics"> * <div>Statistics content here</div> * </DevToolsSection> * * // Without title * <DevToolsSection> * <select>World selection dropdown</select> * </DevToolsSection> * * // With additional styling * <DevToolsSection title="Debug Info" className="devtools-debug"> * <div>Debug information</div> * </DevToolsSection> *```
 * 
 * @since 1.0.0 - Created during Issue #184 code review for reusability
 */
export const DevToolsSection: React.FC<DevToolsSectionProps> = ({
  title,
  children,
  className = ''
}) => {
  return (
    <div className={clsx(
      '',
      className
    )}>
      {title && (
        <h4>
          {title}
        </h4>
      )}
      <div>
        {children}
      </div>
    </div>
  );
};