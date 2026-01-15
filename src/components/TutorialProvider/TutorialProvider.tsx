'use client';

import React, { createContext, useState, useCallback, useEffect, ReactNode } from 'react';
import Joyride, { Step, CallBackProps, STATUS, ACTIONS, EVENTS } from 'react-joyride';
import { useSessionStore } from '@/state/sessionStore';
import { joyrideStyles, joyrideOptions } from '@/lib/tutorial/tutorialConfig';
import { TutorialPhase } from '@/types/tutorial.types';
import { TutorialProgressWidget } from '@/components/TutorialProgress/TutorialProgressWidget';

interface TutorialContextValue {
  startTour: (tourId: TutorialPhase, stepIndex?: number) => void;
  stopTour: () => void;
  nextStep: () => void;
  prevStep: () => void;
  skipTour: () => void;
  resetTutorial: () => void;
  isTourActive: boolean;
  currentTour: string | null;
  stepIndex: number;
  setCurrentWizardStep: (step: number) => void;
}

export const TutorialContext = createContext<TutorialContextValue | null>(null);

const loadTour = async (tourId: TutorialPhase): Promise<{ steps: Step[], mapping?: Record<number, number> }> => {
  switch (tourId) {
    case 'worldCreation':
      const { worldCreationTour, tourStepToWizardStep: worldMapping } = await import('@/lib/tutorial/worldCreationTour');
      return { steps: worldCreationTour, mapping: worldMapping };
    case 'worldGeneration':
      const { worldGenerationTour } = await import('@/lib/tutorial/worldGenerationTour');
      return { steps: worldGenerationTour };
    case 'characterCreation':
      const { characterCreationTour, tourStepToWizardStep: charMapping } = await import('@/lib/tutorial/characterCreationTour');
      return { steps: characterCreationTour, mapping: charMapping };
    case 'firstPlay':
      const { firstPlayTour } = await import('@/lib/tutorial/firstPlayTour');
      return { steps: firstPlayTour };
    default:
      return { steps: [] };
  }
};

interface TutorialProviderProps {
  children: ReactNode;
}

export function TutorialProvider({ children }: TutorialProviderProps) {
  const [steps, setSteps] = useState<Step[]>([]);
  const [activeTour, setActiveTour] = useState<TutorialPhase | null>(null);
  const [run, setRun] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [currentWizardStep, setCurrentWizardStepState] = useState(0);
  const [stepMapping, setStepMapping] = useState<Record<number, number> | undefined>(undefined);

  const { 
    tutorialProgress, 
    updateTutorialProgress, 
    completeTutorialPhase,
    resetTutorialProgress: resetStoreProgress
  } = useSessionStore();

  const startTour = useCallback(async (tourId: TutorialPhase, initialStepIndex = 0) => {
    const { steps: loadedSteps, mapping } = await loadTour(tourId);
    
    if (loadedSteps.length > 0) {
      setSteps(loadedSteps);
      setStepMapping(mapping);
      setActiveTour(tourId);
      
      // If resuming, check last step from store if not provided explicitly
      const phaseData = tutorialProgress.phases[tourId];
      const lastStep = (phaseData && 'lastStep' in phaseData) ? phaseData.lastStep : 0;
      setStepIndex(initialStepIndex > 0 ? initialStepIndex : lastStep);
      
      setRun(true);
    }
  }, [tutorialProgress.phases]);

  const stopTour = useCallback(() => {
    setRun(false);
    setActiveTour(null);
  }, []);

  const handleJoyrideCallback = useCallback((data: CallBackProps) => {
    const { status, type, index, action } = data;
    
    if (status === STATUS.FINISHED || status === STATUS.SKIPPED) {
      setRun(false);
      if (activeTour) {
        if (status === STATUS.FINISHED) {
          completeTutorialPhase(activeTour);
        } else {
          updateTutorialProgress(activeTour, { skipped: true });
        }
      }
      setActiveTour(null);
    } else if (type === EVENTS.STEP_AFTER) {
      const nextIndex = index + (action === ACTIONS.PREV ? -1 : 1);
      
      if (activeTour) {
        updateTutorialProgress(activeTour, { lastStep: index });
        setStepIndex(nextIndex);
      }
    } else if (type === EVENTS.TARGET_NOT_FOUND) {
        // If target not found, we generally just wait or let the user navigate
        // We don't advance automatically to avoid infinite loops if target never appears
    }
  }, [activeTour, completeTutorialPhase, updateTutorialProgress]);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const canAdvanceToStep = useCallback((_targetStep: number) => {
    // This function is intended to be used by the Wizard to check if it's allowed to move?
    // Or just to report validity?
    // For now, return true
    return true; 
  }, []);
  
  // Sync tour with wizard
  useEffect(() => {
    if (activeTour && stepMapping && run) {
      // Find tour step that corresponds to the current wizard step
      const targetTourStepEntry = Object.entries(stepMapping)
        .find((entry) => entry[1] === currentWizardStep);
        
      if (targetTourStepEntry) {
        const newIndex = parseInt(targetTourStepEntry[0]);
        // Only jump if we are not currently there
        if (stepIndex !== newIndex) {
           setStepIndex(newIndex);
        }
      }
    }
  }, [currentWizardStep, activeTour, stepMapping, run, stepIndex]);

  const setCurrentWizardStep = useCallback((step: number) => {
    setCurrentWizardStepState(step);
  }, []);
  
  const resetTutorial = useCallback(() => {
    resetStoreProgress();
    stopTour();
    setStepIndex(0);
  }, [resetStoreProgress, stopTour]);

  const nextStep = useCallback(() => {
    setStepIndex(prev => prev + 1);
  }, []);

  const prevStep = useCallback(() => {
    setStepIndex(prev => prev - 1);
  }, []);

  const skipTour = useCallback(() => {
    setRun(false);
    if (activeTour) {
      updateTutorialProgress(activeTour, { skipped: true });
    }
    setActiveTour(null);
  }, [activeTour, updateTutorialProgress]);

  return (
    <TutorialContext.Provider value={{
      startTour,
      stopTour,
      nextStep,
      prevStep,
      skipTour,
      resetTutorial,
      isTourActive: run,
      currentTour: activeTour,
      stepIndex,
      setCurrentWizardStep,
    }}>
      {children}
      <TutorialProgressWidget />
      <Joyride
        steps={steps}
        run={run}
        stepIndex={stepIndex}
        continuous={joyrideOptions.continuous}
        scrollToFirstStep={joyrideOptions.scrollToFirstStep}
        showProgress={joyrideOptions.showProgress}
        showSkipButton={joyrideOptions.showSkipButton}
        disableScrolling={joyrideOptions.disableScrolling}
        styles={joyrideStyles}
        callback={handleJoyrideCallback}
        disableOverlayClose={true}
        spotlightClicks={true}
      />
    </TutorialContext.Provider>
  );
}
