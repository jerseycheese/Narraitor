'use client';

import React, { useState } from 'react';
import { SkillEditor } from '@/components/world/SkillEditor';
import { WorldSkill, WorldAttribute } from '@/types/world.types';
import { formatTime } from '@/lib/utils';
// TypeScript type for skill difficulty is implicitly used in WorldSkill interface

// Mock data for testing
const mockAttributes: WorldAttribute[] = [
  {
    id: 'attr-1',
    name: 'Strength',
    description: 'Physical power and muscle',
    worldId: 'test-world',
    baseValue: 8,
    minValue: 1,
    maxValue: 10,
  },
  {
    id: 'attr-2',
    name: 'Intelligence',
    description: 'Mental capacity and reasoning',
    worldId: 'test-world',
    baseValue: 7,
    minValue: 1,
    maxValue: 10,
  },
  {
    id: 'attr-3',
    name: 'Dexterity',
    description: 'Agility and hand-eye coordination',
    worldId: 'test-world',
    baseValue: 6,
    minValue: 1,
    maxValue: 10,
  },
  {
    id: 'attr-4',
    name: 'Charisma',
    description: 'Social skills and leadership',
    worldId: 'test-world',
    baseValue: 5,
    minValue: 1,
    maxValue: 10,
  },
];

const initialSkills: WorldSkill[] = [
  {
    id: 'skill-1',
    name: 'Swordsmanship',
    description: 'Combat with bladed weapons',
    worldId: 'test-world',
    attributeIds: ['attr-1', 'attr-3'],
    difficulty: 'medium',
    baseValue: 5,
    minValue: 1,
    maxValue: 10,
  },
  {
    id: 'skill-2',
    name: 'Diplomacy',
    description: 'Negotiation and persuasion',
    worldId: 'test-world',
    attributeIds: ['attr-2', 'attr-4'],
    difficulty: 'hard',
    baseValue: 4,
    minValue: 1,
    maxValue: 10,
  },
];

export default function SkillEditorTestPage() {
  const [skills, setSkills] = useState<WorldSkill[]>(initialSkills);
  const [editingSkill, setEditingSkill] = useState<string | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [activityLog, setActivityLog] = useState<string[]>([]);

  const logActivity = (message: string) => {
    setActivityLog(prev => [`[${formatTime(new Date())}]${message}`, ...prev.slice(0, 9)]);
  };

  const handleSaveSkill = (skill: WorldSkill) => {
    if (editingSkill) {
      setSkills(prev => prev.map(s => s.id === skill.id ? skill : s));
      logActivity(`Updated skill: ${skill.name}`);
      setEditingSkill(null);
    } else {
      setSkills(prev => [...prev, skill]);
      logActivity(`Created skill: ${skill.name} (linked to ${skill.attributeIds?.length || 0} attributes)`);
      setShowCreateDialog(false);
    }
  };

  const handleDeleteSkill = (skillId: string) => {
    const skill = skills.find(s => s.id === skillId);
    setSkills(prev => prev.filter(s => s.id !== skillId));
    logActivity(`Deleted skill: ${skill?.name || skillId}`);
    setEditingSkill(null);
  };

  const handleCancel = () => {
    setEditingSkill(null);
    setShowCreateDialog(false);
    logActivity('Operation cancelled');
  };

  const getLinkedAttributeNames = (attributeIds: string[] = []) => {
    return attributeIds
      .map(id => mockAttributes.find(attr => attr.id === id)?.name)
      .filter(Boolean)
      .join(', ');
  };

  return (
    <div>
      <div>
        <div>
          <h1>SkillEditor Test Harness</h1>
          <p>
            Test the SkillEditor component with realistic data and interactions.
          </p>
        </div>

        <div>
          {/* Main Editor Panel */}
          <div>
            <div>
              <div>
                <h2>
                  {editingSkill ? 'Edit Skill' : showCreateDialog ? 'Create New Skill' : 'Skill Management'}
                </h2>
                {!editingSkill && !showCreateDialog && (
                  <button
                    onClick={() => setShowCreateDialog(true)}
                    
                  >
                    Create New Skill
                  </button>
                )}
              </div>

              {(editingSkill || showCreateDialog) ? (
                <SkillEditor
                  worldId="test-world"
                  mode={editingSkill ? 'edit' : 'create'}
                  skillId={editingSkill || undefined}
                  existingSkills={skills}
                  existingAttributes={mockAttributes}
                  maxSkills={12}
                  onSave={handleSaveSkill}
                  onDelete={handleDeleteSkill}
                  onCancel={handleCancel}
                />
              ) : (
                <div>
                  <h3>Existing Skills ({skills.length}/12)</h3>
                  {skills.length === 0 ? (
                    <p>No skills created yet.</p>
                  ) : (
                    <div>
                      {skills.map(skill => (
                        <div
                          key={skill.id}
                          
                        >
                          <div>
                            <div>
                              <h4>{skill.name}</h4>
                              <p>{skill.description}</p>
                              <div>
                                <span>Linked Attributes: {getLinkedAttributeNames(skill.attributeIds) || 'None'}</span>
                                <span>Difficulty: {skill.difficulty}</span>
                              </div>
                            </div>
                            <button
                              onClick={() => setEditingSkill(skill.id)}
                              
                            >
                              Edit
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Side Panel */}
          <div>
            {/* Available Attributes */}
            <div>
              <h3>Available Attributes</h3>
              <div>
                {mockAttributes.map(attr => (
                  <div key={attr.id} >
                    <div>{attr.name}</div>
                    <div>{attr.description}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Activity Log */}
            <div>
              <h3>Activity Log</h3>
              <div>
                {activityLog.length === 0 ? (
                  <p>No activity yet</p>
                ) : (
                  activityLog.map((entry, index) => (
                    <div key={index} >
                      {entry}
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Testing Scenarios */}
            <div>
              <h3>Testing Scenarios</h3>
              <div>
                <div>
                  <strong>1. Create Skills:</strong> Test creating skills with different attribute combinations
                </div>
                <div>
                  <strong>2. Validation:</strong> Try submitting empty forms or duplicate names
                </div>
                <div>
                  <strong>3. Edit Mode:</strong> Edit existing skills and change their attributes
                </div>
                <div>
                  <strong>4. Max Limit:</strong> Create skills up to the 12-skill limit
                </div>
                <div>
                  <strong>5. Delete:</strong> Test the delete confirmation flow
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div>
              <h3>Quick Actions</h3>
              <div>
                <button
                  onClick={() => {
                    setSkills(initialSkills);
                    logActivity('Reset to initial skills');
                  }}
                  
                >
                  Reset Skills
                </button>
                <button
                  onClick={() => {
                    setSkills([]);
                    logActivity('Cleared all skills');
                  }}
                  
                >
                  Clear All Skills
                </button>
                <button
                  onClick={() => {
                    const manySkills: WorldSkill[] = Array.from({ length: 10 }, (_, i) => ({
                      id: `generated-${i}`,
                      name: `Generated Skill ${i + 1}`,
                      description: `Auto-generated skill for testing purposes`,
                      worldId: 'test-world',
                      attributeIds: [mockAttributes[i % mockAttributes.length].id],
                      difficulty: 'medium' as const,
                      baseValue: 5,
                      minValue: 1,
                      maxValue: 10,
                    }));
                    setSkills(prev => [...prev, ...manySkills]);
                    logActivity(`Generated ${manySkills.length} test skills`);
                  }}
                  
                >
                  Generate Test Skills
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
