import React from 'react';

export type EntityType = 'world' | 'character' | 'item' | 'location' | 'custom';
export type BadgeVariant = 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'info';

export interface EntityBadgeProps {
  /** The type of entity */
  type?: EntityType;
  /** The text to display in the badge */
  text: string;
  /** Optional icon to display before the text */
  icon?: React.ReactNode | string;
  /** Badge color variant */
  variant?: BadgeVariant;
  /** Custom CSS classes */
  className?: string;
  /** Size of the badge */
  size?: 'sm' | 'md' | 'lg';
  /** Test ID for testing */
  testId?: string;
}

/**
 * EntityBadge - Displays entity type badges with consistent styling
 * 
 * A flexible badge component for displaying entity types, statuses, or
 * other categorical information. Supports different sizes, color variants,
 * and custom or automatic icons based on entity type.
 * 
 * @param props - Badge configuration including text, type, styling options
 * @returns A styled badge with optional icon and customizable appearance
 * 
 * @example World type badge with automatic icon
 * <EntityBadge 
 *   type="world" 
 *   text="Set in Middle Earth" 
 *   variant="info"
 * />
 * 
 * @example Custom badge with custom icon
 * <EntityBadge 
 *   text="Known Figure" 
 *   icon="⭐"
 *   variant="warning"
 *   size="md"
 * />
 * 
 * @example Simple text badge
 * <EntityBadge 
 *   text="Active"
 *   variant="success"
 *   size="sm"
 * />
 */
export const EntityBadge: React.FC<EntityBadgeProps> = ({
  type,
  text,
  icon,
  variant = 'primary',
  className = '',
  size = 'sm',
  testId
}) => {
  const sizeClasses = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-3 py-1.5',
    lg: 'text-base px-4 py-2'
  };

  const variantClasses = {
    primary: 'bg-blue-100 text-blue-800',
    secondary: 'bg-gray-100 text-gray-800',
    success: 'bg-green-100 text-green-800',
    warning: 'bg-amber-100 text-amber-800',
    danger: 'bg-red-100 text-red-800',
    info: 'bg-purple-100 text-purple-800'
  };

  // Default icons for entity types
  const defaultIcons: Record<EntityType, string> = {
    world: '🌍',
    character: '👤',
    item: '📦',
    location: '📍',
    custom: '✨'
  };

  const displayIcon = icon || (type && defaultIcons[type]) || null;

  return (
    <span
      data-testid={testId}
      className={`${sizeClasses[size]} ${variantClasses[variant]} rounded-full font-medium inline-flex items-center gap-1 ${className}`}
    >
      {displayIcon && (
        <span className="inline-flex items-center">
          {typeof displayIcon === 'string' ? displayIcon : displayIcon}
        </span>
      )}
      {text}
    </span>
  );
};

export default EntityBadge;
