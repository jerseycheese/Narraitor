import React, { useState } from 'react';

interface ImageGenerationSectionProps {
  title: string;
  description: string;
  currentImageUrl?: string | null;
  currentImageType?: 'ai-generated' | 'placeholder';
  generatedAt?: string;
  currentPrompt?: string; // The prompt that was used to generate the current image
  isGenerating: boolean;
  onGenerate: (customPrompt?: string) => void;
  onRemove: () => void;
  customPromptLabel?: string;
  customPromptPlaceholder?: string;
  customPromptHelpText?: string;
  generateButtonText?: string;
  regenerateButtonText?: string;
  removeButtonText?: string;
  imageComponent: React.ReactNode;
  className?: string;
}

export const ImageGenerationSection: React.FC<ImageGenerationSectionProps> = ({
  title,
  description,
  currentImageUrl,
  currentImageType = 'placeholder',
  generatedAt,
  currentPrompt,
  isGenerating,
  onGenerate,
  onRemove,
  customPromptLabel = "Customize description for generation",
  customPromptPlaceholder = "Describe specific visual details...",
  customPromptHelpText = "This will override the auto-generated prompt for this generation only",
  generateButtonText = "Generate Image",
  regenerateButtonText = "Regenerate Image",
  removeButtonText = "Remove Image",
  imageComponent,
  className = ""
}) => {
  // Initialize state based on whether there's an existing prompt
  const [showCustomPrompt, setShowCustomPrompt] = useState(!!currentPrompt);
  const [customPrompt, setCustomPrompt] = useState(currentPrompt || '');

  const handleGenerate = () => {
    onGenerate(showCustomPrompt && customPrompt ? customPrompt : undefined);
  };

  // Update local state when currentPrompt changes from props
  React.useEffect(() => {
    if (currentPrompt) {
      setCustomPrompt(currentPrompt);
      setShowCustomPrompt(true);
    }
  }, [currentPrompt]);

  const hasImage = currentImageType === 'ai-generated' && currentImageUrl;

  return (
    <div className={`bg-white rounded-lg shadow p-6 ${className}`}>
      <h2 className="text-xl font-bold mb-4">{title}</h2>
      <div className="flex items-start gap-6">
        <div className="flex-shrink-0">
          {imageComponent}
        </div>
        <div className="flex-1">
          <p className="text-gray-600 mb-4">
            {hasImage ? description : `No ${title.toLowerCase()} has been generated yet.`}
          </p>
          
          {/* Custom prompt toggle */}
          <div className="mb-4">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={showCustomPrompt}
                onChange={(e) => setShowCustomPrompt(e.target.checked)}
                className="rounded border-gray-300"
              />
              <span>{customPromptLabel}</span>
            </label>
          </div>
          
          {/* Custom prompt textarea */}
          {showCustomPrompt && (
            <div className="mb-4">
              <textarea
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                placeholder={customPromptPlaceholder}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
              />
              <p className="text-xs text-gray-500 mt-1">
                {customPromptHelpText}
              </p>
            </div>
          )}
          
          <div className="flex gap-2">
            <button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center gap-2"
            >
              {isGenerating ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Generating...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  {hasImage ? regenerateButtonText : generateButtonText}
                </>
              )}
            </button>
            {hasImage && (
              <button
                onClick={onRemove}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 cursor-pointer flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                {removeButtonText}
              </button>
            )}
          </div>
          {generatedAt && (
            <p className="text-sm text-gray-500 mt-2">
              Generated: {new Date(generatedAt).toLocaleDateString()}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};