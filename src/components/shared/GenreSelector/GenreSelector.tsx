// src/components/shared/GenreSelector/GenreSelector.tsx

import React, { memo } from 'react';
import { GENRES, MIXABLE_GENRES } from '@/lib/constants/genres';
import { Button } from '@/components/ui/button';

interface GenreSelectorProps {
  selectedGenres: string[];
  onToggleGenre: (genre: string) => void;
  maxSelections?: number;
  className?: string;
  disabled?: boolean;
  /** If true, excludes 'other' genre for use in genre mixing scenarios */
  excludeOther?: boolean;
}

const GenreSelector: React.FC<GenreSelectorProps> = memo(({
  selectedGenres,
  onToggleGenre,
  maxSelections,
  className = '',
  disabled = false,
  excludeOther = false
}) => {
  const isGenreDisabled = (genre: string) => {
    if (disabled) return true;
    if (!maxSelections) return false;
    return !selectedGenres.includes(genre) && selectedGenres.length >= maxSelections;
  };

  // Choose which genres to display based on excludeOther prop
  const genresToDisplay = excludeOther ? MIXABLE_GENRES : GENRES;

  return (
    <div className={`grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 ${className}`}>
      {genresToDisplay.map(genre => {
        const isSelected = selectedGenres.includes(genre.label);
        const isDisabled = isGenreDisabled(genre.label);
        
        return (
          <Button
            key={genre.value}
            type="button"
            onClick={() => !isDisabled && onToggleGenre(genre.label)}
            disabled={isDisabled}
            variant={isSelected ? 'default' : 'outline'}
            className={`
              p-3 rounded-lg text-sm font-medium transition-all duration-200
              border-2 text-center
              ${isSelected
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-100'
              }
              ${isDisabled
                ? 'opacity-50 cursor-not-allowed'
                : 'cursor-pointer'
              }
            `}
            title={genre.description}
          >
            {genre.label}
          </Button>
        );
      })}
    </div>
  );
});

GenreSelector.displayName = 'GenreSelector';

export { GenreSelector };