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
  const tutorialProgress = useSessionStore(state => state.tutorialProgress);
  
  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
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
        await new Promise(resolve => setTimeout(resolve, RESET_DELAY_MS));
        window.location.reload(); 
      } catch (error) {
        logger.error('Failed to reset tutorial', error);
      }
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <Button
        onClick={() => setIsOpen(!isOpen)}
        variant="ghost"
        size="icon"
        className="text-gray-300 hover:text-white hover:bg-gray-700"
        aria-label="Help & Tutorials"
      >
        <HelpCircle className="w-5 h-5" />
      </Button>
      
      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-popover text-popover-foreground rounded-md shadow-lg z-50 py-2 border border-border">
          <div className="px-4 py-2 border-b border-border">
            <h4 className="font-semibold text-sm">Tutorial Progress</h4>
          </div>
          
          <div className="py-2">
            {Object.entries(tutorialProgress.phases).map(([phase, data]) => (
              <div key={phase} className="px-4 py-1.5 flex items-center justify-between text-sm">
                <span className="capitalize">{phase.replace(/([A-Z])/g, ' $1')}</span>
                {data.completed ? (
                  <CheckCircle className="w-4 h-4 text-success" />
                ) : data.skipped ? (
                  <span className="text-xs text-muted-foreground">Skipped</span>
                ) : ('lastStep' in data && (data as { lastStep: number }).lastStep > 0) ? (
                  <span className="text-xs text-info">In Progress</span>
                ) : (
                  <span className="text-xs text-muted-foreground">Not Started</span>
                )}
              </div>
            ))}
          </div>
          
          <div className="border-t border-border mt-1 pt-1">
            <Button
              variant="ghost"
              onClick={handleRestart}
              className="w-full justify-start px-4 py-2 text-destructive hover:text-destructive/90 hover:bg-accent h-auto font-normal rounded-none"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Reset All Tutorials
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
