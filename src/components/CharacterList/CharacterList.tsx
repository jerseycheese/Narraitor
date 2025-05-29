import React from 'react';
import Link from 'next/link';
import { CharacterPortrait } from '@/components/CharacterPortrait';

interface Character {
  id: string;
  name: string;
  level: number;
  portrait?: {
    type: 'ai-generated' | 'placeholder';
    url: string | null;
  };
  background?: {
    description?: string;
  };
  attributes: Array<{ name: string; modifiedValue: number }>;
  skills: Array<{ name: string; level: number }>;
}

interface CharacterListProps {
  characters: Character[];
  currentCharacterId: string | null;
  onSelectCharacter: (characterId: string) => void;
  onEditCharacter: (characterId: string) => void;
  onDeleteCharacter: (characterId: string) => void;
}

export const CharacterList: React.FC<CharacterListProps> = ({
  characters,
  currentCharacterId,
  onSelectCharacter,
  onEditCharacter,
  onDeleteCharacter,
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {characters.map(character => (
        <div
          key={character.id}
          className={`bg-white rounded-lg shadow p-6 cursor-pointer transition-all ${
            currentCharacterId === character.id ? 'ring-2 ring-blue-500' : ''
          }`}
          onClick={() => onSelectCharacter(character.id)}
        >
          <div className="mb-4">
            <div className="flex gap-3 mb-3">
              {/* Character Info Section */}
              <div className="flex-1">
                <Link href={`/characters/${character.id}`}>
                  <h3 className="text-xl font-semibold hover:text-blue-600 transition-colors cursor-pointer mb-1">
                    {character.name}
                  </h3>
                </Link>
                <span className="text-sm text-gray-500 block mb-2">Level {character.level}</span>
                {character.background?.description && (
                  <p className="text-sm text-gray-600">
                    {character.background.description}
                  </p>
                )}
              </div>

              {/* Portrait Section */}
              <div className="flex-shrink-0">
                <Link href={`/characters/${character.id}`}>
                  <CharacterPortrait
                    portrait={character.portrait || { type: 'placeholder', url: null }}
                    characterName={character.name}
                    size="large"
                  />
                </Link>
              </div>
            </div>
          </div>
          
          <div className="space-y-2 mb-4">
            <div className="flex gap-2 flex-wrap">
              {character.attributes.slice(0, 3).map(attr => (
                <span key={attr.name} className="text-xs bg-gray-100 px-2 py-1 rounded">
                  {attr.name}: {attr.modifiedValue}
                </span>
              ))}
            </div>
            <div className="flex gap-2 flex-wrap">
              {character.skills.slice(0, 3).map(skill => (
                <span key={skill.name} className="text-xs bg-blue-100 px-2 py-1 rounded">
                  {skill.name}: {skill.level}
                </span>
              ))}
            </div>
          </div>
          
          <div className="flex gap-3">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEditCharacter(character.id);
              }}
              className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium transition-colors"
            >
              Edit
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDeleteCharacter(character.id);
              }}
              className="px-4 py-3 bg-red-600 text-white rounded-md hover:bg-red-700 font-medium transition-colors"
            >
              Delete
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};