'use client';

import React from 'react';
import { Button } from '@/components/ui/button';

export interface ActionButton {
  label: string;
  onClick: () => void;
  variant?: 'default' | 'secondary' | 'outline' | 'ghost' | 'link' | 'destructive' | 'primary' | 'success' | 'danger';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  icon?: React.ReactNode;
  disabled?: boolean;
  dataTutorial?: string;
}

interface ActionButtonGroupProps {
  actions: ActionButton[];
  className?: string;
}

export function ActionButtonGroup({ actions, className = '' }: ActionButtonGroupProps) {
  // Map legacy variants to shadcn/ui variants
  const mapVariant = (variant: string | undefined) => {
    switch (variant) {
      case 'primary': return undefined; // Use custom styling instead
      case 'secondary': return undefined; // Use custom styling instead  
      case 'success': return undefined; // Use custom styling instead
      case 'danger': return 'destructive';
      default: return variant as 'default' | 'secondary' | 'outline' | 'ghost' | 'link' | 'destructive' | undefined;
    }
  };

  // Get custom styling for legacy variants using semantic tokens
  // Now aligned with our design token system via CSS variables
  const getCustomStyling = (variant: string | undefined) => {
    switch (variant) {
      case 'primary': return '';
      case 'secondary': return '';
      case 'success': return ''; // Keep success as design system color
      default: return '';
    }
  };

  return (
    <div className={`${className}`}>
      {actions.map((action, index) => (
        <Button
          key={`action-${action.label}-${index}`}
          onClick={action.onClick}
          variant={mapVariant(action.variant)}
          size={action.size || 'default'}
          disabled={action.disabled}
          className={`${getCustomStyling(action.variant)}`}
          data-tutorial={action.dataTutorial}
        >
          {action.icon}
          {action.label}
        </Button>
      ))}
    </div>
  );
}