'use client';

import React, { useState, useEffect } from 'react';
import { World, WorldImage } from '@/types/world.types';
import { wizardStyles, WizardFormSection } from '@/components/shared/wizard';
import { createAIClient } from '@/lib/ai';
import { WorldImageGenerator } from '@/lib/ai/worldImageGenerator';
import { LoadingState } from '@/components/ui/LoadingState';
import { ErrorDisplay } from '@/components/ui/ErrorDisplay';

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
  const [generatedImage, setGeneratedImage] = useState<WorldImage | null>(worldData.image || null);

  useEffect(() => {
    // Auto-generate image when component mounts if we don't have one
    if (!generatedImage && !skipGeneration && !isGenerating) {
      generateImage();
    }
  }, []);

  const generateImage = async () => {
    setIsGenerating(true);
    setError(null);

    try {
      const aiClient = createAIClient();
      const imageGenerator = new WorldImageGenerator(aiClient);
      
      const image = await imageGenerator.generateWorldImage(worldData as World);
      
      setGeneratedImage(image);
      onUpdate({ image });
    } catch (err) {
      console.error('Failed to generate world image:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate image');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSkip = () => {
    // Set a placeholder image
    const placeholderImage: WorldImage = {
      type: 'placeholder',
      url: null,
      generatedAt: new Date().toISOString()
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
        <div className="space-y-6">
          {/* Preview Area */}
          <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
            {isGenerating ? (
              <div className="h-full flex items-center justify-center">
                <LoadingState message="Generating world image..." />
              </div>
            ) : generatedImage?.url ? (
              <img 
                src={generatedImage.url} 
                alt={`${worldData.name} world`}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="h-full flex items-center justify-center text-gray-400">
                <div className="text-center">
                  <svg className="w-16 h-16 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
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
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium mb-2">Image Details</h4>
              <dl className="text-sm space-y-1">
                <div>
                  <dt className="inline font-medium">Type:</dt>
                  <dd className="inline ml-2">{generatedImage.type === 'ai-generated' ? 'AI Generated' : 'Placeholder'}</dd>
                </div>
                {generatedImage.generatedAt && (
                  <div>
                    <dt className="inline font-medium">Generated:</dt>
                    <dd className="inline ml-2">{new Date(generatedImage.generatedAt).toLocaleString()}</dd>
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
          <button
            type="button"
            onClick={onCancel || (() => window.history.back())}
            className={wizardStyles.navigation.cancelButton}
            disabled={isGenerating}
          >
            Cancel
          </button>
          
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className={wizardStyles.navigation.secondaryButton}
              disabled={isGenerating}
            >
              Back
            </button>
          )}
        </div>
        
        <div className="flex gap-2">
          {!generatedImage && !isGenerating && (
            <button
              type="button"
              onClick={handleSkip}
              className={wizardStyles.navigation.secondaryButton}
            >
              Skip Image
            </button>
          )}
          
          {generatedImage && !isGenerating && (
            <button
              type="button"
              onClick={generateImage}
              className={wizardStyles.navigation.secondaryButton}
            >
              Regenerate
            </button>
          )}
          
          <button
            type="button"
            onClick={handleContinue}
            className={wizardStyles.navigation.primaryButton}
            disabled={isGenerating || (!generatedImage && !skipGeneration)}
          >
            {generatedImage ? 'Continue' : 'Skip & Continue'}
          </button>
        </div>
      </div>
    </div>
  );
}