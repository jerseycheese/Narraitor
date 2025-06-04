import React from 'react';

interface PageLayoutProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '4xl' | '6xl' | '7xl';
  className?: string;
}

export function PageLayout({ 
  title, 
  description, 
  actions, 
  children, 
  maxWidth = '4xl',
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

  return (
    <main className={`min-h-screen p-4 sm:p-8 ${className}`}>
      <div className={`${maxWidthClasses[maxWidth]} mx-auto`}>
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
            <p className="text-gray-600">
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