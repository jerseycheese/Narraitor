'use client';

import React, { useState } from 'react';
import { SkillEditor } from '@/components/world/SkillEditor';
import { WorldSkill, WorldAttribute } from '@/types/world.types';
import { EntityID } from '@/types/common.types';

export default function SkillEditorTestHarness() {
  // Mock world and entity IDs
  const mockWorldId = 'test-world-123' as EntityID;

  // Mock attributes for testing
  const [attributes] = useState<WorldAttribute[]>([
    {
      id: 'attr-1' as EntityID,
      worldId: mockWorldId,
      name: 'Strength',
      description: 'Physical power and endurance',
      baseValue: 10,
      minValue: 1,
      maxValue: 20,
    },
    {
      id: 'attr-2' as EntityID,
      worldId: mockWorldId,
      name: 'Intelligence',
      description: 'Mental acuity and problem-solving ability',
      baseValue: 12,
      minValue: 1,
      maxValue: 20,
    },
    {
      id: 'attr-3' as EntityID,
      worldId: mockWorldId,
      name: 'Dexterity',
      description: 'Agility and reflexes',
      baseValue: 14,
      minValue: 1,
      maxValue: 20,
    },
    {
      id: 'attr-4' as EntityID,
      worldId: mockWorldId,
      name: 'Charisma',
      description: 'Force of personality and social skills',
      baseValue: 8,
      minValue: 1,
      maxValue: 20,
    },
    {
      id: 'attr-5' as EntityID,
      worldId: mockWorldId,
      name: 'Wisdom',
      description: 'Perception and insight',
      baseValue: 11,
      minValue: 1,
      maxValue: 20,
    },
  ]);

  // Mock existing skills
  const [skills, setSkills] = useState<WorldSkill[]>([
    {
      id: 'skill-1' as EntityID,
      worldId: mockWorldId,
      name: 'Athletics',
      description: 'Physical prowess and endurance activities',
      attributeIds: ['attr-1', 'attr-3'],
      difficulty: 'medium',
      category: 'Physical',
      baseValue: 3,
      minValue: 1,
      maxValue: 5,
    },
    {
      id: 'skill-2' as EntityID,
      worldId: mockWorldId,
      name: 'Persuasion',
      description: 'Convincing others through charm and reasoning',
      attributeIds: ['attr-4'],
      difficulty: 'easy',
      category: 'Social',
      baseValue: 2,
      minValue: 1,
      maxValue: 5,
    },
    {
      id: 'skill-3' as EntityID,
      worldId: mockWorldId,
      name: 'Investigation',
      description: 'Finding clues and solving mysteries through careful observation',
      attributeIds: ['attr-2', 'attr-5'],
      difficulty: 'hard',
      category: 'Mental',
      baseValue: 4,
      minValue: 1,
      maxValue: 5,
    },
  ]);

  // State for the test harness
  const [mode, setMode] = useState<'create' | 'edit'>('create');
  const [editingSkillId, setEditingSkillId] = useState<EntityID | null>(null);
  const [showEditor, setShowEditor] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const handleSave = (skill: WorldSkill) => {
    if (mode === 'create') {
      setSkills(prev => [...prev, skill]);
      addLog(`Created skill: ${skill.name} (linked to ${skill.attributeIds?.length || 0} attributes)`);
    } else {
      setSkills(prev => prev.map(s => s.id === skill.id ? skill : s));
      addLog(`Updated skill: ${skill.name} (linked to ${skill.attributeIds?.length || 0} attributes)`);
    }
    setShowEditor(false);
    setEditingSkillId(null);
  };

  const handleDelete = (skillId: EntityID) => {
    const skill = skills.find(s => s.id === skillId);
    setSkills(prev => prev.filter(s => s.id !== skillId));
    addLog(`Deleted skill: ${skill?.name || skillId}`);
    setShowEditor(false);
    setEditingSkillId(null);
  };

  const handleCancel = () => {
    addLog(`Cancelled ${mode} operation`);
    setShowEditor(false);
    setEditingSkillId(null);
  };

  const startCreate = () => {
    setMode('create');
    setEditingSkillId(null);
    setShowEditor(true);
    addLog('Started creating new skill');
  };

  const startEdit = (skillId: EntityID) => {
    const skill = skills.find(s => s.id === skillId);
    setMode('edit');
    setEditingSkillId(skillId);
    setShowEditor(true);
    addLog(`Started editing skill: ${skill?.name || skillId}`);
  };

  const clearLogs = () => {
    setLogs([]);
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            SkillEditor Test Harness
          </h1>
          <p className="text-gray-600 mb-4">
            This page provides comprehensive testing for the SkillEditor component with realistic data and scenarios.
          </p>
          
          {/* Status Info */}
          <div className="bg-white rounded-lg shadow p-4 mb-6">
            <h2 className="text-lg font-semibold mb-2">Current State</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{skills.length}</div>
                <div className="text-sm text-gray-500">Skills Created</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{attributes.length}</div>
                <div className="text-sm text-gray-500">Available Attributes</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {skills.reduce((acc, skill) => acc + (skill.attributeIds?.length || 0), 0)}
                </div>
                <div className="text-sm text-gray-500">Total Attribute Links</div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Controls and Current Skills */}
          <div className="space-y-6">
            {/* Controls */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Test Controls</h2>
              <div className="space-y-4">
                <button
                  onClick={startCreate}
                  disabled={showEditor}
                  className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed font-medium transition-colors"
                >
                  Create New Skill
                </button>
                
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={clearLogs}
                    className="px-3 py-2 bg-gray-500 text-white rounded text-sm hover:bg-gray-600 transition-colors"
                  >
                    Clear Logs
                  </button>
                  <div className="text-sm text-gray-500 flex items-center justify-center">
                    {skills.length >= 12 ? 'Skill limit reached' : `${12 - skills.length} slots remaining`}
                  </div>
                </div>
              </div>
            </div>

            {/* Current Skills */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Current Skills</h2>
              {skills.length === 0 ? (
                <p className="text-gray-500 italic">No skills created yet.</p>
              ) : (
                <div className="space-y-3">
                  {skills.map(skill => (
                    <div key={skill.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900">{skill.name}</h3>
                          <p className="text-sm text-gray-600 mt-1">{skill.description}</p>
                          <div className="mt-2 text-xs text-gray-500">
                            <span className="inline-block bg-gray-100 px-2 py-1 rounded mr-2">
                              {skill.difficulty}
                            </span>
                            {skill.category && (
                              <span className="inline-block bg-blue-100 px-2 py-1 rounded mr-2">
                                {skill.category}
                              </span>
                            )}
                            <span className="inline-block bg-green-100 px-2 py-1 rounded">
                              Base: {skill.baseValue}
                            </span>
                          </div>
                          {skill.attributeIds && skill.attributeIds.length > 0 && (
                            <div className="mt-2">
                              <span className="text-xs text-gray-500">Linked to: </span>
                              {skill.attributeIds.map(attrId => {
                                const attr = attributes.find(a => a.id === attrId);
                                return (
                                  <span key={attrId} className="inline-block bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs mr-1">
                                    {attr?.name || attrId}
                                  </span>
                                );
                              })}
                            </div>
                          )}
                        </div>
                        <button
                          onClick={() => startEdit(skill.id)}
                          disabled={showEditor}
                          className="ml-4 px-3 py-1 bg-blue-100 text-blue-700 rounded text-sm hover:bg-blue-200 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
                        >
                          Edit
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Activity Log */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Activity Log</h2>
              {logs.length === 0 ? (
                <p className="text-gray-500 italic">No activity yet.</p>
              ) : (
                <div className="space-y-1 max-h-64 overflow-y-auto">
                  {logs.slice(-10).map((log, index) => (
                    <div key={index} className="text-sm text-gray-600 font-mono">
                      {log}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Column - SkillEditor */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">
              {showEditor ? `${mode === 'create' ? 'Create' : 'Edit'} Skill` : 'SkillEditor Component'}
            </h2>
            
            {showEditor ? (
              <SkillEditor
                worldId={mockWorldId}
                mode={mode}
                skillId={editingSkillId || undefined}
                onSave={handleSave}
                onDelete={mode === 'edit' ? handleDelete : undefined}
                onCancel={handleCancel}
                existingAttributes={attributes}
                existingSkills={skills}
              />
            ) : (
              <div className="text-center py-12">
                <div className="text-gray-400 mb-4">
                  <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
                  </svg>
                </div>
                <p className="text-gray-500">Click "Create New Skill" or "Edit" on a skill to test the SkillEditor component.</p>
              </div>
            )}
          </div>
        </div>

        {/* Testing Scenarios */}
        <div className="mt-8 bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Testing Scenarios</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="font-medium text-gray-900 mb-2">✅ Multi-Attribute Selection</h3>
              <p className="text-sm text-gray-600">Create skills linked to multiple attributes (e.g., Athletics = Strength + Dexterity)</p>
            </div>
            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="font-medium text-gray-900 mb-2">✅ Validation Testing</h3>
              <p className="text-sm text-gray-600">Try duplicate names, invalid ranges, empty required fields</p>
            </div>
            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="font-medium text-gray-900 mb-2">✅ Skill Limit (12 max)</h3>
              <p className="text-sm text-gray-600">Create up to 12 skills to test the limit enforcement</p>
            </div>
            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="font-medium text-gray-900 mb-2">✅ Delete with Warnings</h3>
              <p className="text-sm text-gray-600">Edit and delete skills with multiple attribute links</p>
            </div>
            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="font-medium text-gray-900 mb-2">✅ Form State Management</h3>
              <p className="text-sm text-gray-600">Test form persistence, error clearing, and cancellation</p>
            </div>
            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="font-medium text-gray-900 mb-2">✅ Integration Flow</h3>
              <p className="text-sm text-gray-600">Verify skill creation/editing flows work end-to-end</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}