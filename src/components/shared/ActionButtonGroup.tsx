'use client';

import React from 'react';
import { Button } from '@/components/ui/button';

interface ActionButton {
  label: string;
  onClick: () => void;
  variant?: 'default' | 'secondary' | 'outline' | 'ghost' | 'link' | 'destructive' | 'primary' | 'success' | 'danger' | 'danger-outline';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  icon?: React.ReactNode;
  disabled?: boolean;
  dataTutorial?: string;
  flex?: boolean;
}

interface ActionButtonGroupProps {
  actions: ActionButton[];
  className?: string;
  layout?: 'horizontal' | 'vertical';
  gap?: 'sm' | 'md' | 'lg';
}

export function ActionButtonGroup({ 
  actions, 
  className = '',
  layout = 'horizontal',
  gap = 'sm'
}: ActionButtonGroupProps) {
  // Map legacy variants to shadcn/ui variants
  const mapVariant = (variant: string | undefined) => {
    switch (variant) {
      case 'primary': return undefined; // maps to default (accent fill)
      case 'secondary': return 'secondary';
      case 'success': return 'success';
      case 'danger': return 'destructive';
      case 'danger-outline': return 'destructive-outline';
      default: return variant as 'default' | 'secondary' | 'outline' | 'ghost' | 'link' | 'destructive' | undefined;
    }
  };

  return (
    <div 
      className={`action-button-group ${className}`}
      data-layout={layout}
      data-gap={gap}
    >
      {actions.map((action, index) => (
        <Button
          key={index}
          type="button"
          onClick={action.onClick}
          variant={mapVariant(action.variant)}
          size={action.size || 'default'}
          disabled={action.disabled}
          data-tutorial={action.dataTutorial}
          data-flex={action.flex ? 'true' : undefined}
        >
          {action.icon}
          {action.label}
        </Button>
      ))}
    </div>
  );
}