// src/components/shared/TabNavigation/TabNavigation.tsx

import React from 'react';

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
  mobileLayout = 'wrap'
}: TabNavigationProps<T>) {
  const containerClasses = mobileLayout === 'scroll' 
    ? `flex gap-1 sm:gap-2 overflow-x-auto pb-1 ${className}` 
    : `flex flex-wrap gap-1 sm:gap-2 ${className}`;

  return (
    <div className={containerClasses}>
      {options.map((option) => {
        const isActive = option.value === activeValue;
        const isDisabled = disabled || option.disabled;
        
        return (
          <button
            key={String(option.value)}
            type="button"
            onClick={() => !isDisabled && onChange(option.value)}
            disabled={isDisabled}
            className={`
              px-2 py-1.5 sm:px-4 sm:py-2 
              text-sm sm:text-base 
              rounded-md 
              transition-colors 
              whitespace-nowrap
              ${mobileLayout === 'scroll' ? 'flex-shrink-0' : ''}
              ${isActive
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              } 
              ${isDisabled 
                ? 'opacity-50 cursor-not-allowed' 
                : 'cursor-pointer'
              }
            `}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}