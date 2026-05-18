'use client';

import React from 'react';
import { EmptyState } from '@/components/ui/EmptyState/EmptyState';
import { clsx } from 'clsx';

interface JournalEmptyStateProps {
  className?: string;
}

export const JournalEmptyState: React.FC<JournalEmptyStateProps> = ({ className }) => {
  return (
    <div className={clsx('journal-empty-state', className)}>
      <EmptyState
        title="This journal awaits its first entry"
        description="Updates will appear here as things unfold"
        variant="centered"
        
      />
    </div>
  );
};
