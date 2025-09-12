import React from 'react';
import Link from 'next/link';
import { Star, Plus } from 'lucide-react';
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
    isKnownFigure?: boolean;
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
    <div className="component-character-list grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
                <h3 className="text-xl font-semibold mb-1">
                  <Link 
                    href={`/characters/${character.id}`} 
                    className="text-link-primary no-underline cursor-pointer"
                  >
                    {character.name}
                  </Link>
                </h3>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm text-gray-500">Level {character.level}</span>
                  {character.background?.isKnownFigure !== undefined && (
                    <span 
                      className={`text-xs px-2 py-1 rounded-full font-medium ${
                        character.background.isKnownFigure 
                          ? 'bg-amber-100 text-amber-700' 
                          : 'bg-blue-100 text-blue-900'
                      }`}
                    >
                      {character.background.isKnownFigure ? (
                        <><Star className="w-3 h-3 inline mr-1" aria-hidden="true" />Known Figure</>
                      ) : (
                        <><Plus className="w-3 h-3 inline mr-1" aria-hidden="true" />Original</>
                      )}
                    </span>
                  )}
                </div>
                {character.background?.description && (
                  <p className="text-sm text-gray-700">
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
              className="flex-1 px-4 py-3 bg-blue-500 text-white rounded-md hover:bg-blue-700 font-medium transition-colors"
            >
              Edit
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDeleteCharacter(character.id);
              }}
              className="px-4 py-3 bg-red-500 text-white rounded-md hover:bg-red-700 font-medium transition-colors"
            >
              Delete
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};
