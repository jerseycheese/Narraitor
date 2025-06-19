'use client';

import React from 'react';
import { FloatingActionButton } from '@/components/ui/FloatingActionButton/FloatingActionButton';

interface JournalFloatingButtonProps {
  onClick: () => void;
  className?: string;
}

// Journal book icon
const JournalIcon = (
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
);

/**
 * Floating action button for quick journal access
 * Uses the reusable FloatingActionButton component with journal-specific configuration
 */
export const JournalFloatingButton: React.FC<JournalFloatingButtonProps> = ({
  onClick,
  className,
}) => {
  return (
    <FloatingActionButton
      onClick={onClick}
      icon={JournalIcon}
      label="Open journal (J)"
      variant="amber"
      position="bottom-right"
      size="lg"
      className={className}
    />
  );
};