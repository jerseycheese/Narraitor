'use client';

import React, { useEffect, useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useWorldStore } from '@/state/worldStore';
import { useSessionStore } from '@/state/sessionStore';
import { CharacterCreationWizard } from '@/components/CharacterCreationWizard';
import { ActionButtonGroup } from '@/components/shared/ActionButtonGroup';
import { wizardStyles } from '@/components/shared/wizard';
import { useTutorial } from '@/components/TutorialProvider';

export default function CharacterCreatePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { currentWorldId, setCurrentWorld, worlds } = useWorldStore();
  const { startTour, isTourActive } = useTutorial();
  const shouldShowTour = useSessionStore(state => state.shouldShowTutorialPhase('characterCreation'));
  const [mounted, setMounted] = useState(false);

  // Get worldId from URL parameter or use current world
  const worldIdFromUrl = searchParams.get('worldId');
  const effectiveWorldId = worldIdFromUrl || currentWorldId;
  // The wizard seeds its attribute/skill allocation from the world and captures it
  // once on mount, so it must not render until the world is actually hydrated — else
  // the attributes step comes up with no sliders to allocate (#1455).
  const currentWorld = effectiveWorldId ? worlds[effectiveWorldId] : null;

  // If URL has worldId but store doesn't, set it in the store
  useEffect(() => {
    if (worldIdFromUrl && worldIdFromUrl !== currentWorldId) {
      setCurrentWorld(worldIdFromUrl);
    }
  }, [worldIdFromUrl, currentWorldId, setCurrentWorld]);

  // Mark mounted so the tour start is independent of client-only store hydration
  useEffect(() => {
    setMounted(true);
  }, []);

  // Start the character-creation wizard tour once the wizard is on screen
  useEffect(() => {
    if (mounted && currentWorld && shouldShowTour && !isTourActive) {
      const timer = setTimeout(() => {
        startTour('characterCreationWizard');
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [mounted, currentWorld, shouldShowTour, isTourActive, startTour]);

  if (!effectiveWorldId) {
    return (
      <div className="component-create-character-page wizard-page">
        <div className="wizard-page-header">
          <h1 className="wizard-page-title">Create Character</h1>
        </div>
        <div className="wizard-empty-state wizard-world-required-state">
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

  if (!currentWorld) {
    return (
      <div className="component-create-character-page wizard-page">
        <div className="wizard-empty-state">Preparing character creation…</div>
      </div>
    );
  }

  return (
    <div className="component-create-character-page wizard-page">
      <div className={wizardStyles.step.content}>
        <div className="wizard-page-header">
          <h1 className="wizard-page-title">Create New Character</h1>
          <p className="wizard-page-subtitle">
            Build your character from scratch with full customization
          </p>
        </div>
        <div>
          <CharacterCreationWizard
            key={`new-character-${effectiveWorldId}`}
            worldId={effectiveWorldId}
            initialStep={0}
          />
        </div>
      </div>
    </div>
  );
}
