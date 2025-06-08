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
    <section className="bg-white rounded-lg p-6 shadow mb-6">
      <h2 className="text-2xl font-semibold mb-4">Skills</h2>
      <div className="space-y-3">
        {skills.map((skill) => (
          <div key={skill.id} className="border-l-4 border-blue-500 bg-gray-50 rounded-r-lg p-4">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <h3 className="font-semibold text-lg mb-1">{skill.name}</h3>
                {skill.description && (
                  <p className="text-gray-600 text-sm mb-2">{skill.description}</p>
                )}
                <div className="flex gap-4 text-sm text-gray-500">
                  {skill.linkedAttributeId && (
                    <span>
                      Linked to: {attributes.find(a => a.id === skill.linkedAttributeId)?.name || 'Unknown'}
                    </span>
                  )}
                  {skill.difficulty && (
                    <span>Difficulty: {skill.difficulty}</span>
                  )}
                  {skill.category && (
                    <span>Category: {skill.category}</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
