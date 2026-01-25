'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useTutorial } from '@/components/TutorialProvider';
import { Button } from '@/components/ui/button';
import { HelpCircle, RefreshCw } from 'lucide-react';
import Logger from '@/lib/utils/logger';
import { TutorialProgressWidget } from '@/components/TutorialProgress/TutorialProgressWidget';
import {
  headerDropdownDividerClass,
  headerDropdownHeaderClass,
  headerDropdownMenuClass,
  headerDropdownTriggerClass,
} from './navigationDropdownStyles';

const logger = new Logger('TutorialMenu');

export function TutorialMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const { resetTutorial } = useTutorial();
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
        await new Promise(resolve => setTimeout(resolve, 100));
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
        className={headerDropdownTriggerClass}
        aria-label="Help & Tutorials"
      >
        <HelpCircle className="w-5 h-5" />
      </Button>
      
      {isOpen && (
        <div className={`${headerDropdownMenuClass} w-64 py-0`}>
          <div className={headerDropdownHeaderClass}>
            <h4 className="font-semibold text-sm">Tutorial Progress</h4>
          </div>
          
          <div className="px-4 py-3">
            <TutorialProgressWidget variant="menu" />
          </div>
          
          <div className={headerDropdownDividerClass}>
            <Button
              variant="ghost"
              onClick={handleRestart}
              className="w-full justify-start px-4 py-2 text-red-600 hover:text-red-700 hover:bg-gray-50 h-auto font-normal rounded-none"
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
