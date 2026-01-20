'use client';

import React, { createContext, useState, useCallback, useEffect, ReactNode, useRef } from 'react';
import Joyride, { Step, CallBackProps, STATUS, ACTIONS, EVENTS } from 'react-joyride';
import { useSessionStore } from '@/state/sessionStore';
import { joyrideStyles, joyrideOptions } from '@/lib/tutorial/tutorialConfig';
import { TutorialPhase } from '@/types/tutorial.types';
import { TutorialProgressWidget } from '@/components/TutorialProgress/TutorialProgressWidget';

type PauseReason = 'end-of-page' | 'missing-target' | 'wizard-transition' | null;

interface TutorialContextValue {
  startTour: (tourId: TutorialPhase, stepIndex?: number) => void;
  stopTour: () => void;
  pauseTour: (reason?: PauseReason) => void;
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
  const [isPaused, setIsPaused] = useState(false);
  const [pauseReason, setPauseReason] = useState<PauseReason>(null);
  const [stepIndex, setStepIndex] = useState(0);
  const [currentWizardStep, setCurrentWizardStepState] = useState(0);
  const [stepMapping, setStepMapping] = useState<Record<number, number> | undefined>(undefined);
  const runRef = useRef(false);
  const isPausedRef = useRef(false);
  const missingTargetRef = useRef<{ index: number; target: string | null } | null>(null);
  const prevStepIndexRef = useRef<number | null>(null);
  const lastStepIndexRef = useRef<number | null>(null);

  const { 
    tutorialProgress, 
    updateTutorialProgress, 
    completeTutorialPhase,
    resetTutorialProgress: resetStoreProgress
  } = useSessionStore();

  useEffect(() => {
    runRef.current = run;
  }, [run]);

  useEffect(() => {
    isPausedRef.current = isPaused;
  }, [isPaused]);

  const startTour = useCallback(async (tourId: TutorialPhase, initialStepIndex = 0) => {
    const { steps: loadedSteps, mapping } = await loadTour(tourId);
    
    if (loadedSteps.length > 0) {
      // If resuming, check last step from store if not provided explicitly
      const phaseData = tutorialProgress.phases[tourId];
      const lastStep = (phaseData && 'lastStep' in phaseData) ? phaseData.lastStep : 0;

      if (tourId === 'worldCreation' && mapping && initialStepIndex === 0) {
        const stepIndices = Object.entries(mapping)
          .filter((entry) => entry[1] === currentWizardStep)
          .map((entry) => parseInt(entry[0], 10));
        const maxIndexForWizardStep = stepIndices.length > 0
          ? Math.max(...stepIndices)
          : null;

        if (maxIndexForWizardStep !== null && lastStep >= maxIndexForWizardStep) {
          return;
        }
      }

      setSteps(loadedSteps);
      setStepMapping(mapping);
      setActiveTour(tourId);
      setPauseReason(null);

      let nextStepIndex = initialStepIndex > 0 ? initialStepIndex : lastStep;

      if (tourId === 'worldCreation' && mapping) {
        const mappedWizardStep = mapping[nextStepIndex];
        if (mappedWizardStep !== currentWizardStep) {
          const mappedEntry = Object.entries(mapping)
            .find((entry) => entry[1] === currentWizardStep);
          if (mappedEntry) {
            nextStepIndex = parseInt(mappedEntry[0], 10);
          }
        }
      }

      setStepIndex(nextStepIndex);
      
      setRun(true);
      setIsPaused(false);
    }
  }, [tutorialProgress.phases, currentWizardStep]);

  const stopTour = useCallback(() => {
    setSteps([]);
    setRun(false);
    setIsPaused(false);
    setPauseReason(null);
    setActiveTour(null);
  }, []);
  
  const pauseTour = useCallback((reason: PauseReason = 'end-of-page') => {
    setSteps([]);
    setRun(false);
    setIsPaused(true);
    setPauseReason(reason);
    if (reason !== 'missing-target') {
      missingTargetRef.current = null;
    }
  }, []);

