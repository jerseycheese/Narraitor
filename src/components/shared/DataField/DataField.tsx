'use client';

import React from 'react';

interface DataFieldProps {
  label: string;
  value: React.ReactNode;
  variant?: 'default' | 'inline' | 'stacked';
  size?: 'sm' | 'md';
  className?: string;
}

export function DataField({ 
  label, 
  value, 
  variant = 'default', 
  size = 'sm',
  className = '' 
}: DataFieldProps) {
  const labelClasses = size === 'sm' 
    ? 'text-xs text-gray-400 font-bold uppercase tracking-wide'
    : 'text-sm text-gray-500 font-bold uppercase tracking-wide';
    
  const valueClasses = size === 'sm'
    ? 'text-sm text-gray-900 font-medium'
    : 'text-base text-gray-900 font-medium';

  if (variant === 'inline') {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <span className={labelClasses}>{label}:</span>
        <span className={valueClasses}>{value}</span>
      </div>
    );
  }

  if (variant === 'stacked') {
    return (
      <div className={className}>
        <div className={labelClasses}>{label}</div>
        <div className={`${valueClasses} font-medium`}>{value}</div>
      </div>
    );
  }

  // Default variant - same as current QuickPlay layout
  return (
    <div className={className}>
      <span className={labelClasses}>{label}:</span>
      <p className={`${valueClasses} font-medium mt-1`}>{value}</p>
    </div>
  );
}
