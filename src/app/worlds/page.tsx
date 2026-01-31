'use client';

import { useState } from 'react';
import { Plus, Sparkles } from 'lucide-react';
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
import { SimpleModal } from '@/components/shared/SimpleModal';
import { useTutorial } from '@/components/TutorialProvider';
import { useSessionStore } from '@/state/sessionStore';
import { useEffect, useRef } from 'react';

export default function WorldsPage() {
  const router = useRouter();
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatingStatus, setGeneratingStatus] = useState('');
  const [showPrompt, setShowPrompt] = useState(false);
  
  // Tutorial integration
  const { startTour, stopTour, isTourActive } = useTutorial();
  const shouldShowTour = useSessionStore(state => state.shouldShowTutorialPhase('worldGeneration'));
  const completeTutorialPhase = useSessionStore(state => state.completeTutorialPhase);
  const tourStartedRef = useRef(false);

  // Reset tour started flag when modal closes
  useEffect(() => {
    if (!showPrompt) {
      tourStartedRef.current = false;
    }
  }, [showPrompt]);

  // Start tour when modal opens if needed (only once per modal session)
  useEffect(() => {
    console.log('[WorldsPage] useEffect:', { showPrompt, shouldShowTour, isTourActive, tourStarted: tourStartedRef.current });
    if (showPrompt && shouldShowTour && !isTourActive && !tourStartedRef.current) {
      console.log('[WorldsPage] Scheduling tour start');
      tourStartedRef.current = true;
      // Small delay to allow modal animation
      const timer = setTimeout(() => {
        // Re-check in case tutorial was completed during the timeout
        const stillShouldShow = useSessionStore.getState().shouldShowTutorialPhase('worldGeneration');
        console.log('[WorldsPage] Timer fired, stillShouldShow:', stillShouldShow);
        if (stillShouldShow) {
          console.log('[WorldsPage] Starting tour');
          startTour('worldGeneration');
        }
      }, 500);
      return () => clearTimeout(timer);
    } else if (!showPrompt && isTourActive) {
      console.log('[WorldsPage] Stopping tour because modal closed');
      stopTour();
    }
  }, [showPrompt, shouldShowTour, isTourActive, startTour, stopTour]);

  const [worldTypeData, setWorldTypeData] = useState<WorldTypeData>(createInitialWorldTypeData());
  const [worldName, setWorldName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [viewToggle, setViewToggle] = useState<React.ReactNode>(null);

  const handleCreateWorld = () => {
    router.push('/worlds/create');
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
    
    // Complete tutorial phase if active
    if (shouldShowTour) {
      completeTutorialPhase('worldGeneration');
      stopTour();
    }

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

  const actionButtons = [
    {
      label: 'Create World',
      onClick: handleCreateWorld,
      variant: 'primary' as const,
      icon: (
        <Plus className="w-4 h-4" aria-hidden="true" />
      )
    },
    {
      label: 'Generate World',
      onClick: () => setShowPrompt(true),
      variant: 'secondary' as const,
      disabled: isGenerating,
      icon: (
        <Sparkles className="w-4 h-4" aria-hidden="true" />
      )
    }
  ];

  return (
    <PageLayout
      title="My Worlds"
      description="Create unique story worlds, then manage characters and play through interactive narratives. Your currently active world appears in the navigation bar."
      actions={
        <div className="flex items-center gap-3">
          {viewToggle}
          <ActionButtonGroup actions={actionButtons} />
        </div>
      }
    >

      {/* World Generation Prompt */}
      <SimpleModal 
        isOpen={showPrompt} 
        onClose={() => setShowPrompt(false)}
        title="Generate World"
        showCloseButton={false}
        size="xl"
        ariaDescribedBy="generate-world-desc"
      >
        <div className="space-y-4">
          <WorldFormFields.NameInput
            value={worldName}
            onChange={setWorldName}
            disabled={isGenerating}
            required={false}
            placeholder="e.g., The Lost Kingdom"
          />
          <p id="generate-world-desc" className="text-xs text-muted-foreground mt-1">
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
            <div className="mb-4">
              <InlineError error={error} />
            </div>
          )}
          
          {isGenerating && (
            <p className="text-primary text-sm mb-4 flex items-center gap-2">
              <span className="inline-block w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></span>
              {generatingStatus}
            </p>
          )}
          
        <ActionButtonGroup
          actions={[
            {
              label: 'Cancel',
              onClick: () => {
                setShowPrompt(false);
                setWorldTypeData(createInitialWorldTypeData());
                setWorldName('');
                setError(null);
              },
              variant: 'secondary',
              disabled: isGenerating
            },
            {
              label: isGenerating ? 'Generating...' : 'Generate',
              onClick: handleGenerateWorld,
              variant: 'primary',
              disabled: isGenerating || (worldTypeData.worldType !== 'original' && !worldTypeData.worldReference?.trim()),
              icon: (
                <Sparkles className="w-4 h-4" aria-hidden="true" />
              ),
              dataTutorial: 'generate-world-button'
            }
          ]}
          className="mt-6 justify-end"
        />
      </SimpleModal>

      <WorldListScreen onViewToggleRender={setViewToggle} />
    </PageLayout>
  );
}
