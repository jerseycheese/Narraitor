'use client';

import React from 'react';

interface CharacterSkill {
  id: string;
  characterId: string;
  name: string;
  level: number;
  category?: string;
}

interface CharacterSkillDisplayProps {
  skills: CharacterSkill[];
  showCategories?: boolean;
}

export function CharacterSkillDisplay({ skills, showCategories = false }: CharacterSkillDisplayProps) {
  if (skills.length === 0) {
    return (
      <div className="text-muted-foreground text-center py-4">
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
      <div className="space-y-6">
        {Object.entries(categorizedSkills).map(([category, skillList]) => (
          <div key={category}>
            <h3 className="text-lg font-semibold mb-3 text-foreground capitalize">
              {category} Skills
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
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
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
      {skills.map((skill, index) => (
        <SkillItem key={skill.id || `skill-${index}`} skill={skill} />
      ))}
    </div>
  );
}

function SkillItem({ skill }: { skill: CharacterSkill }) {
  return (
    <div className="bg-muted rounded-lg p-4 border border-l-4 border-l-primary">
      <div className="text-sm font-medium text-muted-foreground mb-1">
        {skill.name}
      </div>
      <div className="text-2xl font-bold">
        {skill.level}
      </div>
      <div className="text-xs text-muted-foreground">
        Level
      </div>
    </div>
  );
}
