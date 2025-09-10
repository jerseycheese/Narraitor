'use client';

import React from 'react';
import { BookOpen } from 'lucide-react';
import { FloatingActionButton } from '@/components/ui/FloatingActionButton/FloatingActionButton';

interface JournalFloatingButtonProps {
  onClick: () => void;
  className?: string;
}

// Journal book icon
const JournalIcon = (<BookOpen className="h-6 w-6" aria-hidden="true" />);

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
