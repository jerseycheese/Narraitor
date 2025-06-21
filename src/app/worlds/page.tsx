'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import WorldListScreen from '@/components/WorldListScreen/WorldListScreen';
import { PageLayout } from '@/components/shared/PageLayout';
import { useWorldStore } from '@/state/worldStore';
import { InlineError } from '@/components/shared';
import { WorldTypeSelector, WorldTypeData, createInitialWorldTypeData } from '@/components/shared/WorldTypeSelector';
import { WorldFormFields } from '@/components/shared/WorldFormFields';
import { worldCreationService } from '@/lib/services/worldCreationService';
import { worldApi } from '@/lib/api/worldApi';
import { convertToGenerationParams } from '@/components/shared/WorldTypeSelector/utils';

export default function WorldsPage() {
  const router = useRouter();
  const modalRef = useRef<HTMLDivElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatingStatus, setGeneratingStatus] = useState('');
  const [showPrompt, setShowPrompt] = useState(false);
  const [worldTypeData, setWorldTypeData] = useState<WorldTypeData>(createInitialWorldTypeData());
  const [worldName, setWorldName] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Handle focus when modal opens/closes
  useEffect(() => {
    if (showPrompt && modalRef.current) {
      // Focus the modal when it opens
      modalRef.current.focus();
      
      // Trap focus within the modal
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape' && !isGenerating) {
          setShowPrompt(false);
          setWorldTypeData(createInitialWorldTypeData());
          setWorldName('');
          setError(null);
        }
      };
      
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [showPrompt, isGenerating]);

  const handleCreateWorld = () => {
    router.push('/world/create');
  };

  const handleGenerateWorld = async () => {
    // Validate world type data
    const { reference, relationship } = convertToGenerationParams(worldTypeData);
    
    if (relationship && !reference?.trim()) {
      setError('Please enter an existing setting');
      return;
    }

    setIsGenerating(true);
    setGeneratingStatus('Generating world configuration...');
    setError(null);

    try {
      // Get existing world names to ensure uniqueness
      const { worlds } = useWorldStore.getState();
      const existingNames = Object.values(worlds).map(w => w.name);

      // Generate the world data using the API service
      setGeneratingStatus('Generating world configuration...');
      const generatedData = await worldApi.generateWorld({
        worldReference: reference,
        worldRelationship: relationship,
        existingNames,
        suggestedName: worldName || undefined
      });

      // Create the world using the service
      setGeneratingStatus('Creating world...');
      const { worldId } = await worldCreationService.createWorldFromGeneration({
        generatedData,
        customizations: worldName ? { name: worldName } : {},
        generateImage: true
      });

      setGeneratingStatus('Generating world image...');
      // Image generation is handled by the service in the background
      

      // Set as current world
      useWorldStore.getState().setCurrentWorld(worldId);

      // Hide the prompt and reset state
      setShowPrompt(false);
      setWorldTypeData(createInitialWorldTypeData());
      setWorldName('');
      setIsGenerating(false);
      
      // Stay on worlds page to see the new world
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate world');
      setIsGenerating(false);
    }
  };

  const actions = (
    <>
      <button
        onClick={handleCreateWorld}
        data-testid="create-world-button"
        className="py-2 px-4 bg-blue-500 text-white rounded-md border-none cursor-pointer text-base font-medium hover:bg-blue-600 transition-colors"
      >
        Create World
      </button>
      <button
        onClick={() => setShowPrompt(true)}
        disabled={isGenerating}
        className="py-2 px-4 bg-purple-500 text-white rounded-md border-none cursor-pointer text-base font-medium hover:bg-purple-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Generate World
      </button>
    </>
  );

  return (
    <PageLayout
      title="My Worlds"
      description="Use the 'Make Active' button on a world to set it as your current world, then create characters and start your interactive narrative. You can switch between worlds anytime using the world selector in the navigation bar."
      actions={actions}
    >

      {/* World Generation Prompt */}
      {showPrompt && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            role="dialog"
            aria-modal="true"
            aria-labelledby="generate-world-title"
            aria-describedby="generate-world-description"
          >
            <div 
              className="bg-white rounded-lg p-6 max-w-md w-full mx-4"
              tabIndex={-1}
              ref={modalRef}
            >
              <h2 id="generate-world-title" className="text-xl font-bold mb-4">Generate World</h2>
              <div id="generate-world-description" className="space-y-4">
                <WorldFormFields.NameInput
                  value={worldName}
                  onChange={setWorldName}
                  disabled={isGenerating}
                  required={false}
                  placeholder="e.g., The Lost Kingdom"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Give your world a custom name, or leave empty for a generated name
                </p>
                
                <WorldTypeSelector
                  value={worldTypeData}
                  onChange={setWorldTypeData}
                  disabled={isGenerating}
                  showLabels={true}
                  layout="vertical"
                  size="medium"
                />
              </div>
              {error && (
                <div className="mt-4 mb-4">
                  <InlineError error={error} />
                </div>
              )}
              {isGenerating && (
                <p className="text-purple-600 text-sm mt-4 mb-4 flex items-center gap-2">
                  <span className="inline-block w-4 h-4 border-2 border-purple-600 border-t-transparent rounded-full animate-spin"></span>
                  {generatingStatus}
                </p>
              )}
              <div className="flex justify-end gap-2 mt-6">
                <button
                  onClick={() => {
                    setShowPrompt(false);
                    setWorldTypeData(createInitialWorldTypeData());
                    setWorldName('');
                    setError(null);
                  }}
                  disabled={isGenerating}
                  className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-100 cursor-pointer disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleGenerateWorld}
                  disabled={isGenerating || (worldTypeData.worldType !== 'original' && !worldTypeData.worldReference?.trim())}
                  className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isGenerating ? 'Generating...' : 'Generate'}
                </button>
              </div>
            </div>
          </div>
        )}

      <WorldListScreen />
    </PageLayout>
  );
}
