// src/components/shared/GenreSelector/GenreSelector.tsx

import React, { memo } from 'react';
import { AVAILABLE_GENRES, Genre } from '@/lib/constants/genres';

interface GenreSelectorProps {
  selectedGenres: string[];
  onToggleGenre: (genre: string) => void;
  maxSelections?: number;
  className?: string;
  disabled?: boolean;
}

export const GenreSelector: React.FC<GenreSelectorProps> = memo(({
  selectedGenres,
  onToggleGenre,
  maxSelections,
  className = '',
  disabled = false
}) => {
  const isGenreDisabled = (genre: string) => {
    if (disabled) return true;
    if (!maxSelections) return false;
    return !selectedGenres.includes(genre) && selectedGenres.length >= maxSelections;
  };

  return (
    <div className={`grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 ${className}`}>
      {AVAILABLE_GENRES.map(genre => {
        const isSelected = selectedGenres.includes(genre);
        const isDisabled = isGenreDisabled(genre);
        
        return (
          <button
            key={genre}
            onClick={() => !isDisabled && onToggleGenre(genre)}
            disabled={isDisabled}
            className={`px-3 py-2 text-sm rounded-md border transition-colors ${
              isSelected
                ? 'bg-blue-100 text-blue-700 border-blue-300 selected'
                : isDisabled
                  ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                  : 'bg-gray-50 text-gray-700 border-gray-300 hover:bg-gray-100'
            }`}
          >
            {genre}
          </button>
        );
      })}
    </div>
  );
});