'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { cssClasses } from '@/lib/utils/classNames';

export interface FloatingActionButtonProps {
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  variant?: 'primary' | 'secondary' | 'amber';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  dataTutorialId?: string;
}

const positionClasses = {
  'top-left': 'fab-top-left',
  'top-right': 'fab-top-right',
  'bottom-left': 'fab-bottom-left',
  'bottom-right': 'fab-bottom-right',
};

const sizeClasses = {
  sm: 'fab-sm',
  md: 'fab-md',
  lg: 'fab-lg',
};

const variantClasses = {
  primary: 'fab-primary',
  secondary: 'fab-secondary',
  amber: 'fab-amber',
};

/**
 * Reusable floating action button component
 * Provides consistent positioning and styling for floating actions
 */
export const FloatingActionButton: React.FC<FloatingActionButtonProps> = ({
  onClick,
  icon,
  label,
  position = 'bottom-right',
  variant = 'primary',
  size = 'lg',
  className,
  dataTutorialId,
}) => {
  return (
    <Button
      onClick={onClick}
      aria-label={label}
      title={label}
      data-tutorial={dataTutorialId}
      className={cssClasses(
        'component-floating-action-button',
        positionClasses[position],
        sizeClasses[size],
        variantClasses[variant],
        className
      )}
    >
      {icon}
    </Button>
  );
};