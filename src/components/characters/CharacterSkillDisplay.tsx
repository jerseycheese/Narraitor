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
      <div>
        No skills assigned to this character.
      </div>
    );
  }

  if (showCategories) {
    // Group skills by category
    const categorizedSkills = skills.reduce((acc, skill) => {
      const category = skill.category || 'general';
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(skill);
      return acc;
    }, {} as Record<string, CharacterSkill[]>);

    return (
      <div>
        {Object.entries(categorizedSkills).map(([category, skillList]) => (
          <div key={category}>
            <h3>
              {category}
            </h3>
            <div>
              {skillList.map((skill, index) => (
                <SkillItem key={skill.id || `skill-${category}-${index}`} skill={skill} />
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div>
      {skills.map((skill, index) => (
        <SkillItem key={skill.id || `skill-${index}`} skill={skill} />
      ))}
    </div>
  );
}

function SkillItem({ skill }: { skill: CharacterSkill }) {
  return (
    <div>
      <div>
        {skill.name}
      </div>
      <div>
        {skill.level}
      </div>
      <div>
        Level
      </div>
      {skill.description && (
        <p>{skill.description}</p>
      )}
    </div>
  );
}
