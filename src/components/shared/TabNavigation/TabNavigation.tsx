// src/components/shared/TabNavigation/TabNavigation.tsx

import React from 'react';
import { Button } from '@/components/ui/button';
import './TabNavigation.css';

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
  const containerClasses = [
    'component-tab-navigation',
    mobileLayout === 'scroll' ? 'component-tab-navigation-scroll' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

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
          >
            {option.label}
          </Button>
        );
      })}
    </div>
  );
}
