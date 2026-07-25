import React from 'react';
import { ActionButtonGroup } from '@/components/shared/ActionButtonGroup';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { LoadingState } from '@/components/ui/LoadingState';
import { SimpleModal } from '@/components/shared/SimpleModal';
import { safeTrim } from '@/lib/utils';
import './GenerateCharacterDialog.css';

interface GenerateCharacterDialogProps {
  isOpen: boolean;
  isGenerating: boolean;
  generatingStatus: string;
  characterName: string;
  generationType: 'known' | 'original' | 'specific';
  worldName: string;
  error: string | null;
  onClose: () => void;
  onGenerate: () => void;
  onCharacterNameChange: (name: string) => void;
  onGenerationTypeChange: (type: 'known' | 'original' | 'specific') => void;
}

const GENERATION_TYPE_OPTIONS: Array<{
  value: 'known' | 'original' | 'specific';
  label: string;
  description: (worldName: string) => string;
}> = [
  {
    value: 'known',
    label: 'Known Figure',
    description: (worldName) => `Generate a major character from ${worldName}`,
  },
  {
    value: 'original',
    label: 'Original Character',
    description: () => 'Create a unique character that fits the world',
  },
  {
    value: 'specific',
    label: 'Specific Known Figure',
    description: (worldName) => `Generate a specific character from ${worldName} lore`,
  },
];

export const GenerateCharacterDialog: React.FC<
  GenerateCharacterDialogProps
> = ({
  isOpen,
  isGenerating,
  generatingStatus,
  characterName,
  generationType,
  worldName,
  error,
  onClose,
  onGenerate,
  onCharacterNameChange,
  onGenerationTypeChange,
}) => {
  return (
    <SimpleModal
      isOpen={isOpen}
      onClose={onClose}
      title="Generate Character"
      showCloseButton={false}
      ariaDescribedBy="generate-character-desc"
      footer={
        <ActionButtonGroup
          layout="horizontal"
          gap="md"
          actions={[
            {
              label: 'Cancel',
              onClick: onClose,
              variant: 'secondary',
              disabled: isGenerating,
            },
            {
              label: isGenerating ? 'Generating...' : 'Generate',
              onClick: onGenerate,
              variant: 'primary',
              disabled:
                isGenerating ||
                (generationType === 'specific' && !safeTrim(characterName)),
              flex: true,
            },
          ]}
        />
      }
    >
      <div className="component-generate-character-dialog">
        <p id="generate-character-desc" className="form-help-text">
          Choose the type of character you want to generate for your story.
        </p>

        {/* Generation Type Selection */}
        <div className="generate-character-field">
          <Label>What type of character would you like to create?</Label>
          <RadioGroup
            value={generationType}
            onValueChange={(value) =>
              onGenerationTypeChange(value as 'known' | 'original' | 'specific')
            }
            disabled={isGenerating}
          >
            {GENERATION_TYPE_OPTIONS.map((option) => (
              <label key={option.value} className="generate-character-option">
                <RadioGroupItem value={option.value} id={option.value} />
                <div className="generate-character-option-text">
                  <div className="generate-character-option-label">
                    {option.label}
                  </div>
                  <div className="generate-character-option-description">
                    {option.description(worldName)}
                  </div>
                </div>
              </label>
            ))}
          </RadioGroup>
        </div>

        {/* Name Input (only shown for specific type) */}
        {generationType === 'specific' && (
          <div className="generate-character-field">
            <Label htmlFor="generate-character-name">
              Character Name <span>*</span>
            </Label>
            <Input
              id="generate-character-name"
              type="text"
              value={characterName}
              onChange={(e) => onCharacterNameChange(e.target.value)}
              placeholder="e.g., Aragorn, Princess Leia, Sherlock Holmes..."
              disabled={isGenerating}
            />
            <p className="form-help-text">
              Enter the name of a known character from {worldName} lore
            </p>
          </div>
        )}

        {error && <div className="form-error">{error}</div>}

        {isGenerating && (
          <div className="generate-character-status">
            <LoadingState variant="spinner" size="sm" />
            <span>{generatingStatus}</span>
          </div>
        )}
      </div>
    </SimpleModal>
  );
};
