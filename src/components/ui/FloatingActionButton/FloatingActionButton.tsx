'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils/classNames';

export interface FloatingActionButtonProps {
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  variant?: 'primary' | 'secondary' | 'amber';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const positionClasses = {
  'bottom-right': 'bottom-6 right-6',
  'bottom-left': 'bottom-6 left-6',
  'top-right': 'top-6 right-6',
  'top-left': 'top-6 left-6',
};

const sizeClasses = {
  sm: 'h-10 w-10',
  md: 'h-12 w-12',
  lg: 'h-14 w-14',
};

const variantClasses = {
  primary: 'bg-blue-500 hover:bg-blue-700 border-blue-500 focus:ring-blue-300',
  secondary: 'bg-gray-700 hover:bg-gray-700 border-gray-500 focus:ring-gray-300',
  amber: 'bg-amber-500 hover:bg-amber-700 border-amber-500 focus:ring-amber-300',
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
}) => {
  return (
    <Button
      onClick={onClick}
      aria-label={label}
      title={label}
      className={cn(
        'fixed z-40',
        'rounded-full shadow-lg',
        'text-white border-2',
        'transition-all duration-200 ease-in-out',
        'hover:scale-105 active:scale-95',
        'flex items-center justify-center',
        'focus:ring-2 focus:ring-opacity-50',
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