import React, { useState } from 'react';
import { World } from '@/types/world.types';
import { GeneratedImage } from '@/types/common.types';
import { WorldImageGenerator } from '@/lib/ai/worldImageGenerator';
import { ImageGenerationSection } from '@/components/shared';
import { WorldImage as WorldImageComponent } from '@/components/WorldImage';
import { getTimestamp } from '@/lib/utils';

interface WorldImageFormProps {
  world: World;
  onChange: (updates: Partial<World>) => void;
}

const WorldImageForm: React.FC<WorldImageFormProps> = ({ world, onChange }) => {
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerateImage = async (customPrompt?: string) => {
    setIsGenerating(true);

    try {
      const imageGenerator = new WorldImageGenerator();

      const image = await imageGenerator.generateWorldImage(world, customPrompt);
      
      onChange({ image });
    } catch (err) {
      throw err; // Let ImageGenerationSection handle the error display
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRemoveImage = () => {
    const placeholderImage: GeneratedImage = {
      type: 'placeholder',
      url: null,
      generatedAt: getTimestamp()
    };

    onChange({ image: placeholderImage });
  };

  return (
    <ImageGenerationSection
      title="World Image"
      description="AI-generated environmental image that represents your world. This will be displayed on world cards and as a hero image on the world details page."
      currentImageUrl={world.image?.url}
      currentImageType={world.image?.type}
      generatedAt={world.image?.generatedAt}
      currentPrompt={world.image?.prompt}
      isGenerating={isGenerating}
      onGenerate={handleGenerateImage}
      onRemove={handleRemoveImage}
      customPromptLabel="Customize description for world image generation"
      customPromptPlaceholder="Describe the specific visual elements you want in the world image (landscape, architecture, atmosphere, etc.)"
      customPromptHelpText="This will override the auto-generated prompt based on world details for this generation only"
      generateButtonText="Generate World Image"
      regenerateButtonText="Regenerate World Image"
      removeButtonText="Remove World Image"
      imageComponent={
        <WorldImageComponent
          image={world.image || { type: 'placeholder', url: null }}
          worldName={world.name}
          size="large"
        />
      }
    />
  );
};

export default WorldImageForm;
