'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useTutorial } from '@/components/TutorialProvider';
import { useSessionStore } from '@/state/sessionStore';
import { Button } from '@/components/ui/button';
import { HelpCircle, RefreshCw, CheckCircle } from 'lucide-react';
import Logger from '@/lib/utils/logger';

const logger = new Logger('TutorialMenu');
const RESET_DELAY_MS = 100;

export function TutorialMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { resetTutorial } = useTutorial();
  const tutorialProgress = useSessionStore((state) => state.tutorialProgress);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () =>
        document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const handleRestart = async () => {
    if (confirm('Are you sure you want to reset all tutorial progress?')) {
      try {
        resetTutorial();
        setIsOpen(false);
        // Best-effort delay for IndexedDB persist to complete
        // Zustand persist doesn't expose a flush/ready API for writes,
        // so we use a small delay. 100ms is generally sufficient for
        // IndexedDB operations on modern browsers.
        await new Promise((resolve) => setTimeout(resolve, RESET_DELAY_MS));
        window.location.reload();
      } catch (error) {
        logger.error('Failed to reset tutorial', error);
      }
    }
  };

  return (
    <div ref={dropdownRef}>
      <Button
        onClick={() => setIsOpen(!isOpen)}
        variant="ghost"
        size="icon"
        aria-label="Help & Tutorials"
      >
        <HelpCircle />
      </Button>

      {isOpen && (
        <div>
          <div>
            <h4>Tutorial Progress</h4>
          </div>

          <div>
            {Object.entries(tutorialProgress.phases).map(([phase, data]) => (
              <div key={phase}>
                <span>{phase.replace(/([A-Z])/g, '$1')}</span>
                {data.completed ? (
                  <CheckCircle />
                ) : data.skipped ? (
                  <span>Skipped</span>
                ) : 'lastStep' in data &&
                  (data as { lastStep: number }).lastStep > 0 ? (
                  <span>In Progress</span>
                ) : (
                  <span>Not Started</span>
                )}
              </div>
            ))}
          </div>

          <div>
            <Button variant="ghost" onClick={handleRestart}>
              <RefreshCw />
              Reset All Tutorials
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
