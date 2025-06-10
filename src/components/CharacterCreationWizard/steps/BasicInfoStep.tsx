import React from 'react';
import { CharacterPortraitPlaceholder } from '../components/CharacterPortraitPlaceholder';
import { WizardFormSection } from '@/components/shared/wizard';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { World } from '@/types/world.types';

interface CharacterWizardData {
  characterData: {
    name: string;
    description: string;
    background?: {
      physicalDescription?: string;
      [key: string]: unknown;
    };
    [key: string]: unknown;
  };
  validation: {
    [stepNumber: number]: {
      valid: boolean;
      touched: boolean;
      errors: string[];
    };
  };
}

interface BasicInfoStepProps {
  data: CharacterWizardData;
  onUpdate: (updates: Record<string, unknown>) => void;
  onValidation: (valid: boolean, errors: string[]) => void;
  worldConfig?: World;
}

export const BasicInfoStep: React.FC<BasicInfoStepProps> = ({
  data,
  onUpdate,
}) => {
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onUpdate({ name: e.target.value });
  };

  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onUpdate({ description: e.target.value });
  };

  const handlePhysicalDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onUpdate({ 
      background: {
        ...data.characterData.background,
        physicalDescription: e.target.value
      }
    });
  };


  const handleBlur = () => {
    // Validation will be triggered by parent component
  };

  const validation = data.validation[0];
  const showErrors = validation?.touched && !validation?.valid;

  return (
    <WizardFormSection
      title="Basic Information"
      description="Create your character by providing their name and basic details."
    >
      <div className="flex items-start gap-6">
        {/* Portrait placeholder */}
        <div className="flex-shrink-0">
          <CharacterPortraitPlaceholder name={data.characterData.name} />
        </div>

        {/* Form fields */}
        <div className="flex-1 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="character-name">
              Character Name
            </Label>
            <Input
              id="character-name"
              type="text"
              value={data.characterData.name}
              onChange={handleNameChange}
              onBlur={handleBlur}
              maxLength={50}
              placeholder="Enter character name"
            />
            {showErrors && validation.errors.map((error: string, index: number) => (
              <p key={index} className="text-red-600 text-sm mt-1">
                {error}
              </p>
            ))}
          </div>

          <div className="space-y-2">
            <Label htmlFor="character-description">
              Description
            </Label>
            <Textarea
              id="character-description"
              value={data.characterData.description}
              onChange={handleDescriptionChange}
              onBlur={handleBlur}
              rows={3}
              placeholder="Describe your character's role and background"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="physical-description">
              Physical Description
            </Label>
            <Textarea
              id="physical-description"
              value={data.characterData.background?.physicalDescription || ''}
              onChange={handlePhysicalDescriptionChange}
              onBlur={handleBlur}
              rows={3}
              placeholder="Describe your character's appearance (e.g., tall and muscular, silver hair, blue eyes, wears leather armor)"
            />
            <p className="mt-1 text-sm text-gray-500">
              This will be used to generate your character&apos;s portrait. Tip: Add &quot;looks like [actor name]&quot; to generate a portrait resembling a specific person.
            </p>
          </div>

        </div>
      </div>

      <div className="bg-blue-50 p-4 rounded">
        <p className="text-sm text-blue-800">
          Choose a unique name for your character. The name should be between 3 and 50 characters 
          and must be unique within this world.
        </p>
      </div>
    </WizardFormSection>
  );
};
