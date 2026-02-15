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
      className="manuscript-character-summary"
      role="region"
      aria-label="Character information"
    >
      {/* Compact Header - Always Visible */}
      <div 
           className="manuscript-character-summary-header"
           onClick={() => setIsExpanded(!isExpanded)}>
        <div className="manuscript-character-summary-identity">
          {/* Portrait Section - show in header when collapsed */}
          {character.portrait && (
            <div className="manuscript-character-summary-portrait">
              <Link href={`/characters/${character.id}`} onClick={(e) => e.stopPropagation()}>
                <CharacterPortrait
                  portrait={character.portrait}
                  characterName={character.name}
                  size="medium"
                />
              </Link>
            </div>
          )}
          
          <div className="manuscript-character-summary-heading">
            <h2 className="manuscript-character-summary-name">
              <Link 
                href={`/characters/${character.id}`} 
                className="manuscript-character-summary-name-link"
                onClick={(e) => e.stopPropagation()}
              >
                {character.name}
              </Link>
            </h2>
            <p className="manuscript-character-summary-level">Level {character.level}</p>
          </div>
        </div>
        
        <Button 
          type="button" 
          variant="link"
          size="sm"
          className="manuscript-character-summary-toggle"
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
        <div className="manuscript-character-summary-details">
          {character.background?.history && (
            <p className="manuscript-character-summary-history">{character.background.history}</p>
          )}

          {/* Attributes and Skills in two columns */}
          {((character.attributes && character.attributes.length > 0) || (character.skills && character.skills.length > 0)) && world && (
            <div className="manuscript-character-summary-columns">
              {/* Attributes Column */}
              {character.attributes && character.attributes.length > 0 && (
                <div className="manuscript-character-summary-column">
                  <h3 className="manuscript-character-summary-subheading">Attributes</h3>
                  <div className="manuscript-character-summary-list">
                    {character.attributes.map(attr => {
                      const worldAttribute = world.attributes.find(wa => wa.id === attr.worldAttributeId);
                      const displayName = worldAttribute?.name || attr.name;
                      
                      return (
                        <div key={attr.id} className="manuscript-character-summary-item">
                          <span className="manuscript-character-summary-item-label">{displayName}</span>
                          <span className="manuscript-character-summary-item-value">({attr.modifiedValue})</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Skills Column */}
              {character.skills && character.skills.length > 0 && (
                <div className="manuscript-character-summary-column">
                  <h3 className="manuscript-character-summary-subheading">Skills</h3>
                  <div className="manuscript-character-summary-list">
                    {character.skills.map(skill => {
                        const worldSkill = world.skills.find(ws => ws.id === skill.worldSkillId);
                        if (!worldSkill) {
                          // Fallback if no world skill found, just show the skill name from character
                          return (
                            <div key={skill.id} className="manuscript-character-summary-item">
                              <span className="manuscript-character-summary-item-label">{skill.name}</span>
                              <span className="manuscript-character-summary-item-value">(Level {skill.level})</span>
                            </div>
                          );
                        }
                        
                        const linkedAttributes = worldSkill.attributeIds?.map(attrId => 
                          world.attributes.find(attr => attr.id === attrId)?.name
                        ).filter(Boolean) || [];

                        return (
                          <div key={skill.id} className="manuscript-character-summary-item manuscript-character-summary-item-stack">
                            <span className="manuscript-character-summary-item-label">{worldSkill.name}</span>
                            <span className="manuscript-character-summary-item-value">(Level {skill.level})</span>
                            {linkedAttributes.length > 0 && (
                              <div className="manuscript-character-summary-links">
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
