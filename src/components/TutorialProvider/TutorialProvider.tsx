'use client';

import React, { createContext, useState, useCallback, useEffect, ReactNode, useRef } from 'react';
import type { Step, CallBackProps } from 'react-joyride';
import { useSessionStore } from '@/state/sessionStore';
import { joyrideStyles, getTourOptions } from '@/lib/tutorial/tutorialConfig';
import { TutorialPhase } from '@/types/tutorial.types';
import { TutorialProgressWidget } from '@/components/TutorialProgress/TutorialProgressWidget';
import Logger from '@/lib/utils/logger';
import { isPlaywrightEnv } from '@/lib/utils/isPlaywrightEnv';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { useTutorialAutoScroll } from './useTutorialAutoScroll';
import { useTourTargetRetry } from './useTourTargetRetry';
import { useTutorialTooltipReposition } from './useTutorialTooltipReposition';

// The full react-joyride module, loaded on demand (see ensureJoyrideRuntime).
type JoyrideModule = typeof import('react-joyride');

type PauseReason = 'end-of-page' | 'missing-target' | null;

const logger = new Logger('TutorialProvider');

interface TutorialContextValue {
  startTour: (tourId: TutorialPhase | string, stepIndex?: number) => void;
  stopTour: () => void;
  pauseTour: (reason?: PauseReason) => void;
  resumeTour: () => void;
  nextStep: () => void;
  prevStep: () => void;
  skipTour: () => void;
  resetTutorial: () => void;
  isTourActive: boolean;
  currentTour: TutorialPhase | string | null;
  stepIndex: number;
  setCurrentWizardStep: (step: number) => void;
}

export const TutorialContext = createContext<TutorialContextValue | null>(null);

const normalizeSteps = (steps: Step[]) =>
  steps.map((step) => ({
    ...step,
    disableBeacon: true,
  }));

const loadTour = async (tourId: TutorialPhase | string): Promise<{ steps: Step[], mapping?: Record<number, number> }> => {
  try {
    switch (tourId) {
      case 'worldCreation':
        const { worldCreationTour, tourStepToWizardStep: worldMapping } = await import('@/lib/tutorial/worldCreationTour');
        return { steps: normalizeSteps(worldCreationTour), mapping: worldMapping };
      case 'worldGeneration':
        const { worldGenerationTour } = await import('@/lib/tutorial/worldGenerationTour');
        return { steps: normalizeSteps(worldGenerationTour) };
      case 'characterCreationWizard':
        const { characterCreationWizardTour, tourStepToWizardStep: charMapping } = await import('@/lib/tutorial/characterCreationWizardTour');
        return { steps: normalizeSteps(characterCreationWizardTour), mapping: charMapping };
      case 'firstPlay':
        const { firstPlayTour } = await import('@/lib/tutorial/firstPlayTour');
        return { steps: normalizeSteps(firstPlayTour) };
      default:
        return { steps: [] };
    }
  } catch (error) {
    logger.error(`Failed to load tour: ${tourId}`, error);
    return { steps: [] };
  }
};

interface TutorialProviderProps {
  children: ReactNode;
}

