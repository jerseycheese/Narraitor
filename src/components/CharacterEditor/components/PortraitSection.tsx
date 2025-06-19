import React from 'react';
import { CharacterPortrait } from '@/components/CharacterPortrait';
import { ImageGenerationSection } from '@/components/shared';

interface Portrait {
  type: 'ai-generated' | 'placeholder';
  url: string | null;
  generatedAt?: string;
  prompt?: string;
}

interface PortraitSectionProps {
  portrait?: Portrait;
  characterName: string;
  generatingPortrait: boolean;
  onGeneratePortrait: (customDescription?: string) => void;
  onRemovePortrait: () => void;
}

export const PortraitSection: React.FC<PortraitSectionProps> = ({
  portrait,
  characterName,
  generatingPortrait,
  onGeneratePortrait,
  onRemovePortrait
}) => {
  return (
    <ImageGenerationSection
      title="Character Portrait"
      description="AI-generated portrait based on character details."
      currentImageUrl={portrait?.url}
      currentImageType={portrait?.type}
      generatedAt={portrait?.generatedAt}
      currentPrompt={portrait?.prompt}
      isGenerating={generatingPortrait}
      onGenerate={onGeneratePortrait}
      onRemove={onRemovePortrait}
      customPromptLabel="Customize physical description for portrait generation"
      customPromptPlaceholder="Describe specific visual details for the portrait (clothing, pose, expression, etc.)"
      customPromptHelpText="This will override the character's physical description for this portrait generation only. Tip: Add 'looks like [actor name]' to generate a portrait resembling a specific person."
      generateButtonText="Generate Portrait"
      regenerateButtonText="Regenerate Portrait"
      removeButtonText="Remove Portrait"
      imageComponent={
        <CharacterPortrait
          portrait={portrait || { type: 'placeholder', url: null }}
          characterName={characterName}
          size="large"
        />
      }
    />
  );
};
