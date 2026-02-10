'use client';

import React, { useState } from 'react';
import { WorldAttribute, WorldSkill } from '@/types/world.types';
import { EntityID } from '@/types/common.types';
import { AttributeEditor } from '@/components/world/AttributeEditor';
import { SimpleModal } from '@/components/shared/SimpleModal';

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
      attributeIds: ['attr-1'] as EntityID[],
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
      attributeIds: ['attr-2'] as EntityID[],
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
      attributeIds: ['attr-3'] as EntityID[],
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
    <div>
      <h1>Attribute Editor Test Harness</h1>
      
            <div>
      
              <button
      
                onClick={() => setShowCreateModal(true)}
      
              >
      
                Create New Attribute
      
              </button>
      
            </div>

      <div>
        <h2>Existing Attributes</h2>
                {attributes.map((attribute) => (
                  <div
                    key={attribute.id}
                  >
            <div>
              <div>
                <h3>{attribute.name}</h3>
                <p>{attribute.description}</p>
                <div>
                  Range: {attribute.minValue} - {attribute.maxValue}
                </div>
                {skills.some(skill => skill.attributeIds?.includes(attribute.id)) && (
                  <div>
                    <span>
                      Linked Skills: 
                    </span>
                    <span>
                      {skills
                        .filter(skill => skill.attributeIds?.includes(attribute.id))
                        .map(skill => skill.name)
                        .join(', ')}
                    </span>
                  </div>
                )}
              </div>
                            <div>
                              <button
                                onClick={() => setEditingAttribute(attribute.id)}
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => {
                                  if (confirm(`Delete "${attribute.name}"?`)) {
                                    handleDeleteAttribute(attribute.id);
                                  }
                                }}
                              >
                                Delete
                              </button>
                            </div>
            </div>
          </div>
        ))}
      </div>

      {/* Create Modal */}
      <SimpleModal 
        isOpen={showCreateModal} 
        onClose={() => setShowCreateModal(false)}
                title="Create Attribute"
                size="xl"
              >
                <div>
                  Create a new custom attribute for this test world.
                </div>
        <AttributeEditor
          worldId={'world-test' as EntityID}
          mode="create"
          onSave={handleCreateAttribute}
          onCancel={() => setShowCreateModal(false)}
          existingAttributes={attributes}
          existingSkills={skills}
        />
      </SimpleModal>

      {/* Edit Modal */}
      <SimpleModal 
        isOpen={!!editingAttribute} 
        onClose={() => setEditingAttribute(null)}
                title="Edit Attribute"
                size="xl"
              >
                <div>
                  Modify the details of this test attribute.
                </div>
        {editingAttribute && (
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
        )}
      </SimpleModal>
    </div>
  );
}
