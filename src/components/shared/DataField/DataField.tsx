'use client';

import React from 'react';

interface DataFieldProps {
  label: string;
  value: React.ReactNode;
  variant?: 'default' | 'inline' | 'stacked';
  size?: 'sm' | 'md';
  className?: string;
  id?: string;
}

export function DataField({
  label,
  value,
  variant = 'default',
  size = 'sm',
  className = '',
  id
}: DataFieldProps) {
  const labelClasses = size === 'sm'
    ? 'text-xs text-muted-foreground font-bold uppercase tracking-wide'
    : 'text-sm text-muted-foreground font-bold uppercase tracking-wide';

  const valueClasses = size === 'sm'
    ? 'text-sm font-medium'
    : 'text-base font-medium';

  const fieldId = id || `data-field-${label.toLowerCase().replace(/\s+/g, '-')}`;
  const valueId = `${fieldId}-value`;

  if (variant === 'inline') {
    return (
      <div className={`flex items-center gap-2 ${className}`} id={fieldId}>
        <span className={labelClasses} aria-describedby={valueId}>
          {label}:
        </span>
        <span className={valueClasses} id={valueId} role="text">
          {value}
        </span>
      </div>
    );
  }

  if (variant === 'stacked') {
    return (
      <div className={className} id={fieldId}>
        <div className={labelClasses} aria-describedby={valueId}>
          {label}
        </div>
        <div className={`${valueClasses} font-medium`} id={valueId} role="text">
          {value}
        </div>
      </div>
    );
  }

  // Default variant - same as current QuickPlay layout
  return (
    <div className={className} id={fieldId}>
      <span className={labelClasses} aria-describedby={valueId}>
        {label}:
      </span>
      <p className={`${valueClasses} font-medium mt-1`} id={valueId} role="text">
        {value}
      </p>
    </div>
  );
}
