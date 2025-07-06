import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

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
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <h2 className="text-xl font-bold mb-4">Generate Character</h2>
        <div className="space-y-4">
          {/* Generation Type Selection */}
          <div>
            <Label className="block text-sm font-medium text-gray-700 mb-2">
              What type of character would you like to create?
            </Label>
            <RadioGroup
              value={generationType}
              onValueChange={(value) => onGenerationTypeChange(value as 'known' | 'original' | 'specific')}
              disabled={isGenerating}
              className="space-y-2"
            >
              <div className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                <RadioGroupItem value="known" id="known" className="mr-3" />
                <div>
                  <div className="font-medium">Known Figure</div>
                  <div className="text-sm text-gray-600">Generate a major character from {worldName}</div>
                </div>
              </div>
              <div className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                <RadioGroupItem value="original" id="original" className="mr-3" />
                <div>
                  <div className="font-medium">Original Character</div>
                  <div className="text-sm text-gray-600">Create a unique character that fits the world</div>
                </div>
              </div>
              <div className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                <RadioGroupItem value="specific" id="specific" className="mr-3" />
                <div>
                  <div className="font-medium">Specific Known Figure</div>
                  <div className="text-sm text-gray-600">Generate a specific character from {worldName} lore</div>
                </div>
              </div>
            </RadioGroup>
          </div>
          
          {/* Name Input (only shown for specific type) */}
          {generationType === 'specific' && (
            <div className="space-y-2">
              <Label>
                Character Name <span className="text-red-500">*</span>
              </Label>
              <Input
                type="text"
                value={characterName}
                onChange={(e) => onCharacterNameChange(e.target.value)}
                placeholder="e.g., Aragorn, Princess Leia, Sherlock Holmes..."
                disabled={isGenerating}
              />
              <p className="text-xs text-gray-500 mt-1">
                Enter the name of a known character from {worldName} lore
              </p>
            </div>
          )}
        </div>
        {error && (
          <p className="text-red-600 text-sm mt-4">{error}</p>
        )}
        {isGenerating && (
          <p className="text-purple-600 text-sm mt-4 flex items-center gap-2">
            <span className="inline-block w-4 h-4 border-2 border-purple-600 border-t-transparent rounded-full animate-spin"></span>
            {generatingStatus}
          </p>
        )}
        <div className="flex justify-end gap-2 mt-6">
          <Button
            onClick={onClose}
            disabled={isGenerating}
            variant="outline"
          >
            Cancel
          </Button>
          <Button
            onClick={onGenerate}
            disabled={isGenerating || (generationType === 'specific' && !characterName.trim())}
            className="bg-purple-600 text-white hover:bg-purple-700"
          >
            {isGenerating ? 'Generating...' : 'Generate'}
          </Button>
        </div>
      </div>
    </div>
  );
};
