import React from 'react';

interface CharacterPortraitPlaceholderProps {
  name: string;
  className?: string;
}

export const CharacterPortraitPlaceholder: React.FC<CharacterPortraitPlaceholderProps> = ({ 
  name, 
  className = '' 
}) => {
  const initials = name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
    
  // Generate consistent color based on name, fallback to first gradient if name is empty
  const colorIndex = name ? name.charCodeAt(0) % 5 : 0;
  const gradients = [
    '',
    '',
    '',
    '',
    ''
  ];
  
  // Use gray background with border when name is empty
  const isEmpty = !name.trim();
  const backgroundClass = isEmpty 
    ? '' 
    : `${gradients[colorIndex]}`;
  
  return (
    <div 
      className={['component-character-portrait-placeholder', backgroundClass, className]
        .filter(Boolean)
        .join(' ')}
      data-testid="character-portrait-placeholder"
    >
      {initials || '?'}
    </div>
  );
};
