import React, { useState } from 'react';
import { Image as ImageIcon, Trash } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { formatDate } from '@/lib/utils';

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
  defaultCustomPromptChecked?: boolean; // Whether the custom prompt checkbox should be checked by default
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
  className = "",
  defaultCustomPromptChecked = !!currentPrompt
}) => {
  // Separate user input from API-returned prompts
  const [showCustomPrompt, setShowCustomPrompt] = useState(defaultCustomPromptChecked);
  const [userCustomPrompt, setUserCustomPrompt] = useState(''); // Only user input, never auto-populated
  const [hasUserCustomization, setHasUserCustomization] = useState(false); // Track if user has made customizations

  const handleGenerate = () => {
    onGenerate(showCustomPrompt && userCustomPrompt ? userCustomPrompt : undefined);
  };

  const handleUndoCustomization = () => {
    setUserCustomPrompt('');
    setShowCustomPrompt(false);
    setHasUserCustomization(false);
  };

  const handleCustomPromptChange = (value: string) => {
    setUserCustomPrompt(value);
    setHasUserCustomization(value.length > 0);
  };

  const handleCustomPromptToggle = (checked: boolean) => {
    setShowCustomPrompt(checked);
    if (checked && userCustomPrompt.length > 0) {
      setHasUserCustomization(true);
    }
  };

  const hasImage = currentImageType === 'ai-generated' && currentImageUrl;

  return (
    <div className={`bg-white rounded-lg shadow p-6 ${className}`}>
      <h2 className="text-xl font-bold mb-4">{title}</h2>
      <div className="flex items-start gap-6">
        <div className="flex-shrink-0">
          {imageComponent}
        </div>
        <div className="flex-1">
          <p className="text-gray-700 mb-4">
            {hasImage ? description : `No ${title.toLowerCase()} has been generated yet.`}
          </p>
          
          {/* Custom prompt toggle */}
          <div className="mb-4">
            <div className="flex items-center justify-between">
              <Checkbox
                checked={showCustomPrompt}
                onChange={(e) => handleCustomPromptToggle(e.target.checked)}
                label={customPromptLabel}
              />
              {/* Undo button - only show if user has made customizations */}
              {hasUserCustomization && (
                <Button
                  variant="link"
                  size="sm"
                  onClick={handleUndoCustomization}
                  className="text-xs h-auto p-0"
                >
                  Undo customizations
                </Button>
              )}
            </div>
          </div>
          
          {/* Custom prompt textarea */}
          {showCustomPrompt && (
            <div className="mb-4">
              <Textarea
                value={userCustomPrompt}
                onChange={(e) => handleCustomPromptChange(e.target.value)}
                placeholder={customPromptPlaceholder}
                rows={3}
                className="text-sm"
              />
              <p className="text-xs text-gray-500 mt-1">
                {customPromptHelpText}
              </p>
            </div>
          )}
          
          <div className="flex gap-2">
            <Button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="flex items-center gap-2"
            >
              {isGenerating ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Generating...
                </>
              ) : (
                <>
                  <ImageIcon className="w-5 h-5" aria-hidden="true" />
                  {hasImage ? regenerateButtonText : generateButtonText}
                </>
              )}
            </Button>
            {hasImage && (
              <Button
                variant="destructive"
                onClick={onRemove}
                className="flex items-center gap-2"
              >
                <Trash className="w-5 h-5" aria-hidden="true" />
                {removeButtonText}
              </Button>
            )}
          </div>
          {generatedAt && (
            <p className="text-sm text-gray-500 mt-2">
              Generated: {formatDate(generatedAt)}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
