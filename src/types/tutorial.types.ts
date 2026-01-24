import { Step } from 'react-joyride';

export interface TutorialProgress {
  phases: {
    intro: { completed: boolean; skipped: boolean };
    worldCreation: { completed: boolean; skipped: boolean; lastStep: number };
    worldGeneration: { completed: boolean; skipped: boolean; lastStep: number };
    characterCreation: { completed: boolean; skipped: boolean; lastStep: number };
    firstPlay: { completed: boolean; skipped: boolean };
  };
  dismissedHints: string[];
  lastActiveStep: string | null;
}

export type TutorialPhase = 'intro' | 'worldCreation' | 'worldGeneration' | 'characterCreation' | 'firstPlay';

export interface TutorialStep extends Step {
  advanceOn?: {
    selector: string;
    event: 'click' | 'change' | 'keydown';
  };
}
