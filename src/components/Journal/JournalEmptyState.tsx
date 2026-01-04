'use client';

import React from 'react';
import { EmptyState } from '@/components/ui/EmptyState/EmptyState';
import { cn } from '@/lib/utils';

interface JournalEmptyStateProps {
  className?: string;
}

export const JournalEmptyState: React.FC<JournalEmptyStateProps> = ({ className }) => {
  return (
    <div className={cn('journal-empty-state flex-1 p-6', className)}>
      <EmptyState
        title="This journal awaits its first entry"
        description="Updates will appear here as things unfold"
        variant="centered"
        className="text-amber-700"
      />
    </div>
  );
};
