import React, { useState } from 'react';
import Link from 'next/link';
import { CharacterPortrait } from '@/components/CharacterPortrait';
import { useWorldStore } from '@/state/worldStore';
import { Button } from '@/components/ui/button';

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
 * 
 * Features:
 * - Character name, level, background, and portrait
 * - Collapsible design: Shows compact view by default, expands to show details
 * - Two-column layout: Attributes (left) and Skills (right) on desktop when expanded
 * - Responsive design: Single column stack on mobile
 * - Multi-attribute skill linking: Shows which attributes each skill uses
 * - Real-time attribute values and skill levels
 * 
 * Supports multi-attribute skill system with attributeIds array
 */
const CharacterSummary: React.FC<CharacterSummaryProps> = ({ character }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const worldStore = useWorldStore();
  const world = worldStore.worlds[character.worldId];

  return (
    <div 
      data-testid="character-summary" 
      className="bg-white rounded-lg shadow-sm border border-gray-200 p-4"
      role="region"
      aria-label="Character information"
    >
      {/* Compact Header - Always Visible */}
      <div className="flex items-center justify-between gap-4 cursor-pointer select-none hover:bg-gray-50 -m-2 p-2 rounded transition-colors"
           onClick={() => setIsExpanded(!isExpanded)}>
        <div className="flex items-center gap-4">
          {/* Portrait Section - show in header when collapsed */}
          {character.portrait && (
            <div className="flex-shrink-0">
              <Link href={`/characters/${character.id}`} onClick={(e) => e.stopPropagation()}>
                <CharacterPortrait
                  portrait={character.portrait}
                  characterName={character.name}
                  size="medium"
                />
              </Link>
            </div>
          )}
          
          <div>
            <Link href={`/characters/${character.id}`} className="block" onClick={(e) => e.stopPropagation()}>
              <h2 className="text-lg font-bold text-link-primary">
                {character.name}
              </h2>
            </Link>
            <p className="text-sm text-gray-600">Level {character.level}</p>
          </div>
        </div>
        
        <Button 
          type="button" 
          variant="link"
          size="sm"
          className="p-0 h-auto"
          onClick={(e) => {
            e.stopPropagation();
            setIsExpanded(!isExpanded);
          }}
          aria-expanded={isExpanded}
          title={isExpanded ? 'Hide character details' : 'Show character details'}
        >
          {isExpanded ? 'Hide details' : 'Show details'}
        </Button>
      </div>

      {/* Expanded Details - Only show when expanded */}
      {isExpanded && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          {character.background?.history && (
            <p className="text-gray-700 mb-4">{character.background.history}</p>
          )}

          {/* Attributes and Skills in two columns */}
          {((character.attributes && character.attributes.length > 0) || (character.skills && character.skills.length > 0)) && world && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Attributes Column */}
              {character.attributes && character.attributes.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-gray-800 mb-2">Attributes</h3>
                  <div className="space-y-1">
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

              {/* Skills Column */}
              {character.skills && character.skills.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-gray-800 mb-2">Skills</h3>
                  <div className="space-y-1">
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
          )}
        </div>
      )}
    </div>
  );
};

export default CharacterSummary;
