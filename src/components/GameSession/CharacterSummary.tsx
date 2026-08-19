import React, { useState } from 'react';
import Link from 'next/link';
import { CharacterPortrait } from '@/components/CharacterPortrait';
import { useWorldStore } from '@/state/worldStore';
import { useShallow } from 'zustand/react/shallow';
import { Button } from '@/components/ui/button';

interface CharacterBackground {
  history?: string;
  personality?: string;
  physicalDescription?: string;
  goals?: string[];
  fears?: string[];
}

interface CharacterStatus {
  conditions?: string[];
  location?: string;
}

interface DerivedStat {
  id: string;
  name: string;
  currentValue: number;
  maxValue: number;
}

// Use the character type from the store rather than types/character.types
interface Character {
  id: string;
  name: string;
  level: number;
  worldId: string;
  background?: CharacterBackground;
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
  derivedStats?: DerivedStat[];
  status?: CharacterStatus;
  portrait?: {
    type: 'ai-generated' | 'placeholder' | 'preset' | 'uploaded';
    url: string | null;
    generatedAt?: string;
    prompt?: string;
  };
}

interface CharacterSummaryProps {
  character: Character;
  initialExpanded?: boolean;
  variant?: 'default' | 'drawer';
}

/**
 * CharacterSummary displays essential character information during gameplay
 *
 * Features:
 * - Character name, level, background, and portrait
 * - Collapsible design (default variant): Shows compact view by default, expands to show details
 * - Drawer variant: Expanded by default, no border/background/toggle, optimized for drawer panels
 * - Two-column layout: Attributes (left) and Skills (right) on desktop when expanded
 * - Responsive design: Single column stack on mobile
 * - Multi-attribute skill linking: Shows which attributes each skill uses
 * - Real-time attribute values and skill levels
 */
const CharacterSummary: React.FC<CharacterSummaryProps> = ({
  character,
  initialExpanded = false,
  variant = 'default'
}) => {
  const [isExpanded, setIsExpanded] = useState(variant === 'drawer' ? true : initialExpanded);
  // Scope to the worlds slice so this panel doesn't re-render on unrelated
  // world-store writes (worldStates churns during play).
  const worldStore = useWorldStore(useShallow((state) => ({ worlds: state.worlds })));
  const world = worldStore.worlds[character.worldId];

  const isDrawer = variant === 'drawer';

  return (
    <div
      data-testid="character-summary"
      className={isDrawer ? 'manuscript-character-details' : 'manuscript-character-summary'}
      role="region"
      aria-label="Character information"
    >
      {/* Header Section */}
      <div
           className="manuscript-character-summary-header"
           onClick={() => !isDrawer && setIsExpanded(!isExpanded)}>
        <div className="manuscript-character-summary-identity">
          {/* Portrait Section */}
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

        {!isDrawer && (
          <Button
            type="button"
            variant="link"
            size="sm"
            className="manuscript-character-summary-toggle"
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
            aria-expanded={isExpanded}
            title={isExpanded ? 'Hide character details' : 'Show character details'}
          >
            {isExpanded ? 'Hide details' : 'Show details'}
          </Button>
        )}
      </div>

      {/* Details Section */}
      {isExpanded && (
        <div className="manuscript-character-summary-details">
          {/* Background */}
          {character.background?.history && (
            <p className="manuscript-character-summary-history font-narrative">{character.background.history}</p>
          )}
          {isDrawer && character.background?.personality && (
            <p className="manuscript-character-summary-history font-narrative">{character.background.personality}</p>
          )}
          {isDrawer && character.background?.physicalDescription && (
            <p className="manuscript-character-summary-history font-narrative">{character.background.physicalDescription}</p>
          )}

          {/* Goals and Fears (drawer only) */}
          {isDrawer && (character.background?.goals?.length || character.background?.fears?.length) ? (
            <div className="manuscript-character-summary-columns">
              {character.background?.goals && character.background.goals.length > 0 && (
                <div className="manuscript-character-summary-column">
                  <h3 className="manuscript-character-summary-subheading">Goals</h3>
                  <div className="manuscript-character-summary-list">
                    {character.background.goals.map((goal, i) => (
                      <div key={i} className="manuscript-character-summary-item manuscript-character-summary-item-stack">
                        <span className="manuscript-character-summary-item-label">{goal}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {character.background?.fears && character.background.fears.length > 0 && (
                <div className="manuscript-character-summary-column">
                  <h3 className="manuscript-character-summary-subheading">Fears</h3>
                  <div className="manuscript-character-summary-list">
                    {character.background.fears.map((fear, i) => (
                      <div key={i} className="manuscript-character-summary-item manuscript-character-summary-item-stack">
                        <span className="manuscript-character-summary-item-label">{fear}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : null}

          {/* Status (drawer only) */}
          {isDrawer && character.status && (
            <div className="manuscript-character-summary-column">
              <h3 className="manuscript-character-summary-subheading">Status</h3>
              <div className="manuscript-character-summary-list">
                {character.status.location && (
                  <div className="manuscript-character-summary-item">
                    <span className="manuscript-character-summary-item-label">Location</span>
                    <span className="manuscript-character-summary-item-value">{character.status.location}</span>
                  </div>
                )}
                {character.status.conditions && character.status.conditions.length > 0 && (
                  <div className="manuscript-character-summary-item manuscript-character-summary-item-stack">
                    <span className="manuscript-character-summary-item-label">Conditions</span>
                    <span className="manuscript-character-summary-item-value">{character.status.conditions.join(', ')}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Derived Stats (drawer only) */}
          {isDrawer && character.derivedStats && character.derivedStats.length > 0 && (
            <div className="manuscript-character-summary-column">
              <h3 className="manuscript-character-summary-subheading">Derived Stats</h3>
              <div className="manuscript-character-summary-list">
                {character.derivedStats.map((stat) => (
                  <div key={stat.id} className="manuscript-character-summary-item">
                    <span className="manuscript-character-summary-item-label">{stat.name}</span>
                    <span className="manuscript-character-summary-item-value">{stat.currentValue} / {stat.maxValue}</span>
                  </div>
                ))}
              </div>
            </div>
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
                          <span className="manuscript-character-summary-item-value">{attr.modifiedValue}</span>
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
                              <span className="manuscript-character-summary-item-value">Level {skill.level}</span>
                            </div>
                          );
                        }

                        const linkedAttributes = worldSkill.attributeIds?.map(attrId =>
                          world.attributes.find(attr => attr.id === attrId)?.name
                        ).filter(Boolean) || [];

                        return (
                          <div key={skill.id} className="manuscript-character-summary-item manuscript-character-summary-item-stack">
                            <span className="manuscript-character-summary-item-label">{worldSkill.name}</span>
                            <span className="manuscript-character-summary-item-value">Level {skill.level}</span>
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
