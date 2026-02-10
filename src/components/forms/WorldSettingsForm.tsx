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
    <div>
      <section>
        <h3>World Settings</h3>
        
        <div>
          <div>
            <Label htmlFor="maxAttributes">
              Maximum Attributes
            </Label>
            <p id="maxAttributes-description" >Maximum number of attributes characters can have</p>
            <Input
              id="maxAttributes"
              type="number"
              value={settings.maxAttributes}
              onChange={(e) => handleChange('maxAttributes', parseInt(e.target.value))}
              min={1}
              aria-describedby="maxAttributes-description"
            />
          </div>
          
          <div>
            <Label htmlFor="maxSkills">
              Maximum Skills
            </Label>
            <p id="maxSkills-description" >Maximum number of skills characters can have</p>
            <Input
              id="maxSkills"
              type="number"
              value={settings.maxSkills}
              onChange={(e) => handleChange('maxSkills', parseInt(e.target.value))}
              min={1}
              aria-describedby="maxSkills-description"
            />
          </div>
          
          <div>
            <Label htmlFor="attributePointPool">
              Attribute Point Pool
            </Label>
            <p id="attributePointPool-description" >Total points available to distribute among attributes</p>
            <Input
              id="attributePointPool"
              type="number"
              value={settings.attributePointPool}
              onChange={(e) => handleChange('attributePointPool', parseInt(e.target.value))}
              min={1}
              aria-describedby="attributePointPool-description"
            />
          </div>
          
          <div>
            <Label htmlFor="skillPointPool">
              Skill Point Pool
            </Label>
            <p id="skillPointPool-description" >Total points available to distribute among skills</p>
            <Input
              id="skillPointPool"
              type="number"
              value={settings.skillPointPool}
              onChange={(e) => handleChange('skillPointPool', parseInt(e.target.value))}
              min={1}
              aria-describedby="skillPointPool-description"
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
