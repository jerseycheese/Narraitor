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
      <div>
        {skills.map((skill, index) => (
          <div key={`${skill.id ?? skill.name ?? index}`} >
            <div>
              <h3>{skill.name}</h3>
              {skill.difficulty && (
                <span>
                  Difficulty: {skill.difficulty}
                </span>
              )}
            </div>
            {skill.description && (
              <p>{skill.description}</p>
            )}
            <div>
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
