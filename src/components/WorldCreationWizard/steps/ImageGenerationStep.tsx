'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { World } from '@/types/world.types';
import { GeneratedImage } from '@/types/common.types';
import { WizardFormSection } from '@/components/shared/wizard';
import { WorldImageGenerator } from '@/lib/ai/worldImageGenerator';
import { LoadingState } from '@/components/ui/LoadingState';
import { Image as ImageIcon } from 'lucide-react';
import { ErrorDisplay } from '@/components/ui/ErrorDisplay';
import { Button } from '@/components/ui/button';
import { formatDateTime, getTimestamp } from '@/lib/utils';

interface ImageGenerationStepProps {
  worldData: Partial<World>;
  onUpdate: (updates: Partial<World>) => void;
  onComplete: () => void;
  onBack?: () => void;
  onCancel?: () => void;
  skipGeneration?: boolean;
}

export default function ImageGenerationStep({
  worldData,
  onUpdate,
  onComplete,
  onBack,
  onCancel,
  skipGeneration = false
}: ImageGenerationStepProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedImage, setGeneratedImage] = useState<GeneratedImage | null>(worldData.image || null);

  const generateImage = useCallback(async () => {
    setIsGenerating(true);
    setError(null);

    try {
      const imageGenerator = new WorldImageGenerator();

      const image = await imageGenerator.generateWorldImage(worldData as World);
      
      setGeneratedImage(image);
      onUpdate({ image });
    } catch (err) {
      console.error('Failed to generate world image:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate image');
    } finally {
      setIsGenerating(false);
    }
  }, [worldData, onUpdate]);

  useEffect(() => {
    // Auto-generate image when component mounts if we don't have one
    if (!generatedImage && !skipGeneration && !isGenerating) {
      generateImage();
    }
  }, [generatedImage, skipGeneration, isGenerating, generateImage]);

  const handleSkip = () => {
    // Set a placeholder image
    const placeholderImage: GeneratedImage = {
      type: 'placeholder',
      url: null,
      generatedAt: getTimestamp()
    };

    onUpdate({ image: placeholderImage });
    onComplete();
  };

  const handleRetry = () => {
    generateImage();
  };

  const handleContinue = () => {
    if (generatedImage) {
      onUpdate({ image: generatedImage });
    }
    onComplete();
  };

  return (
    <div data-testid="image-generation-step">
      <WizardFormSection
        title="Generate World Image"
        description="Create a visual representation of your world. This image will be displayed on your world card and as a hero image on the world details page."
      >
        <div className="space-y-6 my-4">
          {/* Preview Area */}
          <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
            {isGenerating ? (
              <div className="h-full flex items-center justify-center">
                <LoadingState message="Generating world image..." />
              </div>
            ) : generatedImage?.url ? (
              <Image 
                src={generatedImage.url} 
                alt={`${worldData.name} world`}
                width={600}
                height={337}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="h-full flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <ImageIcon className="w-16 h-16 mx-auto mb-2" aria-hidden="true" />
                  <p>No image generated yet</p>
                </div>
              </div>
            )}
          </div>

          {/* Error Display */}
          {error && (
            <ErrorDisplay 
              message={error} 
              onRetry={handleRetry}
              className="mt-4"
            />
          )}

          {/* Image Details */}
          {generatedImage && !isGenerating && (
            <div className="bg-gray-100 p-4 rounded-lg">
              <h4 className="font-medium mb-2">Image Details</h4>
              <dl className="text-sm space-y-1">
                <div>
                  <dt className="inline font-medium">Type:</dt>
                  <dd className="inline ml-2">{generatedImage.type === 'ai-generated' ? 'Generated' : 'Placeholder'}</dd>
                </div>
                {generatedImage.generatedAt && (
                  <div>
                    <dt className="inline font-medium">Generated:</dt>
                    <dd className="inline ml-2">{formatDateTime(generatedImage.generatedAt)}</dd>
                  </div>
                )}
              </dl>
            </div>
          )}
        </div>
      </WizardFormSection>

      {/* Navigation */}
      <div className="mt-6 flex justify-between">
        <div className="flex gap-2">
          <Button
            type="button"
            onClick={onCancel || (() => window.history.back())}
            variant="outline"
            disabled={isGenerating}
          >
            Cancel
          </Button>
          
          {onBack && (
            <Button
              type="button"
              onClick={onBack}
              variant="outline"
              disabled={isGenerating}
            >
              Back
            </Button>
          )}
        </div>
        
        <div className="flex gap-2">
          {!generatedImage && !isGenerating && (
            <Button
              type="button"
              onClick={handleSkip}
              variant="outline"
            >
              Skip Image
            </Button>
          )}
          
          {generatedImage && !isGenerating && (
            <Button
              type="button"
              onClick={generateImage}
              variant="outline"
            >
              Regenerate
            </Button>
          )}
          
          <Button
            type="button"
            onClick={handleContinue}
            disabled={isGenerating || (!generatedImage && !skipGeneration)}
          >
            {generatedImage ? 'Continue' : 'Skip & Continue'}
          </Button>
        </div>
      </div>
    </div>
  );
}
