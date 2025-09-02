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
    'from-blue-500 to-blue-700',
    'from-green-500 to-blue-500',
    'from-amber-500 to-red-500',
    'from-red-500 to-red-500',
    'from-blue-500 to-blue-700'
  ];
  
  // Use gray background with border when name is empty
  const isEmpty = !name.trim();
  const backgroundClass = isEmpty 
    ? 'bg-gray-100 border-2 border-gray-300 border-dashed text-gray-500' 
    : `bg-gradient-to-br ${gradients[colorIndex]} text-white`;
  
  return (
    <div 
      className={`
        ${backgroundClass}
        rounded-full flex items-center justify-center 
        font-bold text-2xl w-24 h-24
        ${className}
      `}
      data-testid="character-portrait-placeholder"
    >
      {initials || '?'}
    </div>
  );
};
