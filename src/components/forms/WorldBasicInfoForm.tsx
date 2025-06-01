import React from 'react';
import { World } from '@/types/world.types';

interface WorldBasicInfoFormProps {
  world: World;
  onChange: (updates: Partial<World>) => void;
}

const WorldBasicInfoForm: React.FC<WorldBasicInfoFormProps> = ({ world, onChange }) => {
  return (
    <section className="p-4 bg-white rounded shadow">
      <h2 className="text-xl font-semibold mb-4">Basic Information</h2>
      
      <div className="space-y-4">
        <div>
          <label htmlFor="worldName" className="block text-sm font-medium text-gray-700 mb-1">
            Name
          </label>
          <input
            id="worldName"
            type="text"
            value={world.name}
            onChange={(e) => onChange({ name: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded"
          />
        </div>
        
        <div>
          <label htmlFor="worldDescription" className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <textarea
            id="worldDescription"
            value={world.description}
            onChange={(e) => onChange({ description: e.target.value })}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded"
          />
        </div>
        
        <div>
          <label htmlFor="worldTheme" className="block text-sm font-medium text-gray-700 mb-1">
            Theme
          </label>
          <input
            id="worldTheme"
            type="text"
            value={world.theme}
            onChange={(e) => onChange({ theme: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded"
          />
        </div>
      </div>
    </section>
  );
};

export default WorldBasicInfoForm;