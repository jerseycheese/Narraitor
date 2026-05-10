'use client';

import React from 'react';

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

export function CharacterSkillDisplay({ skills, showCategories = false }: CharacterSkillDisplayProps) {
  if (skills.length === 0) {
    return (
      <div className="component-character-skill-display">
        <div className="character-display-empty">
          No skills assigned to this character.
        </div>
      </div>
    );
  }

  if (showCategories) {
    const categorizedSkills = skills.reduce((acc, skill) => {
      const category = skill.category || 'general';
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(skill);
      return acc;
    }, {} as Record<string, CharacterSkill[]>);

    return (
      <div className="component-character-skill-display">
        <div className="character-skill-categories">
          {Object.entries(categorizedSkills).map(([category, skillList]) => (
            <div key={category} className="character-skill-category">
              <h3 className="character-skill-category-heading">
                {category}
              </h3>
              <div className="character-skill-grid">
                {skillList.map((skill, index) => (
                  <SkillItem key={skill.id || `skill-${category}-${index}`} skill={skill} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="component-character-skill-display">
      <div className="character-skill-grid">
        {skills.map((skill, index) => (
          <SkillItem key={skill.id || `skill-${index}`} skill={skill} />
        ))}
      </div>
    </div>
  );
}

function SkillItem({ skill }: { skill: CharacterSkill }) {
  return (
    <div className="character-skill-card">
      <div className="character-skill-name">
        {skill.name}
      </div>
      <div className="character-skill-value">
        {skill.level}
      </div>
      <div className="character-skill-level-label">
        Level
      </div>
      {skill.description && (
        <p className="character-skill-description">{skill.description}</p>
      )}
    </div>
  );
}
