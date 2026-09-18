import React from 'react';

export interface PageLayoutProps {
  /** The main page title */
  title?: string;
  /** Optional kicker or eyebrow above title (e.g. folio context) */
  kicker?: React.ReactNode;
  /** Optional description text below the title */
  description?: React.ReactNode;
  /** Optional action buttons to display in the header */
  actions?: React.ReactNode;
  /** Optional background art or vignette inside the header */
  headerBackground?: React.ReactNode;
  /** Additional CSS classes for the header container */
  headerClassName?: string;
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
  kicker,
  description, 
  actions, 
  headerBackground,
  headerClassName = '',
  children, 
  className = '' 
}: PageLayoutProps) {
  // Only render header if there's content for it
  const hasHeaderContent = title || actions || description || kicker || headerBackground;
  const headerClasses = ['page-layout-header', headerClassName].filter(Boolean).join(' ');

  return (
    <div className="component-page-layout">
      <div className={`${className}`}>
        {hasHeaderContent && (
          <header className={headerClasses}>
            {headerBackground}
            <div className="page-layout-header-content">
              {kicker && (
                <div className="page-layout-kicker">
                  {kicker}
                </div>
              )}
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
            </div>
          </header>
        )}

        <section className="page-layout-content">
          {children}
        </section>
      </div>
    </div>
  );
}

