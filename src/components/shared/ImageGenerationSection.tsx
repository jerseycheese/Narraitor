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
  currentImageType?: 'ai-generated' | 'placeholder' | 'preset' | 'uploaded';
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
  error?: string | null; // Inline error message for generation failures
  headingLevel?: 'h2' | 'h3' | 'h4'; // Heading element for the title, to fit the surrounding heading order
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
  defaultCustomPromptChecked = !!currentPrompt,
  error = null,
  headingLevel: HeadingTag = 'h2'
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

  const hasImage = currentImageType !== 'placeholder' && Boolean(currentImageUrl);

  return (
    <div className={`${className}`}>
      {title && <HeadingTag>{title}</HeadingTag>}
      <div>
        <div>
          {imageComponent}
        </div>
        <div>
          <p>
            {hasImage ? description : `No ${title.toLowerCase()} has been generated yet.`}
          </p>
          
          {/* Custom prompt toggle */}
          <div>
            <div>
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
                  
                >
                  Undo customizations
                </Button>
              )}
            </div>
          </div>
          
          {/* Custom prompt textarea */}
          {showCustomPrompt && (
            <div>
              <Textarea
                value={userCustomPrompt}
                onChange={(e) => handleCustomPromptChange(e.target.value)}
                placeholder={customPromptPlaceholder}
                rows={3}
                aria-label={customPromptLabel}
              />
              <p>
                {customPromptHelpText}
              </p>
            </div>
          )}
          
          <div className="action-button-group" data-layout="horizontal" data-gap="sm">
            <Button
              onClick={handleGenerate}
              disabled={isGenerating}

            >
              {isGenerating ? (
                <>
                  <div />
                  Generating...
                </>
              ) : (
                <>
                  <ImageIcon aria-hidden="true" />
                  {hasImage ? regenerateButtonText : generateButtonText}
                </>
              )}
            </Button>
            {hasImage && (
              <Button
                variant="destructive"
                onClick={onRemove}
                
              >
                <Trash aria-hidden="true" />
                {removeButtonText}
              </Button>
            )}
          </div>

          {/* Error display */}
          {error && (
            <div>
              <p>{error}</p>
            </div>
          )}

          {generatedAt && (
            <p className="image-generation-generated-at">
              Generated: {formatDate(generatedAt)}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
