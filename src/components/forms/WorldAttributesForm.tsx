import React, { useState } from 'react';
import { WorldAttribute, WorldSkill } from '@/types/world.types';
import { EntityID } from '@/types/common.types';
import { AttributeEditor } from '@/components/world/AttributeEditor';

interface WorldAttributesFormProps {
  attributes: WorldAttribute[];
  skills?: WorldSkill[];
  worldId: string;
  onChange: (attributes: WorldAttribute[]) => void;
}

const WorldAttributesForm: React.FC<WorldAttributesFormProps> = ({ 
  attributes, 
  skills = [],
  worldId, 
  onChange 
}) => {
  const [editingAttribute, setEditingAttribute] = useState<EntityID | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  // Handle creating a new attribute
  const handleCreateAttribute = (newAttribute: WorldAttribute) => {
    onChange([...attributes, { ...newAttribute, worldId }]);
    setShowCreateModal(false);
  };
  
  // Handle updating an existing attribute
  const handleSaveAttribute = (updatedAttribute: WorldAttribute) => {
    const index = attributes.findIndex(attr => attr.id === updatedAttribute.id);
    if (index !== -1) {
      const updatedAttributes = [...attributes];
      updatedAttributes[index] = { ...updatedAttribute, worldId };
      onChange(updatedAttributes);
    }
    setEditingAttribute(null);
  };
  
  // Handle deleting an attribute
  const handleDeleteAttribute = (attributeId: EntityID) => {
    const updatedAttributes = attributes.filter(attr => attr.id !== attributeId);
    onChange(updatedAttributes);
    setEditingAttribute(null);
  };
  
  
  return (
    <section className="p-4 bg-white rounded shadow">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Attributes</h2>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
        >
          Add Attribute
        </button>
      </div>
      
      {attributes.length === 0 ? (
        <p className="text-gray-500 italic">No attributes defined yet.</p>
      ) : (
        <div className="space-y-6">
          {attributes.map((attribute) => (
            <div key={attribute.id} className="p-3 border border-gray-200 rounded">
              <div className="flex justify-between mb-2">
                <h3 className="font-medium">{attribute.name}</h3>
                <div className="flex gap-2">
                  <button
                    onClick={() => setEditingAttribute(attribute.id)}
                    className="text-blue-600 hover:text-blue-800 text-sm"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`Are you sure you want to delete "${attribute.name}"?`)) {
                        handleDeleteAttribute(attribute.id);
                      }
                    }}
                    className="text-red-600 hover:text-red-800 text-sm"
                  >
                    Delete
                  </button>
                </div>
              </div>
              
              <div className="space-y-2">
                <p className="text-sm text-gray-600">{attribute.description}</p>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Range:</span> {attribute.minValue} - {attribute.maxValue}
                  </div>
                  {attribute.category && (
                    <div>
                      <span className="font-medium">Category:</span> {attribute.category}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <AttributeEditor
              worldId={worldId as EntityID}
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
              worldId={worldId as EntityID}
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
    </section>
  );
};

export default WorldAttributesForm;