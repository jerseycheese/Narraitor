'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils/cn';

export interface AccessButtonProps {
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  variant?: 'default' | 'secondary' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
  disabled?: boolean;
  'aria-label'?: string;
  title?: string;
  showLabelOnMobile?: boolean;
  'data-testid'?: string;
}

/**
 * AccessButton - A standardized button for secondary actions
 * 
 * Combines shadcn/ui Button with consistent icon + label patterns.
 * Designed for actions like "View Journal", "Edit Settings", etc.
 * 
 * Features:
 * - Responsive label visibility (hidden on mobile by default)
 * - Consistent icon + text layout
 * - Full accessibility support
 * - Follows shadcn/ui design patterns
 */
export const AccessButton: React.FC<AccessButtonProps> = ({
  onClick,
  icon,
  label,
  variant = 'default',
  size = 'lg',
  className,
  disabled = false,
  'aria-label': ariaLabel,
  title,
  showLabelOnMobile = false,
  'data-testid': dataTestId
}) => {
  return (
    <Button
      onClick={onClick}
      variant={variant}
      size={size}
      disabled={disabled}
      aria-label={ariaLabel || label}
      title={title || label}
      data-testid={dataTestId}
      className={cn(
        'flex items-center gap-2',
        className
      )}
    >
      {icon}
      <span className={cn(
        showLabelOnMobile ? 'inline' : 'hidden sm:inline'
      )}>
        {label}
      </span>
    </Button>
  );
};