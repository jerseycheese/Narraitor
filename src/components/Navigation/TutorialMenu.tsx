'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useTutorial } from '@/components/TutorialProvider';
import { useSessionStore } from '@/state/sessionStore';
import { Button } from '@/components/ui/button';
import { HelpCircle, RefreshCw, CheckCircle } from 'lucide-react';

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
      resetTutorial();
      setIsOpen(false);
      // Best-effort delay for IndexedDB persist to complete
      // Zustand persist doesn't expose a flush/ready API for writes,
      // so we use a small delay. 100ms is generally sufficient for
      // IndexedDB operations on modern browsers.
      await new Promise(resolve => setTimeout(resolve, 100));
      window.location.reload(); 
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <Button
        onClick={() => setIsOpen(!isOpen)}
        variant="ghost"
        size="icon"
        className="text-gray-300 hover:text-white"
        aria-label="Help & Tutorials"
      >
        <HelpCircle className="w-5 h-5" />
      </Button>
      
      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-white rounded-md shadow-lg z-50 py-2 text-gray-900 border border-gray-200">
          <div className="px-4 py-2 border-b border-gray-100">
            <h4 className="font-semibold text-sm">Tutorial Progress</h4>
          </div>
          
          <div className="py-2">
            {Object.entries(tutorialProgress.phases).map(([phase, data]) => (
              <div key={phase} className="px-4 py-1.5 flex items-center justify-between text-sm">
                <span className="capitalize">{phase.replace(/([A-Z])/g, ' $1')}</span>
                {data.completed ? (
                  <CheckCircle className="w-4 h-4 text-green-500" />
                ) : data.skipped ? (
                  <span className="text-xs text-gray-400">Skipped</span>
                ) : ('lastStep' in data && (data as any).lastStep > 0) ? (
                  <span className="text-xs text-blue-500">In Progress</span>
                ) : (
                  <span className="text-xs text-gray-400">Not Started</span>
                )}
              </div>
            ))}
          </div>
          
          <div className="border-t border-gray-100 mt-1 pt-1">
            <button
              onClick={handleRestart}
              className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-50 flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Reset All Tutorials
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
