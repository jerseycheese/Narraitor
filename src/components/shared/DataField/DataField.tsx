'use client';

import React from 'react';

interface DataFieldProps {
  label: string;
  value: React.ReactNode;
  variant?: 'default' | '' | 'stacked';
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
    ? ''
    : '';

  const valueClasses = size === 'sm'
    ? ''
    : '';

  const fieldId = id || `data-field-${label.toLowerCase().replace(/\s+/g, '-')}`;
  const valueId = `${fieldId}-value`;

  if (variant === '') {
    return (
      <div className={`${className}`} id={fieldId}>
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
        <div className={`${valueClasses}`} id={valueId} role="text">
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
      <p className={`${valueClasses}`} id={valueId} role="text">
        {value}
      </p>
    </div>
  );
}
