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
      <div className="text-gray-500 text-center py-4">
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
            <h4 className="text-lg font-semibold mb-3 text-gray-700 capitalize">
              {category} Skills
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {skillList.map(skill => (
                <SkillItem key={skill.id} skill={skill} />
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
      {skills.map(skill => (
        <SkillItem key={skill.id} skill={skill} />
      ))}
    </div>
  );
}

function SkillItem({ skill }: { skill: CharacterSkill }) {
  return (
    <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
      <div className="text-sm font-medium text-blue-600 mb-1">
        {skill.name}
      </div>
      <div className="text-2xl font-bold text-blue-900">
        {skill.level}
      </div>
      <div className="text-xs text-blue-500">
        Level
      </div>
    </div>
  );
}