'use client';

import React from 'react';
import { cn } from '@/lib/utils/classNames';

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
 * - **Dark Theme**: `bg-gray-700` background with `border-gray-700` borders
 * - **Consistent Spacing**: Standard `p-2` padding and `rounded` corners
 * - **Optional Title**: Styled `h4` title with proper typography hierarchy
 * - **Flexible Content**: Accepts any React nodes as children
 * - **Extensible**: Additional classes can be merged via className prop
 * 
 * ## Usage Patterns
 * This component replaces the repeated pattern:
 * ```tsx
 * <div className="bg-gray-700 p-2 rounded border border-gray-700">
 *   <h4 className="text-xs font-medium mb-2 text-gray-200">Title</h4>
 *   {content}
 * </div>
 * ```
 * 
 * @example
 * ```tsx
 * // Basic usage with title
 * <DevToolsSection title="Lore Statistics">
 *   <div>Statistics content here</div>
 * </DevToolsSection>
 * 
 * // Without title
 * <DevToolsSection>
 *   <select>World selection dropdown</select>
 * </DevToolsSection>
 * 
 * // With additional styling
 * <DevToolsSection title="Debug Info" className="mb-4 text-xs">
 *   <div>Debug information</div>
 * </DevToolsSection>
 * ```
 * 
 * @since 1.0.0 - Created during Issue #184 code review for reusability
 */
export const DevToolsSection: React.FC<DevToolsSectionProps> = ({
  title,
  children,
  className = ''
}) => {
  return (
    <div className={cn(
      'bg-gray-700 p-2 rounded border border-gray-700',
      className
    )}>
      {title && (
        <h4 className="text-xs font-medium mb-2 text-gray-50">
          {title}
        </h4>
      )}
      {children}
    </div>
  );
};