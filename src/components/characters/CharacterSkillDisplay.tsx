'use client';

import React from 'react';
import { CategorizedList } from '../shared/CategorizedList';

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
  return (
    <CategorizedList
      items={skills}
      emptyMessage="No skills assigned to this character."
      showCategories={showCategories}
      renderItem={(skill) => <SkillItem skill={skill} />}
      itemKeyPrefix="skill"
    />
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
      <div className="text-xs text-muted-foreground mb-2">
        Level
      </div>
      {skill.description && (
        <p className="text-xs text-muted-foreground">{skill.description}</p>
      )}
    </div>
  );
}
