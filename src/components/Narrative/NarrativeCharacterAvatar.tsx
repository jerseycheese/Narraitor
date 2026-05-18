import React from 'react';
import { clsx } from 'clsx';

interface NarrativeCharacterAvatarProps {
  name: string;
  avatarUrl?: string;
  size?: 'sm' | 'md';
  className?: string;
}

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

  if (avatarUrl) {
    return (
      <div
        className={clsx(
          '',
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
          
        />
      </div>
    );
  }

  return (
    <div
      className={clsx(
        '',
        className
      )}
      role="img"
      aria-label={name}
      data-testid="narrative-avatar-placeholder"
    >
      <span aria-hidden="true">{initials}</span>
      <span>{name}</span>
    </div>
  );
}
