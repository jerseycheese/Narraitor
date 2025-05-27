import React, { useState } from 'react';
import { CharacterPortrait } from '@/components/CharacterPortrait';

interface Portrait {
  type: 'ai-generated' | 'placeholder';
  url: string | null;
  generatedAt?: string;
}

interface PortraitSectionProps {
  portrait?: Portrait;
  characterName: string;
  generatingPortrait: boolean;
  onGeneratePortrait: (customDescription?: string) => void;
  onRemovePortrait: () => void;
  currentPhysicalDescription?: string;
}

export const PortraitSection: React.FC<PortraitSectionProps> = ({
  portrait,
  characterName,
  generatingPortrait,
  onGeneratePortrait,
  onRemovePortrait,
  currentPhysicalDescription
}) => {
  const [showCustomDescription, setShowCustomDescription] = useState(false);
  const [customDescription, setCustomDescription] = useState(currentPhysicalDescription || '');

  const handleGeneratePortrait = () => {
    onGeneratePortrait(showCustomDescription ? customDescription : undefined);
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-bold mb-4">Character Portrait</h2>
      <div className="flex items-start gap-6">
        <div className="flex-shrink-0">
          <CharacterPortrait
            portrait={portrait || { type: 'placeholder', url: null }}
            characterName={characterName}
            size="large"
          />
        </div>
        <div className="flex-1">
          <p className="text-gray-600 mb-4">
            {portrait?.type === 'ai-generated' 
              ? 'AI-generated portrait based on character details.'
              : 'No portrait has been generated yet.'}
          </p>
          
          {/* Custom description toggle */}
          <div className="mb-4">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={showCustomDescription}
                onChange={(e) => setShowCustomDescription(e.target.checked)}
                className="rounded border-gray-300"
              />
              <span>Customize physical description for portrait generation</span>
            </label>
          </div>
          
          {/* Custom description textarea */}
          {showCustomDescription && (
            <div className="mb-4">
              <textarea
                value={customDescription}
                onChange={(e) => setCustomDescription(e.target.value)}
                placeholder="Describe specific visual details for the portrait (clothing, pose, expression, etc.)"
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
              />
              <p className="text-xs text-gray-500 mt-1">
                This will override the character&apos;s physical description for this portrait generation only
              </p>
            </div>
          )}
          
          <div className="flex gap-2">
            <button
              onClick={handleGeneratePortrait}
              disabled={generatingPortrait}
              className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center gap-2"
            >
              {generatingPortrait ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Generating...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  {portrait?.type === 'ai-generated' ? 'Regenerate Portrait' : 'Generate Portrait'}
                </>
              )}
            </button>
            {portrait?.type === 'ai-generated' && (
              <button
                onClick={onRemovePortrait}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 cursor-pointer flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Remove Portrait
              </button>
            )}
          </div>
          {portrait?.generatedAt && (
            <p className="text-sm text-gray-500 mt-2">
              Generated: {new Date(portrait.generatedAt).toLocaleDateString()}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};