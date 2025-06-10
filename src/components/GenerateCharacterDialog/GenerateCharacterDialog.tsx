import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

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
            <label className="block text-sm font-medium text-gray-700 mb-2">
              What type of character would you like to create?
            </label>
            <div className="space-y-2">
              <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  value="known"
                  checked={generationType === 'known'}
                  onChange={(e) => onGenerationTypeChange(e.target.value as 'known' | 'original' | 'specific')}
                  className="mr-3"
                  disabled={isGenerating}
                />
                <div>
                  <div className="font-medium">Known Figure</div>
                  <div className="text-sm text-gray-600">Generate a major character from {worldName}</div>
                </div>
              </label>
              <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  value="original"
                  checked={generationType === 'original'}
                  onChange={(e) => onGenerationTypeChange(e.target.value as 'known' | 'original' | 'specific')}
                  className="mr-3"
                  disabled={isGenerating}
                />
                <div>
                  <div className="font-medium">Original Character</div>
                  <div className="text-sm text-gray-600">Create a unique character that fits the world</div>
                </div>
              </label>
              <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  value="specific"
                  checked={generationType === 'specific'}
                  onChange={(e) => onGenerationTypeChange(e.target.value as 'known' | 'original' | 'specific')}
                  className="mr-3"
                  disabled={isGenerating}
                />
                <div>
                  <div className="font-medium">Specific Known Figure</div>
                  <div className="text-sm text-gray-600">Generate a specific character from {worldName} lore</div>
                </div>
              </label>
            </div>
          </div>
          
          {/* Name Input (only shown for specific type) */}
          {generationType === 'specific' && (
            <div className="space-y-2">
              <Label>
                Character Name
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
          <button
            onClick={onClose}
            disabled={isGenerating}
            className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-100 cursor-pointer disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onGenerate}
            disabled={isGenerating || (generationType === 'specific' && !characterName.trim())}
            className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isGenerating ? 'Generating...' : 'Generate'}
          </button>
        </div>
      </div>
    </div>
  );
};
