/**
 * Button component following project styling patterns
 * Provides consistent button styling across the application
 */

import React from 'react';
import { cn } from '../../lib/utils/classNames';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'outline' | 'destructive' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  children: React.ReactNode;
}

const buttonVariants = {
  default: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
  outline: 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 focus:ring-blue-500',
  destructive: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
  ghost: 'text-gray-700 hover:bg-gray-100 focus:ring-blue-500',
};

const buttonSizes = {
  default: 'px-4 py-2 text-sm',
  sm: 'px-3 py-1.5 text-xs',
  lg: 'px-6 py-3 text-base',
  icon: 'p-2',
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(({ 
  variant = 'default', 
  size = 'default', 
  className = '', 
  children, 
  disabled,
  ...props 
}, ref) => {
  return (
    <button
      ref={ref}
      className={cn(
        'inline-flex items-center justify-center rounded-md font-medium transition-colors',
        'focus:outline-none focus:ring-2 focus:ring-offset-2',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        buttonVariants[variant],
        buttonSizes[size],
        className
      )}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
});

Button.displayName = 'Button';