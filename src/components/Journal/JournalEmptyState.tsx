'use client';

import React from 'react';
import { EmptyState } from '@/components/ui/EmptyState/EmptyState';
import { cssClasses } from '@/lib/utils';

interface JournalEmptyStateProps {
  className?: string;
}

export const JournalEmptyState: React.FC<JournalEmptyStateProps> = ({ className }) => {
  return (
    <div className={cssClasses('journal-empty-state', className)}>
      <EmptyState
        title="This journal awaits its first entry"
        description="Updates will appear here as things unfold"
        variant="centered"
        
      />
    </div>
  );
};
