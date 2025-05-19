import React from 'react';
import { WorldAttribute } from '@/types/world.types';
import { generateUniqueId } from '@/lib/utils/generateId';

interface WorldAttributesFormProps {
  attributes: WorldAttribute[];
  worldId: string;
  onChange: (attributes: WorldAttribute[]) => void;
}

const WorldAttributesForm: React.FC<WorldAttributesFormProps> = ({ 
  attributes, 
  worldId, 
  onChange 
}) => {
  // Add a new attribute
  const handleAddAttribute = () => {
    const newAttribute: WorldAttribute = {
      id: generateUniqueId('attr'),
      worldId,
      name: 'New Attribute',
      description: 'Description of the new attribute',
      baseValue: 10,
      minValue: 1,
      maxValue: 20,
    };
    
    onChange([...attributes, newAttribute]);
  };
  
  // Update an attribute
  const handleUpdateAttribute = (index: number, updates: Partial<WorldAttribute>) => {
    const updatedAttributes = [...attributes];
    updatedAttributes[index] = { ...updatedAttributes[index], ...updates };
    onChange(updatedAttributes);
  };
  
  // Remove an attribute
  const handleRemoveAttribute = (index: number) => {
    const updatedAttributes = attributes.filter((_, i) => i !== index);
    onChange(updatedAttributes);
  };
  
  return (
    <section className="p-4 bg-white rounded shadow">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Attributes</h2>
        <button
          onClick={handleAddAttribute}
          className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
        >
          Add Attribute
        </button>
      </div>
      
      {attributes.length === 0 ? (
        <p className="text-gray-500 italic">No attributes defined yet.</p>
      ) : (
        <div className="space-y-6">
          {attributes.map((attribute, index) => (
            <div key={attribute.id} className="p-3 border border-gray-200 rounded">
              <div className="flex justify-between mb-2">
                <h3 className="font-medium">{attribute.name}</h3>
                <button
                  onClick={() => handleRemoveAttribute(index)}
                  className="text-red-600 hover:text-red-800"
                >
                  Remove
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Name
                  </label>
                  <input
                    type="text"
                    value={attribute.name}
                    onChange={(e) => handleUpdateAttribute(index, { name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category
                  </label>
                  <input
                    type="text"
                    value={attribute.category || ''}
                    onChange={(e) => handleUpdateAttribute(index, { category: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={attribute.description}
                    onChange={(e) => handleUpdateAttribute(index, { description: e.target.value })}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded"
                  />
                </div>
                
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Base
                    </label>
                    <input
                      type="number"
                      value={attribute.baseValue}
                      onChange={(e) => handleUpdateAttribute(index, { baseValue: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Min
                    </label>
                    <input
                      type="number"
                      value={attribute.minValue}
                      onChange={(e) => handleUpdateAttribute(index, { minValue: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Max
                    </label>
                    <input
                      type="number"
                      value={attribute.maxValue}
                      onChange={(e) => handleUpdateAttribute(index, { maxValue: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded"
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};

export default WorldAttributesForm;