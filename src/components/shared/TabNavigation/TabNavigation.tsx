// src/components/shared/TabNavigation/TabNavigation.tsx

import React from 'react';
import { Button } from '@/components/ui/button';

export interface TabOption<T = string> {
  value: T;
  label: string;
  disabled?: boolean;
}

interface TabNavigationProps<T = string> {
  options: TabOption<T>[];
  activeValue: T;
  onChange: (value: T) => void;
  className?: string;
  disabled?: boolean;
  size?: 'sm' | 'md';
  /** 
   * Mobile behavior: 'wrap' allows tabs to wrap to multiple lines, 
   * 'scroll' enables horizontal scrolling 
   */
  mobileLayout?: 'wrap' | 'scroll';
}

export function TabNavigation<T = string>({ 
  options, 
  activeValue, 
  onChange, 
  className = '', 
  disabled = false,
  size = 'md',
  mobileLayout = 'wrap'
}: TabNavigationProps<T>) {
  const containerClasses = mobileLayout === 'scroll' 
    ? `component-tab-navigation flex gap-2 overflow-x-auto border-b border-border ${className}` 
    : `component-tab-navigation flex flex-wrap gap-2 border-b border-border ${className}`;

  return (
    <div className={containerClasses} role="tablist">
      {options.map((option) => {
        const isActive = option.value === activeValue;
        const isDisabled = disabled || option.disabled;
        
        return (
          <Button
            key={String(option.value)}
            type="button"
            onClick={() => !isDisabled && onChange(option.value)}
            disabled={isDisabled}
            role="tab"
            aria-selected={isActive}
            variant="ghost"
            size="sm"
            className={[
              size === 'sm' ? 'px-1.5 py-1.5 sm:px-2' : 'px-1 py-2 sm:px-3',
              size === 'sm' ? 'text-xs sm:text-sm' : 'text-sm sm:text-base',
              'rounded-none',
              'transition-colors',
              'whitespace-nowrap',
              'focus-visible:ring-offset-0',
              'border-b-2',
              '-mb-px',
              'bg-transparent',
              mobileLayout === 'scroll' ? 'flex-shrink-0' : '',
              isActive
                ? 'border-primary text-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground',
              isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer',
            ].join(' ')}
          >
            {option.label}
          </Button>
        );
      })}
    </div>
  );
}
