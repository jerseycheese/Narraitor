import React from 'react';
import { Badge } from '@/components/ui/badge';

// DEPRECATED: Use Badge from @/components/ui/badge directly instead
// This component will be removed in a future version

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
  // Map old variants to new Badge variants
  const variantMap = {
    primary: 'default' as const,
    secondary: 'secondary' as const,
    success: 'success' as const,
    warning: 'warning' as const,
    danger: 'destructive' as const,
    info: 'info' as const
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
  const badgeVariant = variantMap[variant];

  return (
    <Badge
      data-testid={testId}
      variant={badgeVariant}
      size={size}
      icon={displayIcon}
      className={className}
    >
      {text}
    </Badge>
  );
};

export default EntityBadge;
