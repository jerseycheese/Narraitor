import React from 'react';
import { CharacterPortraitPlaceholder } from '../components/CharacterPortraitPlaceholder';

interface BasicInfoStepProps {
  data: any; // eslint-disable-line @typescript-eslint/no-explicit-any
  onUpdate: (updates: any) => void; // eslint-disable-line @typescript-eslint/no-explicit-any
  onValidation: (valid: boolean, errors: string[]) => void;
  worldConfig: any; // eslint-disable-line @typescript-eslint/no-explicit-any
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

  const handleBlur = () => {
    // Validation will be triggered by parent component
  };

  const validation = data.validation[0];
  const showErrors = validation?.touched && !validation?.valid;

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-6">
        {/* Portrait placeholder */}
        <div className="flex-shrink-0">
          <CharacterPortraitPlaceholder name={data.characterData.name} />
        </div>

        {/* Form fields */}
        <div className="flex-1 space-y-4">
          <div>
            <label htmlFor="character-name" className="block text-sm font-medium text-gray-700 mb-1">
              Character Name
            </label>
            <input
              id="character-name"
              type="text"
              value={data.characterData.name}
              onChange={handleNameChange}
              onBlur={handleBlur}
              maxLength={50}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter character name"
            />
            {showErrors && validation.errors.map((error: string, index: number) => (
              <p key={index} className="mt-1 text-sm text-red-600">
                {error}
              </p>
            ))}
          </div>

          <div>
            <label htmlFor="character-description" className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              id="character-description"
              value={data.characterData.description}
              onChange={handleDescriptionChange}
              onBlur={handleBlur}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Describe your character"
            />
          </div>
        </div>
      </div>

      <div className="bg-blue-50 p-4 rounded">
        <p className="text-sm text-blue-800">
          Choose a unique name for your character. The name should be between 3 and 50 characters 
          and must be unique within this world.
        </p>
      </div>
    </div>
  );
};