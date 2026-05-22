'use client';

import React from 'react';

interface DataFieldProps {
  label: string;
  value: React.ReactNode;
  variant?: 'default' | 'outline' | 'stacked';
  className?: string;
  id?: string;
}

export function DataField({
  label,
  value,
  variant = 'default',
  className = '',
  id
}: DataFieldProps) {
  const fieldId = id || `data-field-${label.toLowerCase().replace(/\s+/g, '-')}`;
  const valueId = `${fieldId}-value`;

  if (variant === 'outline') {
    return (
      <div className={className} id={fieldId}>
        <span aria-describedby={valueId}>
          {label}:
        </span>
        <span id={valueId} role="text">
          {value}
        </span>
      </div>
    );
  }

  if (variant === 'stacked') {
    return (
      <div className={className} id={fieldId}>
        <div aria-describedby={valueId}>
          {label}
        </div>
        <div id={valueId} role="text">
          {value}
        </div>
      </div>
    );
  }

  // Default variant - same as current QuickPlay layout
  return (
    <div className={className} id={fieldId}>
      <span aria-describedby={valueId}>
        {label}:
      </span>
      <p id={valueId} role="text">
        {value}
      </p>
    </div>
  );
}
