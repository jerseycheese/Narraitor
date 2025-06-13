import React from 'react';
import { WorldSettings } from '@/types/world.types';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ToneSettings } from '@/types/tone-settings.types';
import { ToneSettingsForm } from './ToneSettingsForm';

interface WorldSettingsFormProps {
  settings: WorldSettings;
  toneSettings?: ToneSettings;
  onChange: (settings: WorldSettings) => void;
  onToneSettingsChange?: (toneSettings: ToneSettings) => void;
}

const WorldSettingsForm: React.FC<WorldSettingsFormProps> = ({ 
  settings, 
  toneSettings, 
  onChange, 
  onToneSettingsChange 
}) => {
  const handleChange = (field: keyof WorldSettings, value: number) => {
    onChange({
      ...settings,
      [field]: value
    });
  };
  
  return (
    <div className="space-y-6">
      <section className="p-4 bg-white rounded shadow">
        <h2 className="text-xl font-semibold mb-4">World Settings</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="maxAttributes">
              Maximum Attributes
            </Label>
            <Input
              id="maxAttributes"
              type="number"
              value={settings.maxAttributes}
              onChange={(e) => handleChange('maxAttributes', parseInt(e.target.value))}
              min={1}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="maxSkills">
              Maximum Skills
            </Label>
            <Input
              id="maxSkills"
              type="number"
              value={settings.maxSkills}
              onChange={(e) => handleChange('maxSkills', parseInt(e.target.value))}
              min={1}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="attributePointPool">
              Attribute Point Pool
            </Label>
            <Input
              id="attributePointPool"
              type="number"
              value={settings.attributePointPool}
              onChange={(e) => handleChange('attributePointPool', parseInt(e.target.value))}
              min={1}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="skillPointPool">
              Skill Point Pool
            </Label>
            <Input
              id="skillPointPool"
              type="number"
              value={settings.skillPointPool}
              onChange={(e) => handleChange('skillPointPool', parseInt(e.target.value))}
              min={1}
            />
          </div>
        </div>
      </section>

      {/* Tone Settings Section */}
      {onToneSettingsChange && (
        <ToneSettingsForm
          toneSettings={toneSettings}
          onToneSettingsChange={onToneSettingsChange}
        />
      )}
    </div>
  );
};

export default WorldSettingsForm;
