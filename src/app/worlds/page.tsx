'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import WorldListScreen from '@/components/WorldListScreen/WorldListScreen';
import { PageLayout } from '@/components/shared/PageLayout';
import { ActionButtonGroup } from '@/components/shared/ActionButtonGroup';
import { useWorldStore } from '@/state/worldStore';
import { InlineError } from '@/components/shared';
import { WorldTypeSelector, WorldTypeData, createInitialWorldTypeData } from '@/components/shared/WorldTypeSelector';
import { WorldFormFields } from '@/components/shared/WorldFormFields';
import { worldCreationService } from '@/lib/services/worldCreationService';
import { worldApi } from '@/lib/api/worldApi';
import { convertToGenerationParams } from '@/components/shared/WorldTypeSelector/utils';
import { useAsyncOperation } from '@/lib/hooks/useAsyncOperation';

export default function WorldsPage() {
  const router = useRouter();
  const modalRef = useRef<HTMLDivElement>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [worldTypeData, setWorldTypeData] = useState<WorldTypeData>(createInitialWorldTypeData());
  const [worldName, setWorldName] = useState('');

  // Async operation hook for world generation
  const generateOperation = useAsyncOperation(
    async () => {
      // Validate world type data
      const { reference, relationship } = convertToGenerationParams(worldTypeData);
      
      if (relationship && !reference?.trim()) {
        throw new Error('Please enter an existing setting');
      }

      // Get existing world names to ensure uniqueness
      const { worlds } = useWorldStore.getState();
      const existingNames = Object.values(worlds).map(w => w.name);

      // Generate the world data using the API service
      const generatedData = await worldApi.generateWorld({
        worldReference: reference,
        worldRelationship: relationship,
        existingNames,
        suggestedName: worldName || undefined
      });

      // Create the world using the service
      const { worldId } = await worldCreationService.createWorldFromGeneration({
        generatedData,
        customizations: worldName ? { name: worldName } : {},
        generateImage: true
      });

      // Set as current world
      useWorldStore.getState().setCurrentWorld(worldId);
      
      return worldId;
    },
    {
      onSuccess: () => {
        // Hide the prompt and reset state
        setShowPrompt(false);
        setWorldTypeData(createInitialWorldTypeData());
        setWorldName('');
      }
    }
  );

  // Handle focus when modal opens/closes
  useEffect(() => {
    if (showPrompt && modalRef.current) {
      // Focus the modal when it opens
      modalRef.current.focus();
      
      // Trap focus within the modal
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape' && !generateOperation.isLoading) {
          setShowPrompt(false);
          setWorldTypeData(createInitialWorldTypeData());
          setWorldName('');
          generateOperation.clearError();
        }
      };
      
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [showPrompt, generateOperation.isLoading, generateOperation.clearError]);

  const handleCreateWorld = () => {
    router.push('/world/create');
  };

  const handleGenerateWorld = () => {
    generateOperation.execute();
  };

  const actionButtons = [
    {
      label: 'Create World',
      onClick: handleCreateWorld,
      variant: 'primary' as const,
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
      )
    },
    {
      label: 'Generate World',
      onClick: () => setShowPrompt(true),
      variant: 'secondary' as const,
      disabled: generateOperation.isLoading,
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
      )
    }
  ];

  return (
    <PageLayout
      title="My Worlds"
      description="Create unique story worlds, then manage characters and play through interactive narratives. Your currently active world appears in the navigation bar."
      actions={<ActionButtonGroup actions={actionButtons} />}
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
                  disabled={generateOperation.isLoading}
                  required={false}
                  placeholder="e.g., The Lost Kingdom"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Give your world a custom name, or leave empty for a generated name
                </p>
                
                <WorldTypeSelector
                  value={worldTypeData}
                  onChange={setWorldTypeData}
                  disabled={generateOperation.isLoading}
                  showLabels={true}
                  layout="vertical"
                  size="medium"
                />
              </div>
              {generateOperation.error && (
                <div className="mt-4 mb-4">
                  <InlineError error={generateOperation.error} />
                </div>
              )}
              {generateOperation.isLoading && (
                <p className="text-blue-700 text-sm mt-4 mb-4 flex items-center gap-2">
                  <span className="inline-block w-4 h-4 border-2 border-blue-700 border-t-transparent rounded-full animate-spin"></span>
                  Generating world...
                </p>
              )}
              <div className="flex justify-end mt-6">
                <ActionButtonGroup
                  actions={[
                    {
                      label: 'Cancel',
                      onClick: () => {
                        setShowPrompt(false);
                        setWorldTypeData(createInitialWorldTypeData());
                        setWorldName('');
                        generateOperation.clearError();
                      },
                      variant: 'secondary',
                      disabled: generateOperation.isLoading
                    },
                    {
                      label: generateOperation.isLoading ? 'Generating...' : 'Generate',
                      onClick: handleGenerateWorld,
                      variant: 'primary',
                      disabled: generateOperation.isLoading || (worldTypeData.worldType !== 'original' && !worldTypeData.worldReference?.trim()),
                      icon: (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                        </svg>
                      )
                    }
                  ]}
                />
              </div>
            </div>
          </div>
        )}

      <WorldListScreen />
    </PageLayout>
  );
}
