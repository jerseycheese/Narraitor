import React from 'react';
import { User } from 'lucide-react';

interface CharacterPortraitPlaceholderProps {
  name: string;
  className?: string;
}

export const CharacterPortraitPlaceholder: React.FC<CharacterPortraitPlaceholderProps> = ({
  name,
  className = '',
}) => {
  const initials = name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const isEmpty = !name.trim();

  return (
    <div
      className={['component-character-portrait-placeholder', isEmpty ? 'is-empty' : '', className]
        .filter(Boolean)
        .join(' ')}
      data-testid="character-portrait-placeholder"
    >
      {isEmpty ? <User className="portrait-placeholder-icon" aria-hidden="true" /> : initials}
    </div>
  );
};
