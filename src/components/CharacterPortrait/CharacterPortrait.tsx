// src/components/CharacterPortrait/CharacterPortrait.tsx

import React from 'react';
import Image from 'next/image';
import { clsx } from 'clsx';
import { GeneratedImage } from '@/types/common.types';

interface CharacterPortraitProps {
  portrait: GeneratedImage;
  characterName: string;
  size?: 'small' | 'medium' | 'large' | 'xlarge';
  isGenerating?: boolean;
  error?: string | null;
  onClick?: () => void;
}

export function CharacterPortrait({
  portrait,
  characterName,
  size = 'medium',
  isGenerating = false,
  error = null,
  onClick
}: CharacterPortraitProps) {
  const getInitials = (name: string): string => {
    // Remove nicknames in quotes (single or double quotes, including spaces)
    const nameWithoutNickname = name
      .replace(/['"][^'"]+['"]/g, '') // Remove anything between quotes
      .replace(/\s+/g, ' ') // Normalize multiple spaces to single space
      .trim();
    
    // Split by spaces and filter out empty strings
    const words = nameWithoutNickname.split(' ').filter(word => word.length > 0);
    
    if (words.length === 0) {
      // Fallback to original name if nothing left after removing nicknames
      return name.substring(0, 2).toUpperCase();
    }
    
    if (words.length === 1) {
      return words[0].substring(0, 2).toUpperCase();
    }
    
    // Take first letter of first two words
    return words
      .slice(0, 2)
      .map(word => word[0])
      .join('')
      .toUpperCase();
  };

  const containerClasses = clsx(
    'component-character-portrait',
    `component-character-portrait-${size}`
  );

  if (isGenerating) {
    return (
      <div className={containerClasses} data-testid="character-portrait">
        <div>
          <div role="status">
            <span>Generating portrait...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={containerClasses} data-testid="character-portrait">
        <div>
          <span>{error}</span>
        </div>
      </div>
    );
  }

  if (portrait.type !== 'placeholder' && portrait.url) {
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
      <div>
        {getInitials(characterName)}
      </div>
    </div>
  );
}
