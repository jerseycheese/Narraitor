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
  initialExpanded?: boolean;
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
const CharacterSummary: React.FC<CharacterSummaryProps> = ({ character, initialExpanded = false }) => {
  const [isExpanded, setIsExpanded] = useState(initialExpanded);
  const worldStore = useWorldStore();
  const world = worldStore.worlds[character.worldId];

  return (
    <div 
      data-testid="character-summary" 
      
      role="region"
      aria-label="Character information"
    >
      {/* Compact Header - Always Visible */}
      <div 
           onClick={() => setIsExpanded(!isExpanded)}>
        <div>
          {/* Portrait Section - show in header when collapsed */}
          {character.portrait && (
            <div>
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
            <h2>
              <Link 
                href={`/characters/${character.id}`} 
                 
                onClick={(e) => e.stopPropagation()}
              >
                {character.name}
              </Link>
            </h2>
            <p>Level {character.level}</p>
          </div>
        </div>
        
        <Button 
          type="button" 
          variant="link"
          size="sm"
          
          data-tutorial="character-sheet-toggle"
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
        <div>
          {character.background?.history && (
            <p>{character.background.history}</p>
          )}

          {/* Attributes and Skills in two columns */}
          {((character.attributes && character.attributes.length > 0) || (character.skills && character.skills.length > 0)) && world && (
            <div>
              {/* Attributes Column */}
              {character.attributes && character.attributes.length > 0 && (
                <div>
                  <h3>Attributes</h3>
                  <div>
                    {character.attributes.map(attr => {
                      const worldAttribute = world.attributes.find(wa => wa.id === attr.worldAttributeId);
                      const displayName = worldAttribute?.name || attr.name;
                      
                      return (
                        <div key={attr.id} >
                          <span>{displayName}</span>
                          <span>({attr.modifiedValue})</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Skills Column */}
              {character.skills && character.skills.length > 0 && (
                <div>
                  <h3>Skills</h3>
                  <div>
                    {character.skills.map(skill => {
                        const worldSkill = world.skills.find(ws => ws.id === skill.worldSkillId);
                        if (!worldSkill) {
                          // Fallback if no world skill found, just show the skill name from character
                          return (
                            <div key={skill.id} >
                              <span>{skill.name}</span>
                              <span>(Level {skill.level})</span>
                            </div>
                          );
                        }
                        
                        const linkedAttributes = worldSkill.attributeIds?.map(attrId => 
                          world.attributes.find(attr => attr.id === attrId)?.name
                        ).filter(Boolean) || [];

                        return (
                          <div key={skill.id} >
                            <span>{worldSkill.name}</span>
                            <span>(Level {skill.level})</span>
                            {linkedAttributes.length > 0 && (
                              <div>
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
