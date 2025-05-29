import React from 'react';
import Link from 'next/link';
import { CharacterPortrait } from '@/components/CharacterPortrait';

// Character type as used in characterStore
interface Character {
  id: string;
  name: string;
  worldId: string;
  level: number;
  description?: string;
  background?: {
    description: string;
    personality: string;
    motivation: string;
  };
  portrait?: {
    type: 'ai-generated' | 'placeholder';
    url: string | null;
  };
  createdAt: string;
  updatedAt: string;
}

interface CharacterSummaryProps {
  character: Character;
}

/**
 * CharacterSummary displays essential character information during gameplay
 * Shows name, description, background, level, and portrait
 */
const CharacterSummary: React.FC<CharacterSummaryProps> = ({ character }) => {
  return (
    <div 
      data-testid="character-summary" 
      className="bg-white rounded-lg shadow-sm border border-gray-200 p-4"
      role="region"
      aria-label="Character information"
    >
      <div>
        {/* Portrait Section */}
        <Link href={`/characters/${character.id}`} className="float-right ml-4 mb-3">
          <CharacterPortrait
            portrait={character.portrait || { type: 'placeholder', url: null }}
            characterName={character.name}
            size="large"
          />
        </Link>

        {/* Character Info Section */}
        <Link href={`/characters/${character.id}`} className="block">
          <h2 className="text-xl font-bold text-gray-900 hover:text-blue-600 transition-colors mb-1">
            {character.name}
          </h2>
        </Link>
        
        <p className="text-sm text-gray-600 mb-2">Level {character.level}</p>
        
        {character.description && (
          <p className="text-gray-700 mb-2">{character.description}</p>
        )}
        
        {character.background?.description && (
          <p className="text-sm text-gray-600 italic">{character.background.description}</p>
        )}
        
        <div className="clear-both"></div>
      </div>
    </div>
  );
};

export default CharacterSummary;