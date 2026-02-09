'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { cssClasses } from '@/lib/utils/classNames';

export interface FloatingActionButtonProps {
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  position?: '' | '' | '' | '';
  variant?: 'primary' | 'secondary' | 'amber';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  dataTutorialId?: string;
}

const positionClasses = {
  '': '',
  '': '',
  '': '',
  '': '',
};

const sizeClasses = {
  sm: '',
  md: '',
  lg: '',
};

const variantClasses = {
  primary: '',
  secondary: '',
  amber: '',
};

/**
 * Reusable floating action button component
 * Provides consistent positioning and styling for floating actions
 */
export const FloatingActionButton: React.FC<FloatingActionButtonProps> = ({
  onClick,
  icon,
  label,
  position = '',
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
        '',
        '',
        '',
        '',
        '',
        '',
        '',
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
