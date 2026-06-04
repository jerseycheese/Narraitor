'use client';

import React from 'react';
import { clsx } from 'clsx';
import './DevToolsSection.css';

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
 * A standardized, token-styled container for DevTools panels: a bordered card
 * with an optional uppercase title and a stacked body. Encapsulates the common
 * section pattern so individual tools don't re-declare layout. Co-located
 * styles live in DevToolsSection.css.
 *
 * @example
 * // With title
 * <DevToolsSection title="Lore Statistics">
 *   <div>Statistics content here</div>
 * </DevToolsSection>
 *
 * // Without title
 * <DevToolsSection>
 *   <select>World selection dropdown</select>
 * </DevToolsSection>
 *
 * @since 1.0.0 - Created during Issue #184 code review for reusability
 */
export const DevToolsSection: React.FC<DevToolsSectionProps> = ({
  title,
  children,
  className = ''
}) => {
  return (
    <div className={clsx('devtools-section', className)}>
      {title && <h4 className="devtools-section-title">{title}</h4>}
      <div className="devtools-section-body">{children}</div>
    </div>
  );
};