  const resumeTour = useCallback(async () => {
    // Re-load steps to ensure they are fresh and correctly targeted
    if (activeTour) {
      const { steps: loadedSteps } = await loadTour(activeTour);
      setSteps(loadedSteps);
    }
    setRun(true);
    setIsPaused(false);
    setPauseReason(null);
    missingTargetRef.current = null;
  }, [activeTour]);

  const handleJoyrideCallback = useCallback((data: CallBackProps) => {
    const { status, type, index, action } = data;
    
    if (status === STATUS.FINISHED || status === STATUS.SKIPPED) {
      setSteps([]);
      setRun(false);
      setIsPaused(false);
      setPauseReason(null);
      missingTargetRef.current = null;
      if (activeTour) {
        if (status === STATUS.FINISHED) {
          completeTutorialPhase(activeTour);
        } else {
          updateTutorialProgress(activeTour, { skipped: true });
        }
      }
      setActiveTour(null);
    } else if (type === EVENTS.STEP_BEFORE && action === ACTIONS.PREV) {
      // Some Joyride versions emit STEP_BEFORE on back; keep stepIndex in sync.
      setStepIndex(index);
    } else if (type === EVENTS.STEP_AFTER) {
      const nextIndex = index + (action === ACTIONS.PREV ? -1 : 1);
      
      if (activeTour) {
        updateTutorialProgress(activeTour, { lastStep: index });
        setStepIndex(nextIndex);
      }
    } else if (type === EVENTS.TARGET_NOT_FOUND) {
      if (activeTour !== 'worldCreation') return;
      const stepData = steps[index]?.data as { skipIfMissing?: boolean } | undefined;
      if (stepData?.skipIfMissing) {
        const direction = action === ACTIONS.PREV ? -1 : 1;
        const nextIndex = index + direction;
        if (nextIndex >= 0 && nextIndex < steps.length) {
          setStepIndex(nextIndex);
        }
        return;
      }
      const mappedWizardStep = stepMapping?.[index];
      const isSameWizardStep = mappedWizardStep === currentWizardStep;
      const target = steps[index]?.target;

      if (isSameWizardStep) {
        missingTargetRef.current = {
          index,
          target: typeof target === 'string' ? target : null,
        };
        setTimeout(() => {
          if (runRef.current && !isPausedRef.current) {
            pauseTour('missing-target');
          }
        }, 100);
        return;
      }

      setTimeout(() => {
        if (runRef.current && !isPausedRef.current) {
          pauseTour('wizard-transition');
        }
      }, 100);
    }
  }, [activeTour, completeTutorialPhase, updateTutorialProgress, pauseTour, stepMapping, currentWizardStep, steps]);
  
  const lastWizardStepRef = useRef<number | null>(null);

  // Sync tour with wizard (only when the wizard actually changes steps)
  useEffect(() => {
    if (!isPaused || pauseReason !== 'missing-target' || activeTour !== 'worldCreation') return;
    const missingTarget = missingTargetRef.current;
    if (!missingTarget?.target) return;

    const retryInterval = window.setInterval(() => {
      if (!isPausedRef.current || pauseReason !== 'missing-target') return;
      const element = document.querySelector(missingTarget.target as string);
      if (element) {
        missingTargetRef.current = null;
        resumeTour();
      }
    }, 250);

    return () => {
      window.clearInterval(retryInterval);
    };
  }, [isPaused, pauseReason, activeTour, resumeTour]);

  useEffect(() => {
    if (!activeTour || !stepMapping) return;

    // Handle paused state: resume when wizard advances
    if (isPaused) {
      // Only resume if wizard actually changed steps
      if (lastWizardStepRef.current !== currentWizardStep) {
        lastWizardStepRef.current = currentWizardStep;

        const targetEntry = Object.entries(stepMapping)
          .find((entry) => entry[1] === currentWizardStep);

        if (targetEntry) {
          const newIndex = parseInt(targetEntry[0]);
          setStepIndex(newIndex);
          resumeTour(); // Resume tour at new step
        }
      }
      return; // Exit early - don't run normal sync logic while paused
    }

    // Normal sync logic (only when running)
    if (!run) return;

    if (lastWizardStepRef.current === currentWizardStep) return;

    lastWizardStepRef.current = currentWizardStep;

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
  }, [currentWizardStep, activeTour, stepMapping, run, stepIndex, isPaused, resumeTour]);

