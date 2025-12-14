import React from 'react';
import { WorldSettings, DEFAULT_LORE_VALIDATION } from '@/types/world.types';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
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

  const handleLoreValidationToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({
      ...settings,
      loreValidation: {
        ...(settings.loreValidation || DEFAULT_LORE_VALIDATION),
        enabled: e.target.checked,
      },
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

      {/* Lore Validation Section */}
      <section className="p-6 bg-background rounded-lg border">
        <h3 className="text-xl font-semibold mb-4">Lore Validation</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Experimental feature that validates narrative segments against established lore to detect contradictions.
        </p>

        <div className="space-y-4">
          <div className="flex items-start space-x-3">
            <Checkbox
              id="loreValidationEnabled"
              checked={settings.loreValidation?.enabled ?? false}
              onChange={handleLoreValidationToggle}
              className="mt-1"
            />
            <div className="flex-1">
              <Label
                htmlFor="loreValidationEnabled"
                className="text-base font-medium cursor-pointer"
              >
                Enable lore validation
              </Label>
              <p className="text-sm text-muted-foreground mt-1">
                Validates each narrative segment against character traits, world rules, historical events, and locations.
                Adds ~1-2 seconds and ~1,300 tokens per segment. Contradictions are flagged but never block generation.
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                <strong>Note:</strong> Only the basic enable/disable toggle is implemented.
                Advanced controls (validation frequency, strictness) are coming in future updates.
              </p>
            </div>
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
