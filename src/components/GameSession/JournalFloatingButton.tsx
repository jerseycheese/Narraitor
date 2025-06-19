'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils/classNames';

interface JournalFloatingButtonProps {
  onClick: () => void;
  hasUnreadEntries?: boolean;
  className?: string;
}

/**
 * Floating action button for quick journal access
 * Provides easy access to journal during gameplay with visual indicators for unread entries
 */
export const JournalFloatingButton: React.FC<JournalFloatingButtonProps> = ({
  onClick,
  hasUnreadEntries = false,
  className,
}) => {
  return (
    <Button
      onClick={onClick}
      aria-label="Open journal"
      title="Open journal (J)"
      className={cn(
        'fixed bottom-6 right-6 z-40',
        'h-14 w-14 rounded-full shadow-lg',
        'bg-amber-600 hover:bg-amber-700',
        'text-white border-2 border-amber-500',
        'transition-all duration-200 ease-in-out',
        'hover:scale-105 active:scale-95',
        'flex items-center justify-center',
        'focus:ring-2 focus:ring-amber-300 focus:ring-opacity-50',
        hasUnreadEntries && 'animate-pulse',
        className
      )}
    >
      <div className="relative">
        {/* Journal book icon */}
        <svg
          className="h-6 w-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C20.168 18.477 18.582 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
          />
        </svg>
        
        {/* Unread indicator */}
        {hasUnreadEntries && (
          <div className="absolute -top-1 -right-1">
            <div className="h-3 w-3 bg-red-500 rounded-full flex items-center justify-center">
              <span className="text-xs text-white font-bold leading-none">•</span>
            </div>
          </div>
        )}
      </div>
    </Button>
  );
};