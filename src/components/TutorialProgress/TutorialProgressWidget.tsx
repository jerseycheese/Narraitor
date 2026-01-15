'use client';

import React from 'react';
import { useTutorial } from '@/components/TutorialProvider';
import { useSessionStore } from '@/state/sessionStore';
import { Button } from '@/components/ui/button';

export function TutorialProgressWidget() {
  const { isTourActive, startTour } = useTutorial();
  const getCurrentTutorialPhase = useSessionStore(state => state.getCurrentTutorialPhase);
  const tutorialProgress = useSessionStore(state => state.tutorialProgress);
  
  // Don't show if tour is active (Joyride handles UI)
  if (isTourActive) return null;
  
  const currentPhase = getCurrentTutorialPhase();
  if (!currentPhase) return null; // All phases completed
  
  const phaseData = tutorialProgress.phases[currentPhase];
  
  // Only show if user has interacted with this phase (skipped or partially done)
  // This prevents it from showing up before the user has even started
  const hasStarted = 'lastStep' in phaseData && phaseData.lastStep > 0;
  if (!phaseData.skipped && !hasStarted) return null;

  return (
    <div className="fixed bottom-4 right-4 bg-background border rounded-lg shadow-lg p-4 w-72 z-40 animate-in slide-in-from-bottom-5">
      <h3 className="font-semibold mb-2">Tutorial Paused</h3>
      <p className="text-sm text-muted-foreground mb-4">
        You can resume the {currentPhase.replace(/([A-Z])/g, ' $1').toLowerCase()} tutorial at any time.
      </p>
      <Button onClick={() => startTour(currentPhase)} size="sm" className="w-full">
        Resume Tutorial
      </Button>
    </div>
  );
}
