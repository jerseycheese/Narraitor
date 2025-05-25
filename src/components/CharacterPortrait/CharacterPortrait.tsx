// src/components/CharacterPortrait/CharacterPortrait.tsx

import React from 'react';
import Image from 'next/image';
import { CharacterPortrait as CharacterPortraitType } from '../../types/character.types';
import { cn } from '../../lib/utils/classNames';

interface CharacterPortraitProps {
  portrait: CharacterPortraitType;
  characterName: string;
  size?: 'small' | 'medium' | 'large' | 'xlarge';
  isGenerating?: boolean;
  error?: string | null;
  onClick?: () => void;
}

const sizeClasses = {
  small: 'w-8 h-8 text-xs',
  medium: 'w-16 h-16 text-lg',
  large: 'w-24 h-24 text-2xl',
  xlarge: 'w-32 h-32 text-3xl'
};

export function CharacterPortrait({
  portrait,
  characterName,
  size = 'medium',
  isGenerating = false,
  error = null,
  onClick
}: CharacterPortraitProps) {
  const getInitials = (name: string): string => {
    const words = name.trim().split(' ');
    if (words.length === 1) {
      return words[0].substring(0, 2).toUpperCase();
    }
    return words
      .slice(0, 2)
      .map(word => word[0])
      .join('')
      .toUpperCase();
  };

  const containerClasses = cn(
    'relative rounded-full overflow-hidden',
    sizeClasses[size],
    onClick && 'cursor-pointer hover:ring-2 hover:ring-blue-500 transition-all',
    'bg-gray-200'
  );

  if (isGenerating) {
    return (
      <div className={containerClasses} data-testid="character-portrait">
        <div className="absolute inset-0 flex items-center justify-center bg-gray-300">
          <div className={cn(
            "animate-spin rounded-full border-b-2 border-gray-900",
            size === 'small' && "h-3 w-3",
            size === 'medium' && "h-6 w-6",
            size === 'large' && "h-8 w-8",
            size === 'xlarge' && "h-10 w-10"
          )} role="status">
            <span className="sr-only">Generating portrait...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={containerClasses} data-testid="character-portrait">
        <div className="absolute inset-0 flex items-center justify-center bg-red-100 text-red-600">
          <span className="text-xs text-center p-2">{error}</span>
        </div>
      </div>
    );
  }

  if (portrait.type === 'ai-generated' && portrait.url) {
    return (
      <div 
        className={containerClasses} 
        data-testid="character-portrait"
        onClick={onClick}
      >
        <Image
          src={portrait.url}
          alt={`${characterName} portrait`}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          unoptimized // For base64 data URLs
        />
      </div>
    );
  }

  // Placeholder
  return (
    <div 
      className={containerClasses} 
      data-testid="character-portrait"
      onClick={onClick}
    >
      <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-blue-400 to-purple-500 text-white font-semibold">
        {getInitials(characterName)}
      </div>
    </div>
  );
}