  useEffect(() => {
    prevStepIndexRef.current = lastStepIndexRef.current;
    lastStepIndexRef.current = stepIndex;
  }, [stepIndex]);

  useEffect(() => {
    if (!run || !steps[stepIndex]) return;
    const stepData = steps[stepIndex]?.data as { autoScroll?: boolean | 'down' | 'up' } | undefined;
    if (!stepData?.autoScroll) return;
    const prevIndex = prevStepIndexRef.current;
    const isForward = prevIndex === null || stepIndex > prevIndex;
    const isBackward = prevIndex !== null && stepIndex < prevIndex;
    if (!isForward && !isBackward) return;
    const target = steps[stepIndex].target;
    if (typeof target !== 'string') return;
    const element = document.querySelector(target);
    if (!element) return;
    const getScrollParent = (node: Element | null) => {
      let current = node?.parentElement || null;
      while (current) {
        const style = window.getComputedStyle(current);
        if (/(auto|scroll)/.test(style.overflowY)) {
          return current;
        }
        current = current.parentElement;
      }
      return document.scrollingElement instanceof HTMLElement ? document.scrollingElement : null;
    };

    const scrollParent = getScrollParent(element);
    const parentRect = scrollParent?.getBoundingClientRect();
    const rect = element.getBoundingClientRect();
    const topBoundary = parentRect?.top ?? 0;
    const bottomBoundary = parentRect?.bottom ?? (window.innerHeight || document.documentElement.clientHeight);
    const isAbove = rect.top < topBoundary;
    const isBelow = rect.bottom > bottomBoundary;

    if (stepData.autoScroll === 'down') {
      if (!isForward) return;
      element.scrollIntoView({ block: 'center', behavior: 'smooth' });
      return;
    }

    if (stepData.autoScroll === 'up') {
      if (!isBackward) return;
      element.scrollIntoView({ block: 'center', behavior: 'smooth' });
      return;
    }

    if (isForward && !isBelow) return;
    if (isBackward && !isAbove) return;
    element.scrollIntoView({ block: 'center', behavior: 'smooth' });
  }, [run, steps, stepIndex]);

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
    setSteps([]);
    setRun(false);
    setIsPaused(false);
    setPauseReason(null);
    missingTargetRef.current = null;
    if (activeTour) {
      updateTutorialProgress(activeTour, { skipped: true });
    }
    setActiveTour(null);
  }, [activeTour, updateTutorialProgress]);

  return (
    <TutorialContext.Provider value={{
      startTour,
      stopTour,
      pauseTour,
      nextStep,
      prevStep,
      skipTour,
      resetTutorial,
      isTourActive: run || isPaused,
      currentTour: activeTour,
      stepIndex,
      setCurrentWizardStep,
    }}>
      {children}
      <TutorialProgressWidget />
      {steps.length > 0 && run && (
        <Joyride
          key={`${activeTour}-${isPaused}`}
          steps={steps}
          run={!isPaused}
          stepIndex={stepIndex}
          continuous={joyrideOptions.continuous}
          scrollToFirstStep={joyrideOptions.scrollToFirstStep}
          showProgress={joyrideOptions.showProgress}
          showSkipButton={joyrideOptions.showSkipButton}
          disableScrolling={joyrideOptions.disableScrolling}
          disableBeacon={true}
          styles={joyrideStyles}
          callback={handleJoyrideCallback}
          disableOverlayClose={true}
          spotlightClicks={true}
          scrollOffset={joyrideOptions.scrollOffset}
          locale={
            activeTour === 'worldCreation'
              ? { skip: 'Skip world creation tutorial', last: 'Finish tutorial' }
              : undefined
          }
          styles={joyrideStyles}
        />
      )}
    </TutorialContext.Provider>
  );
}
