import React from 'react';
import Link from 'next/link';
import { CharacterPortrait } from '@/components/CharacterPortrait';
import { useWorldStore } from '@/state/worldStore';

// Use the character type from the store rather than types/character.types
interface Character {
  id: string;
  name: string;
  level: number;
  worldId: string;
  background?: {
    history?: string;
  };
  attributes?: Array<{
    id: string;
    name: string;
    modifiedValue: number;
    worldAttributeId?: string;
  }>;
  skills?: Array<{
    id: string;
    name: string;
    level: number;
    worldSkillId?: string;
  }>;
  portrait?: {
    type: 'ai-generated' | 'placeholder';
    url: string | null;
    generatedAt?: string;
    prompt?: string;
  };
}

interface CharacterSummaryProps {
  character: Character;
}

/**
 * CharacterSummary displays essential character information during gameplay
 * Shows name, description, background, level, and portrait
 */
const CharacterSummary: React.FC<CharacterSummaryProps> = ({ character }) => {
  const worldStore = useWorldStore();
  const world = worldStore.worlds[character.worldId];

  return (
    <div 
      data-testid="character-summary" 
      className="bg-white rounded-lg shadow-sm border border-gray-200 p-4"
      role="region"
      aria-label="Character information"
    >
      <div className="flex gap-4">
        {/* Character Info Section */}
        <div className="flex-1">
          <Link href={`/characters/${character.id}`} className="block">
            <h2 className="text-xl font-bold text-gray-900 hover:text-blue-600 transition-colors mb-1">
              {character.name}
            </h2>
          </Link>
          
          <p className="text-sm text-gray-600 mb-2">Level {character.level}</p>
          
          {character.background?.history && (
            <p className="text-gray-700 mb-3">{character.background.history}</p>
          )}

          {/* Attributes Section */}
          {character.attributes && character.attributes.length > 0 && world && (
            <div className="mt-3">
              <h3 className="text-sm font-medium text-gray-800 mb-2">Attributes</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                {character.attributes.map(attr => {
                  const worldAttribute = world.attributes.find(wa => wa.id === attr.worldAttributeId);
                  const displayName = worldAttribute?.name || attr.name;
                  
                  return (
                    <div key={attr.id} className="text-sm">
                      <span className="font-medium text-gray-700">{displayName}</span>
                      <span className="text-gray-500 ml-1">({attr.modifiedValue})</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Skills Section */}
          {character.skills && character.skills.length > 0 && world && (
            <div className="mt-3">
              <h3 className="text-sm font-medium text-gray-800 mb-2">Skills</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                {character.skills.map(skill => {
                    const worldSkill = world.skills.find(ws => ws.id === skill.worldSkillId);
                    if (!worldSkill) {
                      // Fallback if no world skill found, just show the skill name from character
                      return (
                        <div key={skill.id} className="text-sm">
                          <span className="font-medium text-gray-700">{skill.name}</span>
                          <span className="text-gray-500 ml-1">(Level {skill.level})</span>
                        </div>
                      );
                    }
                    
                    const linkedAttributes = worldSkill.attributeIds?.map(attrId => 
                      world.attributes.find(attr => attr.id === attrId)?.name
                    ).filter(Boolean) || [];

                    return (
                      <div key={skill.id} className="text-sm">
                        <span className="font-medium text-gray-700">{worldSkill.name}</span>
                        <span className="text-gray-500 ml-1">(Level {skill.level})</span>
                        {linkedAttributes.length > 0 && (
                          <div className="text-xs text-blue-600">
                            Linked to: {linkedAttributes.join(', ')}
                          </div>
                        )}
                      </div>
                    );
                  })}
              </div>
            </div>
          )}
        </div>

        {/* Portrait Section - only show if portrait exists */}
        {character.portrait && (
          <div className="flex-shrink-0">
            <Link href={`/characters/${character.id}`}>
              <CharacterPortrait
                portrait={character.portrait}
                characterName={character.name}
                size="large"
              />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default CharacterSummary;
