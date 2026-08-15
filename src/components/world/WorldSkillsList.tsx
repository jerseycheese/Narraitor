'use client';

import React from 'react';
import { WorldSkill, WorldAttribute } from '@/types/world.types';

interface WorldSkillsListProps {
  skills: WorldSkill[];
  attributes: WorldAttribute[];
}

export function WorldSkillsList({ skills, attributes }: WorldSkillsListProps) {
  if (!skills || skills.length === 0) {
    return null;
  }

  return (
    <section
      className="world-detail-section world-detail-skills"
      aria-labelledby="world-skills-heading"
    >
      <h2 id="world-skills-heading">Skills</h2>
      <div className="world-detail-stat-list">
        {skills.map((skill, index) => (
          <div key={`${skill.id ?? skill.name ?? index}`} className="world-detail-stat">
            <div className="world-detail-stat-head">
              <h3 className="world-detail-stat-name">{skill.name}</h3>
              {skill.difficulty && (
                <span className="world-detail-stat-range">
                  Difficulty: {skill.difficulty}
                </span>
              )}
            </div>
            {skill.description && (
              <p className="world-detail-stat-description">{skill.description}</p>
            )}
            <div className="world-detail-stat-tags">
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
    </section>
  );
}
