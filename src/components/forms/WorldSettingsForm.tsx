import React from 'react';
import { WorldSettings } from '@/types/world.types';

interface WorldSettingsFormProps {
  settings: WorldSettings;
  onChange: (settings: WorldSettings) => void;
}

const WorldSettingsForm: React.FC<WorldSettingsFormProps> = ({ settings, onChange }) => {
  const handleChange = (field: keyof WorldSettings, value: number) => {
    onChange({
      ...settings,
      [field]: value
    });
  };
  
  return (
    <section className="p-4 bg-white rounded shadow">
      <h2 className="text-xl font-semibold mb-4">World Settings</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="maxAttributes" className="block text-sm font-medium text-gray-700 mb-1">
            Maximum Attributes
          </label>
          <input
            id="maxAttributes"
            type="number"
            value={settings.maxAttributes}
            onChange={(e) => handleChange('maxAttributes', parseInt(e.target.value))}
            min={1}
            className="w-full px-3 py-2 border border-gray-300 rounded"
          />
        </div>
        
        <div>
          <label htmlFor="maxSkills" className="block text-sm font-medium text-gray-700 mb-1">
            Maximum Skills
          </label>
          <input
            id="maxSkills"
            type="number"
            value={settings.maxSkills}
            onChange={(e) => handleChange('maxSkills', parseInt(e.target.value))}
            min={1}
            className="w-full px-3 py-2 border border-gray-300 rounded"
          />
        </div>
        
        <div>
          <label htmlFor="attributePointPool" className="block text-sm font-medium text-gray-700 mb-1">
            Attribute Point Pool
          </label>
          <input
            id="attributePointPool"
            type="number"
            value={settings.attributePointPool}
            onChange={(e) => handleChange('attributePointPool', parseInt(e.target.value))}
            min={1}
            className="w-full px-3 py-2 border border-gray-300 rounded"
          />
        </div>
        
        <div>
          <label htmlFor="skillPointPool" className="block text-sm font-medium text-gray-700 mb-1">
            Skill Point Pool
          </label>
          <input
            id="skillPointPool"
            type="number"
            value={settings.skillPointPool}
            onChange={(e) => handleChange('skillPointPool', parseInt(e.target.value))}
            min={1}
            className="w-full px-3 py-2 border border-gray-300 rounded"
          />
        </div>
      </div>
    </section>
  );
};

export default WorldSettingsForm;
