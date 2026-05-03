'use client';

import React, { useEffect, useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useWorldStore } from '@/state/worldStore';
import { useCharacterStore } from '@/state/characterStore';
import { useSessionStore } from '@/state/sessionStore';
import { CharacterCreationWizard } from '@/components/CharacterCreationWizard';
import { QuickStartCharacters } from '@/components/QuickStartCharacters/QuickStartCharacters';
import { Button } from '@/components/ui/button';
import { ActionButtonGroup } from '@/components/shared/ActionButtonGroup';
import { wizardStyles } from '@/components/shared/wizard';
import { CharacterArchetype } from '@/types/world.types';
import { useTutorial } from '@/components/TutorialProvider';

export default function CharacterCreatePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { currentWorldId, setCurrentWorld, worlds } = useWorldStore();
  const { createCharacter, setCurrentCharacter } = useCharacterStore();
  const { initializeSession } = useSessionStore();
  const updateTutorialProgress = useSessionStore(state => state.updateTutorialProgress);
  const { startTour, isTourActive, stopTour } = useTutorial();
  const shouldShowTour = useSessionStore(state => state.shouldShowTutorialPhase('characterCreation'));
  const quickStartCompleted = useSessionStore(
    state => state.tutorialProgress.phases.characterCreation.quickStartCompleted,
  );
  const [showQuickStart, setShowQuickStart] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [contentReady, setContentReady] = useState(false);

  // Get worldId from URL parameter or use current world
  const worldIdFromUrl = searchParams.get('worldId');
  const effectiveWorldId = worldIdFromUrl || currentWorldId;
  const currentWorld = effectiveWorldId ? worlds[effectiveWorldId] : null;

  // Start tutorial tour when content is ready
  useEffect(() => {
    if (
      mounted &&
      shouldShowTour &&
      !isTourActive &&
      showQuickStart &&
      contentReady &&
      !quickStartCompleted
    ) {
      startTour('quickStartSelection');
    }
  }, [
    mounted,
    shouldShowTour,
    isTourActive,
    startTour,
    showQuickStart,
    contentReady,
    quickStartCompleted,
  ]);

  // Auto-start wizard tour when transitioning from QuickStart
  useEffect(() => {
    if (!showQuickStart && mounted) {
      const phaseData = useSessionStore.getState().tutorialProgress.phases.characterCreation;
      const shouldAutoStart =
        shouldShowTour &&
        phaseData.quickStartCompleted === true &&
        !phaseData.skipped &&
        !isTourActive;

      if (shouldAutoStart) {
        const timer = setTimeout(() => {
          startTour('characterCreationWizard');
        }, 100);
        return () => clearTimeout(timer);
      }
    }
  }, [showQuickStart, mounted, isTourActive, startTour, shouldShowTour]);

  // If URL has worldId but store doesn't, set it in the store
  useEffect(() => {
    if (worldIdFromUrl && worldIdFromUrl !== currentWorldId) {
      setCurrentWorld(worldIdFromUrl);
    }
  }, [worldIdFromUrl, currentWorldId, setCurrentWorld]);

  // Mark mounted to make initial render independent of client-only store hydration
  useEffect(() => {
    setMounted(true);
  }, []);

  // Note: Auto-save data clearing is now handled by the CharacterCreationWizard
  // to allow for recovery dialog functionality

  if (!effectiveWorldId) {
    return (
      <div className="component-create-character-page wizard-page">
        <div className="wizard-page-header">
          <h1 className="wizard-page-title">Create Character</h1>
        </div>
        <div className="wizard-empty-state">
          <AlertTriangle aria-hidden="true" />
          <h2 className={wizardStyles.step.title}>World Required</h2>
          <p>Characters are created within specific worlds.</p>
          <p>
            Each world defines unique attributes, skills, and rules that shape
            your characters.
          </p>
          <ActionButtonGroup
            actions={[
              {
                label: 'Select a World First',
                onClick: () => router.push('/worlds'),
                variant: 'primary',
                size: 'lg',
              },
            ]}
          />
        </div>
      </div>
    );
  }

  const handleQuickStartSelect = async (archetype: CharacterArchetype) => {
    if (!currentWorld) {
      console.error('No current world available for character creation');
      return;
    }

    try {
      // Convert archetype to character format
      const characterData = {
        name: archetype.name,
        description: archetype.description,
        worldId: currentWorld.id,
        level: archetype.level,
        isPlayer: true,
        attributes: archetype.attributes.map((attr) => ({
          id: `attr-${Date.now()}-${Math.random()}`,
          characterId: '', // Will be set by store
          worldAttributeId: attr.id,
          name: attr.name,
          baseValue: attr.value,
          modifiedValue: attr.value,
          category: 'Generated',
        })),
        skills: archetype.skills.map((skill) => ({
          id: `skill-${Date.now()}-${Math.random()}`,
          characterId: '', // Will be set by store
          worldSkillId: skill.id,
          name: skill.name,
          level: skill.level,
          category: 'Generated',
        })),
        derivedStats: [],
        background: {
          history: archetype.background.description,
          personality: archetype.background.personality,
          goals: [archetype.background.motivation],
          fears: archetype.background.fears,
          physicalDescription: archetype.background.physicalDescription,
          relationships: [],
          isKnownFigure: false,
        },
        status: {
          health: 100,
          maxHealth: 100,
          conditions: [],
          location: currentWorld.name,
        },
        inventory: {
          characterId: '', // Will be set by store
          items: [],
          capacity: 10,
          categories: [],
          itemOrder: [],
        },
      };

      // Create the character
      const characterId = createCharacter(characterData);
      setCurrentCharacter(characterId);

      // Start a new game session
      await initializeSession(currentWorld.id, characterId, () => {
        // Navigate to the game after session is initialized
        router.push('/play');
      });
    } catch (error) {
      console.error('Failed to create character:', error);
      // Could show an error message here
    }
  };

  const handleCustomizeClick = () => {
    if (isTourActive) {
      // Manually complete QuickStart if user advances via button click
      updateTutorialProgress('characterCreation', { quickStartCompleted: true });
      stopTour();
    }
    setShowQuickStart(false);
  };

  const handleBackToQuickStart = () => {
    if (isTourActive) {
      stopTour();
    }
    setShowQuickStart(true);
  };

  // Determine which branch to show on initial render in a hydration-safe way
  const shouldShowQuickStart =
    showQuickStart && (mounted ? !!currentWorld : !!effectiveWorldId);

  return (
    <div className="component-create-character-page wizard-page">
      <div className={wizardStyles.step.content}>
        {shouldShowQuickStart ? (
          <>
            <div className="wizard-page-header">
              <h1 className="wizard-page-title">Create New Character</h1>
              <p className="wizard-page-subtitle">
                <span suppressHydrationWarning>
                  {currentWorld
                    ? `Choose a quick start character for ${currentWorld.name} or create your own`
                    : 'Choose a quick start character or create your own'}
                </span>
              </p>
            </div>
            <div>
              {mounted && currentWorld ? (
                <QuickStartCharacters
                  world={currentWorld}
                  onCharacterSelect={handleQuickStartSelect}
                  onCustomizeClick={handleCustomizeClick}
                  onReady={() => setContentReady(true)}
                />
              ) : (
                <div className="wizard-empty-state">
                  Preparing quick start options...
                </div>
              )}
            </div>
          </>
        ) : (
          <>
            <div className="wizard-page-header-row">
              <div className="wizard-page-header">
                <h1 className="wizard-page-title">Create Custom Character</h1>
                <p className="wizard-page-subtitle">
                  Build your character from scratch with full customization
                </p>
              </div>
              <Button variant="outline" onClick={handleBackToQuickStart}>
                ← Back to Quick Start
              </Button>
            </div>
            <div>
              <CharacterCreationWizard
                key={`new-character-${effectiveWorldId}`}
                worldId={effectiveWorldId}
                initialStep={0}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
