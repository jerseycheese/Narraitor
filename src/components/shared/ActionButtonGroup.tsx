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
      case 'primary': return 'bg-primary text-primary-foreground hover:bg-primary/90';
      case 'secondary': return 'bg-secondary text-secondary-foreground hover:bg-secondary/80';
      case 'success': return 'bg-green-500 hover:bg-green-700 text-white'; // Keep success as design system color
      default: return '';
    }
  };

  return (
    <div className={`flex gap-3 ${className}`}>
      {actions.map((action, index) => (
        <Button
          key={`action-${action.label}-${index}`}
          onClick={action.onClick}
          variant={mapVariant(action.variant)}
          size={action.size || 'default'}
          disabled={action.disabled}
          className={`flex items-center gap-2 ${getCustomStyling(action.variant)}`}
        >
          {action.icon}
          {action.label}
        </Button>
      ))}
    </div>
  );
}
