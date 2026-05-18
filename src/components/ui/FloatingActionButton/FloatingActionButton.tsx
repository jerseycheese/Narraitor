'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { clsx } from 'clsx';

export interface FloatingActionButtonProps {
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  className?: string;
  dataTutorialId?: string;
}

/**
 * Reusable floating action button component
 * Provides consistent positioning and styling for floating actions
 */
export const FloatingActionButton: React.FC<FloatingActionButtonProps> = ({
  onClick,
  icon,
  label,
  className,
  dataTutorialId,
}) => {
  return (
    <Button
      onClick={onClick}
      aria-label={label}
      title={label}
      data-tutorial={dataTutorialId}
      className={clsx(
        'component-floating-action-button',
        className
      )}
    >
      {icon}
    </Button>
  );
};