export function TutorialProvider({ children }: TutorialProviderProps) {
  const [steps, setSteps] = useState<Step[]>([]);
  const [activeTour, setActiveTour] = useState<TutorialPhase | string | null>(null);
  const [run, setRun] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [pauseReason, setPauseReason] = useState<PauseReason>(null);
  const [stepIndex, setStepIndex] = useState(0);
  const [currentWizardStep, setCurrentWizardStepState] = useState(0);
  const [stepMapping, setStepMapping] = useState<Record<number, number> | undefined>(undefined);
  const [targetResizeTick, setTargetResizeTick] = useState(0);
  const runRef = useRef(false);
  const isPausedRef = useRef(false);
  const missingTargetRef = useRef<{ index: number; target: string | null } | null>(null);
  // Mirror the loaded runtime in a ref so the Joyride callback can read its
  // STATUS/ACTIONS/EVENTS enums without re-subscribing; state drives the render.
  const joyrideRuntimeRef = useRef<JoyrideModule | null>(null);
  const [joyrideRuntime, setJoyrideRuntime] = useState<JoyrideModule | null>(null);

  useTutorialAutoScroll(run, steps, stepIndex);
  // Native Joyride scrolling isn't reached by the CSS prefers-reduced-motion
  // media query (#1678) -- collapse its scroll animation to instant instead.
  const prefersReducedMotion = useReducedMotion();

  const activeTarget = steps[stepIndex]?.target;
  const remeasureStep = useCallback(() => {
    setTargetResizeTick((tick) => tick + 1);
  }, []);
  const capturePopper = useTutorialTooltipReposition(
    run && !isPaused,
    typeof activeTarget === 'string' ? activeTarget : null,
    remeasureStep
  );

  // Force Joyride to re-measure the spotlight when the active step's target resizes
  // (e.g. a CollapsibleSection expanding). Without this, the spotlight stays at the
  // initial measurement and visually drifts off the target. See issue #1012.
  useEffect(() => {
    if (!run || isPaused) return;
    const step = steps[stepIndex];
    if (!step?.target) return;
    const el = typeof step.target === 'string'
      ? document.querySelector(step.target)
      : step.target;
    if (!(el instanceof Element)) return;
    if (typeof ResizeObserver === 'undefined') return;
    // Skip the initial fire that ResizeObserver delivers on observe(). Reacting
    // to it would bump targetResizeTick, remount Joyride, and the remount's
    // own scroll/relayout can change the target size — fires again — looping
    // during tour startup and breaking visual snapshots.
    let isInitialFire = true;
    const observer = new ResizeObserver(() => {
      if (isInitialFire) {
        isInitialFire = false;
        return;
      }
      setTargetResizeTick((tick) => tick + 1);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [run, isPaused, steps, stepIndex]);

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

  // react-joyride bundles its whole runtime (tour engine + @floating-ui) into a
  // single ~67KB module. TutorialProvider sits in the root layout, so a static
  // import would ship that runtime on every page even though most sessions never
  // start a tour. Load it on first tour start instead, and read its
  // STATUS/ACTIONS/EVENTS enums from the loaded module (issue #1357).
  const ensureJoyrideRuntime = useCallback(async (): Promise<JoyrideModule | null> => {
    if (joyrideRuntimeRef.current) {
      return joyrideRuntimeRef.current;
    }
    try {
      const runtime = await import('react-joyride');
      joyrideRuntimeRef.current = runtime;
      setJoyrideRuntime(runtime);
      return runtime;
    } catch (error) {
      logger.error('Failed to load tour runtime', error);
      return null;
    }
  }, []);

  const startTour = useCallback(async (tourId: TutorialPhase | string, initialStepIndex = 0) => {
    const { steps: loadedSteps, mapping } = await loadTour(tourId);
    
    if (loadedSteps.length > 0) {
      // If resuming, check last step from store if not provided explicitly
      // Safe check for phase existence
      const isPhase = tourId in tutorialProgress.phases;
      const phaseData = isPhase ? tutorialProgress.phases[tourId as TutorialPhase] : undefined;
      const lastStep = (phaseData && 'lastStep' in phaseData) ? (phaseData as { lastStep: number }).lastStep : 0;

      if (mapping && initialStepIndex === 0) {
        const stepIndices = Object.entries(mapping)
          .filter((entry) => entry[1] === currentWizardStep)
          .map((entry) => parseInt(entry[0], 10));
        const maxIndexForWizardStep = stepIndices.length > 0
          ? Math.max(...stepIndices)
          : null;

        if (maxIndexForWizardStep !== null && lastStep > maxIndexForWizardStep) {
          return;
        }
      }

      const runtime = await ensureJoyrideRuntime();
      if (!runtime) {
        return;
      }

      setSteps(loadedSteps);
      setStepMapping(mapping);
      setActiveTour(tourId);
      setPauseReason(null);

      let nextStepIndex = initialStepIndex > 0 ? initialStepIndex : lastStep;

      if (mapping) {
        const mappedWizardStep = mapping[nextStepIndex];
        // Only enforce wizard sync if the current tour step is actually mapped to a wizard step
        if (mappedWizardStep !== undefined && mappedWizardStep !== currentWizardStep) {
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
  }, [tutorialProgress.phases, currentWizardStep, ensureJoyrideRuntime]);

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
    const runtime = await ensureJoyrideRuntime();
    if (!runtime) {
      return;
    }
    // Re-load steps to ensure they are fresh and correctly targeted
    if (activeTour) {
      const { steps: loadedSteps } = await loadTour(activeTour);
      setSteps(loadedSteps);
    }
    setRun(true);
    setIsPaused(false);
    setPauseReason(null);
    missingTargetRef.current = null;
  }, [activeTour, ensureJoyrideRuntime]);

  const handleJoyrideCallback = useCallback((data: CallBackProps) => {
    const runtime = joyrideRuntimeRef.current;
    if (!runtime) return;
    const { STATUS, ACTIONS, EVENTS } = runtime;
    const { status, type, index, action } = data;

    if (status === STATUS.FINISHED || status === STATUS.SKIPPED) {
      setSteps([]);
      setRun(false);
      setIsPaused(false);
      setPauseReason(null);
      missingTargetRef.current = null;
      if (activeTour) {
        if (status === STATUS.FINISHED) {
          if (activeTour === 'characterCreationWizard') {
            completeTutorialPhase('characterCreation');
          } else if (stepMapping) {
            const wizardStepValues = Object.values(stepMapping);
            const maxWizardStep = wizardStepValues.length > 0 ? Math.max(...wizardStepValues) : null;
            const isFinalWizardStep = maxWizardStep !== null && currentWizardStep >= maxWizardStep;
            const isFinalTourStep = steps.length > 0 && index >= steps.length - 1;

            if (isFinalWizardStep && isFinalTourStep) {
              completeTutorialPhase(activeTour as TutorialPhase);
            } else {
              updateTutorialProgress(activeTour as TutorialPhase, { lastStep: index });
            }
          } else {
            // Check if it's a valid phase before completing
            if (activeTour in tutorialProgress.phases) {
              completeTutorialPhase(activeTour as TutorialPhase);
            }
          }
        } else {
          if (activeTour === 'characterCreationWizard') {
            updateTutorialProgress('characterCreation', { skipped: true });
          } else if (activeTour in tutorialProgress.phases) {
            updateTutorialProgress(activeTour as TutorialPhase, { skipped: true });
          }
        }
      }
      setActiveTour(null);
    } else if (type === EVENTS.STEP_BEFORE && action === ACTIONS.PREV) {
      // Some Joyride versions emit STEP_BEFORE on back; keep stepIndex in sync.
      setStepIndex(index);
    } else if (type === EVENTS.STEP_AFTER) {
      const nextIndex = index + (action === ACTIONS.PREV ? -1 : 1);
      
      if (activeTour) {
        if (activeTour in tutorialProgress.phases) {
          updateTutorialProgress(activeTour as TutorialPhase, { lastStep: index });
        }
        setStepIndex(nextIndex);
      }
    } else if (type === EVENTS.TARGET_NOT_FOUND) {
      // Tours without a stepMapping (e.g. firstPlay) have no wizard that will mount
      // the target later, so a missing anchor won't reappear. Skip past the
      // unrenderable step instead of freezing on it — the old early-return left
      // Joyride mounted on a step it couldn't draw (a dark overlay with no tooltip
      // and no way out). Reaching the end completes the phase so onboarding doesn't
      // re-arm every session and isTourActive resolves. With progressive disclosure
      // on (the default), every anchor is present and this never fires; it's the
      // safety net for when the flag is off, where the Tools anchor isn't rendered.
      if (!stepMapping) {
        const nextIndex = index + 1;
        if (Number.isInteger(nextIndex) && nextIndex < steps.length) {
          setStepIndex(nextIndex);
        } else {
          if (activeTour && activeTour in tutorialProgress.phases) {
            completeTutorialPhase(activeTour as TutorialPhase);
          }
          stopTour();
        }
        return;
      }

      const mappedWizardStep = stepMapping?.[index];
      // If mappedWizardStep is undefined, it means this tour step isn't tied to a specific wizard step
      // So we assume we are on the "correct" page and it's just a missing element (retry).
      const isSameWizardStep = mappedWizardStep === undefined || mappedWizardStep === currentWizardStep;
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
          pauseTour('missing-target');
        }
      }, 100);
    }
  }, [activeTour, completeTutorialPhase, updateTutorialProgress, pauseTour, stopTour, stepMapping, currentWizardStep, steps, tutorialProgress.phases]);
  
  const lastWizardStepRef = useRef<number | null>(null);

  // Poll for missing target elements when tour is paused waiting for them
  useTourTargetRetry({
    isPaused,
    pauseReason,
    stepMapping,
    missingTargetRef,
    isPausedRef,
    resumeTour,
  });

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
      if (activeTour === 'characterCreationWizard') {
        updateTutorialProgress('characterCreation', { skipped: true });
      } else if (activeTour in tutorialProgress.phases) {
        updateTutorialProgress(activeTour as TutorialPhase, { skipped: true });
      }
    }
    setActiveTour(null);
  }, [activeTour, updateTutorialProgress, tutorialProgress.phases]);

  // Expose startTour for testing
  useEffect(() => {
    if (process.env.NODE_ENV === 'development' || isPlaywrightEnv()) {
      window.__TEST_START_TOUR__ = startTour;
      window.__TEST_STOP_TOUR__ = stopTour;
    }
  }, [startTour, stopTour]);

  return (
    <TutorialContext.Provider value={{
      startTour,
      stopTour,
      pauseTour,
      resumeTour,
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
      {steps.length > 0 && run && joyrideRuntime && (() => {
        const Joyride = joyrideRuntime.default;
        const tourOptions = getTourOptions(activeTour || '');
        return (
          <Joyride
            key={`${activeTour}-${isPaused}-${targetResizeTick}`}
            steps={steps}
            run={!isPaused}
            stepIndex={stepIndex}
            continuous={tourOptions.continuous}
            scrollToFirstStep={tourOptions.scrollToFirstStep}
            showProgress={tourOptions.showProgress}
            showSkipButton={tourOptions.showSkipButton}
            disableScrolling={tourOptions.disableScrolling}
            // Joyride's scroll-parent fix writes an inline `overflow` onto
            // whichever ancestor scrolls, and on the play surface that ancestor
            // is `.manuscript-overlay-main`. Overriding its `overflow-y: auto`
            // lets the story escape its grid row and paint over the action rail,
            // so the tour leaves the choices unreadable from the next turn on.
            disableScrollParentFix
            scrollDuration={prefersReducedMotion ? 0 : undefined}
            floaterProps={{ ...tourOptions.floaterProps, getPopper: capturePopper }}
            styles={joyrideStyles}
            callback={handleJoyrideCallback}
            disableOverlayClose={true}
            spotlightClicks={true}
            scrollOffset={tourOptions.scrollOffset}
          locale={
            stepMapping
              ? { skip: 'Skip tutorial', last: 'Finish tutorial' }
              : undefined
          }
        />
        );
      })()}
    </TutorialContext.Provider>
  );
}
