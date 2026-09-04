import React from 'react';
import type { StoreCharacter } from '@/state/characterStore';
import { useWorldStore } from '@/state/worldStore';
import { useShallow } from 'zustand/react/shallow';
import { CharacterPortrait } from '@/components/CharacterPortrait';

interface CharacterSnapshotProps {
  character: StoreCharacter;
}

/** -100..-34 Chaotic, -33..33 Neutral, 34..100 Lawful. */
const getAlignmentLabel = (alignment: number): string => {
  if (alignment > 33) return 'Lawful';
  if (alignment < -33) return 'Chaotic';
  return 'Neutral';
};

export const CharacterSnapshot: React.FC<CharacterSnapshotProps> = ({ character }) => {
  // Scope to the worlds slice so this panel doesn't re-render on unrelated
  // world-store writes (worldStates churns during play).
  const worldStore = useWorldStore(useShallow((state) => ({ worlds: state.worlds })));
  const world = worldStore.worlds[character.worldId];
  const normalizedSkills = React.useMemo(() => {
    if (!world) return [];

    return (world.skills || []).map((worldSkill) => {
      const matchingCharacterSkill = (character.skills || []).find((skill) =>
        skill.worldSkillId === worldSkill.id ||
        skill.id === worldSkill.id ||
        skill.name.toLowerCase() === worldSkill.name.toLowerCase()
      );

      return {
        id: matchingCharacterSkill?.id ?? `${character.id}-${worldSkill.id}`,
        name: worldSkill.name,
        level: matchingCharacterSkill?.level ?? 0,
      };
    });
  }, [character.id, character.skills, world]);

  return (
    <div className="manuscript-character-snapshot">
      <h4 className="manuscript-hud-panel-title">CHARACTER SNAPSHOT</h4>

      <div className="manuscript-character-snapshot-identity">
        {character.portrait && (
          <div className="manuscript-character-snapshot-portrait">
            <CharacterPortrait
              portrait={character.portrait}
              characterName={character.name}
              size="medium"
            />
          </div>
        )}
        <div className="manuscript-character-snapshot-name">{character.name}</div>
      </div>

      <div className="manuscript-character-snapshot-stats">
        <div className="manuscript-character-snapshot-section">
          <div className="manuscript-character-snapshot-list">
            <div className="manuscript-character-snapshot-level-row">
              <span className="manuscript-character-snapshot-item-label">Level</span>
              <span className="manuscript-character-snapshot-item-value">{character.level}</span>
            </div>
            {typeof character.alignment === 'number' && (
              <div
                className="manuscript-character-snapshot-alignment"
                data-testid="character-snapshot-alignment"
              >
                <div className="manuscript-character-snapshot-item">
                  <span className="manuscript-character-snapshot-item-label">Alignment</span>
                  <span className="manuscript-character-snapshot-item-value">
                    {getAlignmentLabel(character.alignment)}
                  </span>
                </div>
                <div
                  className="manuscript-character-snapshot-alignment-track"
                  role="img"
                  aria-label={`Alignment ${getAlignmentLabel(character.alignment)} (${character.alignment} on a -100 chaotic to +100 lawful scale)`}
                >
                  <div
                    className="manuscript-character-snapshot-alignment-fill"
                    style={{ left: `${Math.min(50, 50 + character.alignment / 2)}%`, width: `${Math.abs(character.alignment) / 2}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {character.attributes && character.attributes.length > 0 && world && (
          <div className="manuscript-character-snapshot-section">
            <h5 className="manuscript-character-snapshot-subheading">Attributes</h5>
            <div className="manuscript-character-snapshot-list">
              {character.attributes.map(attr => {
                const worldAttribute = world.attributes.find(wa => wa.id === attr.worldAttributeId);
                const displayName = worldAttribute?.name || attr.name;
                
                return (
                  <div key={attr.id} className="manuscript-character-snapshot-item">
                    <span className="manuscript-character-snapshot-item-label">{displayName}</span>
                    <span className="manuscript-character-snapshot-item-value">{attr.modifiedValue}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {world && normalizedSkills.length > 0 && (
          <div className="manuscript-character-snapshot-section" data-section="skills">
            <h5 className="manuscript-character-snapshot-subheading">Skills</h5>
            <div className="manuscript-character-snapshot-list">
              {normalizedSkills.map(skill => {
                return (
                  <div key={skill.id} className="manuscript-character-snapshot-item">
                    <span className="manuscript-character-snapshot-item-label">{skill.name}</span>
                    <span className="manuscript-character-snapshot-item-value">{skill.level}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
