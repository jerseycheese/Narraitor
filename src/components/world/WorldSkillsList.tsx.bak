'use client';

import React from 'react';
import { WorldSkill, WorldAttribute } from '@/types/world.types';
import { SectionWrapper } from '@/components/shared/SectionWrapper';

interface WorldSkillsListProps {
  skills: WorldSkill[];
  attributes: WorldAttribute[];
}

export function WorldSkillsList({ skills, attributes }: WorldSkillsListProps) {
  if (!skills || skills.length === 0) {
    return null;
  }

  return (
    <SectionWrapper title="Skills that characters can learn in this world">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {skills.map((skill, index) => (
          <div key={`${skill.id ?? skill.name ?? index}`} className="bg-muted rounded-lg p-4 border-l-4 border-primary">
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-semibold text-lg">{skill.name}</h3>
              {skill.difficulty && (
                <span className="text-sm text-muted-foreground">
                  Difficulty: {skill.difficulty}
                </span>
              )}
            </div>
            {skill.description && (
              <p className="text-muted-foreground text-sm mb-2">{skill.description}</p>
            )}
            <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
              {skill.attributeIds?.[0] && (
                <span>
                  Linked to: {attributes.find(a => a.id === skill.attributeIds?.[0])?.name || 'Unknown'}
                </span>
              )}
              {skill.category && (
                <span>Category: {skill.category}</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </SectionWrapper>
  );
}
