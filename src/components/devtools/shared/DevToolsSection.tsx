'use client';

import React from 'react';
import { cn } from '@/lib/utils/classNames';

interface DevToolsSectionProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
}

/**
 * Reusable DevTools Section Component
 * 
 * Provides consistent styling for DevTools panels with:
 * - Dark theme background and borders
 * - Optional title with proper typography
 * - Consistent padding and spacing
 * - Customizable additional classes
 */
export const DevToolsSection: React.FC<DevToolsSectionProps> = ({
  title,
  children,
  className = ''
}) => {
  return (
    <div className={cn(
      'bg-slate-700 p-2 rounded border border-slate-600',
      className
    )}>
      {title && (
        <h4 className="text-xs font-medium mb-2 text-slate-200">
          {title}
        </h4>
      )}
      {children}
    </div>
  );
};