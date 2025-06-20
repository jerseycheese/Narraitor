// src/components/shared/GenreSelector/GenreSelector.tsx

import React, { memo } from 'react';
import { GENRES } from '@/lib/constants/genres';

interface GenreSelectorProps {
  selectedGenres: string[];
  onToggleGenre: (genre: string) => void;
  maxSelections?: number;
  className?: string;
  disabled?: boolean;
}

const GenreSelector: React.FC<GenreSelectorProps> = memo(({
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
      {GENRES.map(genre => {
        const isSelected = selectedGenres.includes(genre.label);
        const isDisabled = isGenreDisabled(genre.label);
        
        return (
          <button
            key={genre.value}
            type="button"
            onClick={() => !isDisabled && onToggleGenre(genre.label)}
            disabled={isDisabled}
            className={`
              p-3 rounded-lg text-sm font-medium transition-all duration-200
              border-2 text-center
              ${isSelected
                ? 'border-blue-500 bg-blue-50 text-blue-700'
                : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50'
              }
              ${isDisabled
                ? 'opacity-50 cursor-not-allowed'
                : 'cursor-pointer'
              }
            `}
            title={genre.description}
          >
            {genre.label}
          </button>
        );
      })}
    </div>
  );
});

GenreSelector.displayName = 'GenreSelector';

export { GenreSelector };

// Legacy export for backward compatibility during migration
export const ThemeSelector = GenreSelector;