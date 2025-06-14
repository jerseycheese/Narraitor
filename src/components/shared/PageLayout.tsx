import React from 'react';

export interface PageLayoutProps {
  /** The main page title */
  title: string;
  /** Optional description text below the title */
  description?: string;
  /** Optional action buttons to display in the header */
  actions?: React.ReactNode;
  /** The main page content */
  children: React.ReactNode;
  /** Maximum width constraint for the page content */
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '4xl' | '6xl' | '7xl';
  /** Additional CSS classes for the main container */
  className?: string;
}

/**
 * PageLayout - A consistent layout wrapper for application pages
 * 
 * Provides a standardized page structure with title, optional description,
 * action buttons, and responsive content area with configurable max width.
 * 
 * DESIGN CONSISTENCY:
 * - All pages using PageLayout automatically get consistent background color
 * - Background color is defined globally in globals.css for `main:not(.ending-screen)`
 * - Default max width is 7xl to match navigation width patterns
 * - Responsive padding matches navigation: px-4 sm:px-6 lg:px-8
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
 * @example With actions and custom width
 * <PageLayout 
 *   title="Worlds" 
 *   description="Manage your game worlds"
 *   maxWidth="6xl"
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
  maxWidth = '7xl',
  className = '' 
}: PageLayoutProps) {
  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md', 
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '4xl': 'max-w-4xl',
    '6xl': 'max-w-6xl',
    '7xl': 'max-w-7xl'
  };

  // Merge custom className with default page styling
  // Note: The main background color is set in globals.css via `main:not(.ending-screen)`
  const mainClasses = `min-h-screen ${className}`;

  return (
    <main className={mainClasses}>
      <div className={`${maxWidthClasses[maxWidth]} mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8`}>
        <header className="mb-8">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-4">
            <h1 className="text-4xl font-bold">
              {title}
            </h1>
            {actions && (
              <div className="flex gap-2">
                {actions}
              </div>
            )}
          </div>
          {description && (
            <p className="opacity-90">
              {description}
            </p>
          )}
        </header>

        <section>
          {children}
        </section>
      </div>
    </main>
  );
}

export default PageLayout;
