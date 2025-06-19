'use client';

import React from 'react';

export interface ActionButton {
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'success' | 'danger';
  icon?: React.ReactNode;
}

interface ActionButtonGroupProps {
  actions: ActionButton[];
  className?: string;
}

export function ActionButtonGroup({ actions, className = '' }: ActionButtonGroupProps) {
  const variantClasses = {
    primary: 'bg-blue-600 hover:bg-blue-700',
    success: 'bg-green-600 hover:bg-green-700',
    danger: 'bg-red-600 hover:bg-red-700'
  };

  return (
    <div className={`flex gap-3 ${className}`}>
      {actions.map((action, index) => (
        <button
          key={index}
          onClick={action.onClick}
          className={`px-4 py-3 text-white rounded-md font-medium transition-colors ${
            variantClasses[action.variant || 'primary']
          }`}
        >
          {action.icon && <span className="mr-2">{action.icon}</span>}
          {action.label}
        </button>
      ))}
    </div>
  );
}
