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
      <section className="p-6 bg-background rounded-lg border">
        <h3 className="text-xl font-semibold mb-4">World Settings</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="maxAttributes">
              Maximum Attributes
            </Label>
            <p id="maxAttributes-description" className="text-xs text-muted-foreground">Maximum number of attributes characters can have</p>
            <Input
              id="maxAttributes"
              type="number"
              value={settings.maxAttributes}
              onChange={(e) => handleChange('maxAttributes', parseInt(e.target.value))}
              min={1}
              aria-describedby="maxAttributes-description"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="maxSkills">
              Maximum Skills
            </Label>
            <p id="maxSkills-description" className="text-xs text-muted-foreground">Maximum number of skills characters can have</p>
            <Input
              id="maxSkills"
              type="number"
              value={settings.maxSkills}
              onChange={(e) => handleChange('maxSkills', parseInt(e.target.value))}
              min={1}
              aria-describedby="maxSkills-description"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="attributePointPool">
              Attribute Point Pool
            </Label>
            <p id="attributePointPool-description" className="text-xs text-muted-foreground">Total points available to distribute among attributes</p>
            <Input
              id="attributePointPool"
              type="number"
              value={settings.attributePointPool}
              onChange={(e) => handleChange('attributePointPool', parseInt(e.target.value))}
              min={1}
              aria-describedby="attributePointPool-description"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="skillPointPool">
              Skill Point Pool
            </Label>
            <p id="skillPointPool-description" className="text-xs text-muted-foreground">Total points available to distribute among skills</p>
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
