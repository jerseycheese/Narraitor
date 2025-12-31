import React from 'react';
import { cn } from '@/lib/utils/classNames';

interface NarrativeCharacterAvatarProps {
  name: string;
  avatarUrl?: string;
  size?: 'sm' | 'md';
  className?: string;
}

const sizeClassMap = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm'
} as const;

const getInitials = (name: string): string => {
  const sanitized = name
    .replace(/['"][^'"]+['"]/g, '')
    .trim();

  if (!sanitized) {
    return 'NPC';
  }

  const parts = sanitized
    .split(/\s+/)
    .filter(Boolean);

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return parts
    .slice(0, 2)
    .map(part => part[0]?.toUpperCase() ?? '')
    .join('') || 'NPC';
};

export function NarrativeCharacterAvatar({
  name,
  avatarUrl,
  size = 'md',
  className
}: NarrativeCharacterAvatarProps) {
  const initials = React.useMemo(() => getInitials(name), [name]);
  const dimensionClasses = sizeClassMap[size];

  if (avatarUrl) {
    return (
      <div
        className={cn(
          'flex-shrink-0 overflow-hidden rounded-full bg-muted',
          dimensionClasses,
          className
        )}
      >
        {/* Use img over next/image to avoid remote domain constraints for user-provided URLs */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={avatarUrl}
          alt={name}
          loading="lazy"
          decoding="async"
          className="h-full w-full object-cover"
        />
      </div>
    );
  }

  return (
    <div
      className={cn(
        'flex flex-shrink-0 items-center justify-center rounded-full border border-border bg-secondary text-secondary-foreground font-semibold',
        dimensionClasses,
        className
      )}
      role="img"
      aria-label={name}
      data-testid="narrative-avatar-placeholder"
    >
      <span aria-hidden="true">{initials}</span>
      <span className="sr-only">{name}</span>
    </div>
  );
}
