import React from 'react';

export interface PageLayoutProps {
  /** The main page title */
  title?: string;
  /** Optional description text below the title */
  description?: string;
  /** Optional action buttons to display in the header */
  actions?: React.ReactNode;
  /** The main page content */
  children: React.ReactNode;
  /** Additional CSS classes for the main container */
  className?: string;
}

/**
 * PageLayout - A consistent layout wrapper for application pages
 * 
 * Provides a standardized page structure with title, optional description,
 * action buttons, and responsive content area. Designed to work inside
 * the main layout's <main> element, not replace it.
 * 
 * DESIGN CONSISTENCY:
 * - Fixed max width of 7xl to match navigation width patterns
 * - Responsive padding matches navigation: px-4 sm:px-6 lg:px-8
 * - Renders as div container, not main (to avoid nested main elements)
 * - Width constraint applied at outer level, content flows naturally within
 * 
 * @param props - The page layout configuration
 * @returns A formatted page layout with header and content sections
 * 
 * @example Basic page layout
 * <PageLayout 
 *   title="My Page" 
 *   description="This is my page description"
 * >
 *   <div>Page content goes here</div>
 * </PageLayout>
 * 
 * @example With actions
 * <PageLayout 
 *   title="Worlds" 
 *   description="Manage your game worlds"
 *   actions={
 *     <button>Create World</button>
 *   }
 * >
 *   <WorldList />
 * </PageLayout>
 */
export function PageLayout({ 
  title, 
  description, 
  actions, 
  children, 
  className = '' 
}: PageLayoutProps) {
  // Only render header if there's content for it
  const hasHeaderContent = title || actions || description;

  return (
    <div className="component-page-layout">
      <div className={`${className}`}>
        {hasHeaderContent && (
          <header className="page-layout-header">
            <div className="page-layout-header-top">
              {title && (
                <h1 className="page-layout-title">
                  {title}
                </h1>
              )}
              {actions && (
                <div className="page-layout-actions">
                  {actions}
                </div>
              )}
            </div>
            {description && (
              <p className="page-layout-description">
                {description}
              </p>
            )}
          </header>
        )}

        <section className="page-layout-content">
          {children}
        </section>
      </div>
    </div>
  );
}

