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
import { CharacterArchetype } from '@/types/world.types';
import { useTutorial } from '@/components/TutorialProvider';

export default function CharacterCreatePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { currentWorldId, setCurrentWorld, worlds } = useWorldStore();
  const { createCharacter, setCurrentCharacter } = useCharacterStore();
  const { initializeSession } = useSessionStore();
  const { startTour, isTourActive } = useTutorial();
  const shouldShowTour = useSessionStore(state => state.shouldShowTutorialPhase('characterCreation'));
  const [showQuickStart, setShowQuickStart] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [contentReady, setContentReady] = useState(false);

  // Get worldId from URL parameter or use current world
  const worldIdFromUrl = searchParams.get('worldId');
  const effectiveWorldId = worldIdFromUrl || currentWorldId;
  const currentWorld = effectiveWorldId ? worlds[effectiveWorldId] : null;

  // Start tutorial tour when content is ready
  useEffect(() => {
    if (mounted && shouldShowTour && !isTourActive && showQuickStart && contentReady) {
      startTour('characterCreation');
    }
  }, [mounted, shouldShowTour, isTourActive, startTour, showQuickStart, contentReady]);

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
      <div className="min-h-screen bg-gray-100 p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">Create Character</h1>
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <div className="w-20 h-20 bg-amber-100 rounded-full mx-auto mb-4 flex items-center justify-center">
              <AlertTriangle
                className="w-10 h-10 text-amber-500"
                aria-hidden="true"
              />
            </div>
            <h2 className="text-xl font-semibold mb-2">World Required</h2>
            <p className="text-gray-700 mb-2">
              Characters are created within specific worlds.
            </p>
            <p className="text-gray-500 text-sm mb-6">
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
              className="justify-center"
            />
          </div>
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
    setShowQuickStart(false);
  };

  const handleBackToQuickStart = () => {
    setShowQuickStart(true);
  };

  // Determine which branch to show on initial render in a hydration-safe way
  const shouldShowQuickStart =
    showQuickStart && (mounted ? !!currentWorld : !!effectiveWorldId);

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-7xl mx-auto">
        {shouldShowQuickStart ? (
          <>
            <div className="mb-8">
              <h1 className="text-3xl font-bold mb-2">Create New Character</h1>
              <p className="text-gray-700">
                <span suppressHydrationWarning>
                  {currentWorld
                    ? `Choose a quick start character for ${currentWorld.name} or create your own`
                    : 'Choose a quick start character or create your own'}
                </span>
              </p>
            </div>
            <div className="bg-white rounded-lg shadow p-8">
              {mounted && currentWorld ? (
                <QuickStartCharacters
                  world={currentWorld}
                  onCharacterSelect={handleQuickStartSelect}
                  onCustomizeClick={handleCustomizeClick}
                  onReady={() => setContentReady(true)}
                />
              ) : (
                <div className="text-center py-12 text-gray-500">
                  Preparing quick start options...
                </div>
              )}
            </div>
          </>
        ) : (
          <>
            <div className="mb-8 flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold mb-2">
                  Create Custom Character
                </h1>
                <p className="text-gray-700">
                  Build your character from scratch with full customization
                </p>
              </div>
              <Button
                variant="outline"
                onClick={handleBackToQuickStart}
                className="flex items-center gap-2"
              >
                ← Back to Quick Start
              </Button>
            </div>
            <div className="bg-white rounded-lg shadow p-8">
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
