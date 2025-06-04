import React, { useState } from 'react';
import { World, WorldImage } from '@/types/world.types';
import { createAIClient } from '@/lib/ai';
import { WorldImageGenerator } from '@/lib/ai/worldImageGenerator';
import { ImageGenerationSection } from '@/components/shared';
import { WorldImage as WorldImageComponent } from '@/components/WorldImage';

interface WorldImageFormProps {
  world: World;
  onChange: (updates: Partial<World>) => void;
}

const WorldImageForm: React.FC<WorldImageFormProps> = ({ world, onChange }) => {
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerateImage = async (customPrompt?: string) => {
    setIsGenerating(true);

    try {
      const aiClient = createAIClient();
      const imageGenerator = new WorldImageGenerator(aiClient);
      
      const image = await imageGenerator.generateWorldImage(world, customPrompt);
      
      onChange({ image });
    } catch (err) {
      throw err; // Let ImageGenerationSection handle the error display
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRemoveImage = () => {
    const placeholderImage: WorldImage = {
      type: 'placeholder',
      url: null,
      generatedAt: new Date().toISOString()
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