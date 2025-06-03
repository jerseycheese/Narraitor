'use client';

import React, { useState } from 'react';
import { WorldAttribute, WorldSkill } from '@/types/world.types';
import { EntityID } from '@/types/common.types';
import { AttributeEditor } from '@/components/world/AttributeEditor';

export default function AttributeEditorTestPage() {
  const [attributes, setAttributes] = useState<WorldAttribute[]>([
    {
      id: 'attr-1' as EntityID,
      worldId: 'world-test' as EntityID,
      name: 'Strength',
      description: 'Physical power and endurance',
      minValue: 1,
      maxValue: 10,
      baseValue: 5,
    },
    {
      id: 'attr-2' as EntityID,
      worldId: 'world-test' as EntityID,
      name: 'Intelligence',
      description: 'Mental acuity and problem-solving',
      minValue: 1,
      maxValue: 20,
      baseValue: 10,
    },
    {
      id: 'attr-3' as EntityID,
      worldId: 'world-test' as EntityID,
      name: 'Dexterity',
      description: 'Agility and reflexes',
      minValue: 0,
      maxValue: 15,
      baseValue: 7,
    },
  ]);

  const [skills] = useState<WorldSkill[]>([
    {
      id: 'skill-1' as EntityID,
      worldId: 'world-test' as EntityID,
      name: 'Athletics',
      description: 'Physical activities and sports',
      linkedAttributeId: 'attr-1' as EntityID,
      difficulty: 'medium',
      minValue: 1,
      maxValue: 10,
      baseValue: 5,
    },
    {
      id: 'skill-2' as EntityID,
      worldId: 'world-test' as EntityID,
      name: 'Investigation',
      description: 'Finding clues and solving mysteries',
      linkedAttributeId: 'attr-2' as EntityID,
      difficulty: 'hard',
      minValue: 1,
      maxValue: 10,
      baseValue: 5,
    },
    {
      id: 'skill-3' as EntityID,
      worldId: 'world-test' as EntityID,
      name: 'Acrobatics',
      description: 'Nimble movements and balance',
      linkedAttributeId: 'attr-3' as EntityID,
      difficulty: 'easy',
      minValue: 1,
      maxValue: 10,
      baseValue: 5,
    },
  ]);

  const [editingAttribute, setEditingAttribute] = useState<EntityID | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const handleCreateAttribute = (newAttribute: WorldAttribute) => {
    setAttributes([...attributes, newAttribute]);
    setShowCreateModal(false);
  };

  const handleSaveAttribute = (updatedAttribute: WorldAttribute) => {
    setAttributes(
      attributes.map((attr) =>
        attr.id === updatedAttribute.id ? updatedAttribute : attr
      )
    );
    setEditingAttribute(null);
  };

  const handleDeleteAttribute = (attributeId: EntityID) => {
    setAttributes(attributes.filter((attr) => attr.id !== attributeId));
    setEditingAttribute(null);
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Attribute Editor Test Harness</h1>
      
      <div className="mb-6">
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
        >
          Create New Attribute
        </button>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Existing Attributes</h2>
        {attributes.map((attribute) => (
          <div
            key={attribute.id}
            className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
          >
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-semibold text-lg">{attribute.name}</h3>
                <p className="text-gray-600">{attribute.description}</p>
                <div className="mt-2 text-sm text-gray-500">
                  Range: {attribute.minValue} - {attribute.maxValue}
                </div>
                {skills.some(skill => skill.linkedAttributeId === attribute.id) && (
                  <div className="mt-2">
                    <span className="text-sm font-medium text-yellow-600">
                      Linked Skills: 
                    </span>
                    <span className="text-sm text-gray-600 ml-1">
                      {skills
                        .filter(skill => skill.linkedAttributeId === attribute.id)
                        .map(skill => skill.name)
                        .join(', ')}
                    </span>
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setEditingAttribute(attribute.id)}
                  className="px-3 py-1 text-blue-600 border border-blue-600 rounded hover:bg-blue-50"
                >
                  Edit
                </button>
                <button
                  onClick={() => {
                    if (confirm(`Delete "${attribute.name}"?`)) {
                      handleDeleteAttribute(attribute.id);
                    }
                  }}
                  className="px-3 py-1 text-red-600 border border-red-600 rounded hover:bg-red-50"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <AttributeEditor
              worldId={'world-test' as EntityID}
              mode="create"
              onSave={handleCreateAttribute}
              onCancel={() => setShowCreateModal(false)}
              existingAttributes={attributes}
              existingSkills={skills}
            />
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingAttribute && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <AttributeEditor
              worldId={'world-test' as EntityID}
              mode="edit"
              attributeId={editingAttribute}
              onSave={handleSaveAttribute}
              onDelete={handleDeleteAttribute}
              onCancel={() => setEditingAttribute(null)}
              existingAttributes={attributes}
              existingSkills={skills}
            />
          </div>
        </div>
      )}
    </div>
  );
}