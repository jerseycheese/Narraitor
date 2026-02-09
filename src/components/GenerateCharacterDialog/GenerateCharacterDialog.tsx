import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { SimpleModal } from '@/components/shared/SimpleModal';
import { safeTrim } from '@/lib/utils';


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

export const GenerateCharacterDialog: React.FC<GenerateCharacterDialogProps> = ({
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
      size="xl"
      ariaDescribedBy="generate-character-desc"
    >
      <p id="generate-character-desc" >
        Choose the type of character you want to generate for your story.
      </p>
        
        <div >
          {/* Generation Type Selection */}
          <div>
            <Label >
              What type of character would you like to create?
            </Label>
            <RadioGroup
              value={generationType}
              onValueChange={(value) => onGenerationTypeChange(value as 'known' | 'original' | 'specific')}
              disabled={isGenerating}
              
            >
              <div >
                <RadioGroupItem value="known" id="known"  />
                <div>
                  <div >Known Figure</div>
                  <div >Generate a major character from {worldName}</div>
                </div>
              </div>
              <div >
                <RadioGroupItem value="original" id="original"  />
                <div>
                  <div >Original Character</div>
                  <div >Create a unique character that fits the world</div>
                </div>
              </div>
              <div >
                <RadioGroupItem value="specific" id="specific"  />
                <div>
                  <div >Specific Known Figure</div>
                  <div >Generate a specific character from {worldName} lore</div>
                </div>
              </div>
            </RadioGroup>
          </div>
          
          {/* Name Input (only shown for specific type) */}
          {generationType === 'specific' && (
            <div >
              <Label>
                Character Name <span >*</span>
              </Label>
              <Input
                type="text"
                value={characterName}
                onChange={(e) => onCharacterNameChange(e.target.value)}
                placeholder="e.g., Aragorn, Princess Leia, Sherlock Holmes..."
                disabled={isGenerating}
              />
              <p >
                Enter the name of a known character from {worldName} lore
              </p>
            </div>
          )}
        </div>
        
        {error && (
          <div >{error}</div>
        )}
        
        {isGenerating && (
          <div >
            <span ></span>
            {generatingStatus}
          </div>
        )}
        
        <div >
          <Button
            onClick={onClose}
            disabled={isGenerating}
            variant="outline"
          >
            Cancel
          </Button>
          <Button
            onClick={onGenerate}
            disabled={isGenerating || (generationType === 'specific' && !safeTrim(characterName))}
            variant="default"
          >
            {isGenerating ? 'Generating...' : 'Generate'}
          </Button>
        </div>
    </SimpleModal>
  );
};
