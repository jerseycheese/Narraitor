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
      size="md"
      className="max-w-md"
    >
      <p className="text-sm text-gray-700 mb-6">
        Choose the type of character you want to generate for your story.
      </p>
        
        <div className="space-y-4">
          {/* Generation Type Selection */}
          <div>
            <Label className="block text-sm font-medium text-foreground mb-2">
              What type of character would you like to create?
            </Label>
            <RadioGroup
              value={generationType}
              onValueChange={(value) => onGenerationTypeChange(value as 'known' | 'original' | 'specific')}
              disabled={isGenerating}
              className="space-y-2"
            >
              <div className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-muted">
                <RadioGroupItem value="known" id="known" className="mr-3" />
                <div>
                  <div className="font-medium">Known Figure</div>
                  <div className="text-sm text-muted-foreground">Generate a major character from {worldName}</div>
                </div>
              </div>
              <div className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-muted">
                <RadioGroupItem value="original" id="original" className="mr-3" />
                <div>
                  <div className="font-medium">Original Character</div>
                  <div className="text-sm text-muted-foreground">Create a unique character that fits the world</div>
                </div>
              </div>
              <div className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-muted">
                <RadioGroupItem value="specific" id="specific" className="mr-3" />
                <div>
                  <div className="font-medium">Specific Known Figure</div>
                  <div className="text-sm text-muted-foreground">Generate a specific character from {worldName} lore</div>
                </div>
              </div>
            </RadioGroup>
          </div>
          
          {/* Name Input (only shown for specific type) */}
          {generationType === 'specific' && (
            <div className="space-y-2">
              <Label>
                Character Name <span className="text-destructive">*</span>
              </Label>
              <Input
                type="text"
                value={characterName}
                onChange={(e) => onCharacterNameChange(e.target.value)}
                placeholder="e.g., Aragorn, Princess Leia, Sherlock Holmes..."
                disabled={isGenerating}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Enter the name of a known character from {worldName} lore
              </p>
            </div>
          )}
        </div>
        
        {error && (
          <div className="text-destructive text-sm">{error}</div>
        )}
        
        {isGenerating && (
          <div className="text-primary text-sm flex items-center gap-2">
            <span className="inline-block w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></span>
            {generatingStatus}
          </div>
        )}
        
        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 mt-6">
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
