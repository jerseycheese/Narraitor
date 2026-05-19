'use client';

import React from 'react';
import { CharacterPropertyGrid } from './CharacterPropertyGrid';

interface CharacterSkill {
  id: string;
  characterId: string;
  name: string;
  level: number;
  category?: string;
  description?: string;
}

interface CharacterSkillDisplayProps {
  skills: CharacterSkill[];
  showCategories?: boolean;
}

export function CharacterSkillDisplay({
  skills,
  showCategories = false,
}: CharacterSkillDisplayProps) {
  return (
    <CharacterPropertyGrid
      items={skills}
      kind="skill"
      emptyText="No skills assigned to this character."
      showCategories={showCategories}
      renderItem={(skill) => (
        <div className="character-skill-card">
          <div className="character-skill-name">{skill.name}</div>
          <div className="character-skill-value">{skill.level}</div>
          <div className="character-skill-level-label">Level</div>
          {skill.description && (
            <p className="character-skill-description">{skill.description}</p>
          )}
        </div>
      )}
    />
  );
}
