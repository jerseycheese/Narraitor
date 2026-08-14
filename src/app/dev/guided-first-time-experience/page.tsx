'use client';

import React, { useState } from 'react';
import { GuidedFirstTimeExperience } from '@/components/GuidedFirstTimeExperience';
import { useSessionStore } from '@/state/sessionStore';
import Logger from '@/lib/utils/logger';

const logger = new Logger('GuidedFTEDev');

export default function GuidedFirstTimeExperienceTestHarness() {
  const [resetKey, setResetKey] = useState(0);
  const {
    completeTutorialPhase,
    resetTutorialProgress,
    shouldShowOnboarding,
    isFirstTimeUser,
  } = useSessionStore();

  const showOnboarding = shouldShowOnboarding();

  const handleReset = () => {
    resetTutorialProgress();
    setResetKey(prev => prev + 1);
  };

  const handleMarkCompleted = () => {
    completeTutorialPhase('intro');
    setResetKey(prev => prev + 1);
  };

  const handleClearStorage = async () => {
    // Clear IndexedDB storage completely
    if (typeof window !== 'undefined') {
      try {
        const databases = await indexedDB.databases();
        await Promise.all(
          databases.map(db => {
            if (db.name) {
              const deleteReq = indexedDB.deleteDatabase(db.name);
              return new Promise((resolve, reject) => {
                deleteReq.onsuccess = () => resolve(undefined);
                deleteReq.onerror = () => reject(deleteReq.error);
              });
            }
          })
        );
        
        // Also clear localStorage
        localStorage.clear();
        
        // Force page reload to reinitialize stores
        window.location.reload();
      } catch (error) {
        logger.error('Error clearing storage:', error);
      }
    }
  };

  return (
    <div>
      <div>
        <div>
          <h1>
            Guided First-Time Experience Test Harness
          </h1>
          
          <div>
            <div>
              <span>
                Onboarding Status:
              </span>
              <span className={`${
                !showOnboarding
                  ? ''
                  : ''
              }`}>
                {!showOnboarding ? 'Completed' : 'Not Completed'}
              </span>
            </div>

            {/* Debug info */}
            <div>
              shouldShow: {showOnboarding.toString()} |
              isFirstTime: {isFirstTimeUser?.().toString() || 'undefined'}
            </div>
            
            <button
              onClick={handleReset}
            >
              Reset (Show Onboarding)
            </button>
            
            <button
              onClick={handleMarkCompleted}
            >
              Mark Completed (Hide Onboarding)
            </button>
            
            <button
              onClick={handleClearStorage}
            >
              Clear All Storage & Reload
            </button>
          </div>
          
          <div>
            <h2>Test Instructions:</h2>
            <ul>
              <li>• Test the complete 3-step onboarding flow</li>
              <li>• Verify skip functionality works correctly</li>
              <li>• Test mobile responsiveness by resizing window</li>
              <li>• Ensure progress indicator updates correctly</li>
              <li>• Verify world creation and navigation at completion</li>
              <li>• Test that onboarding doesn&apos;t show when marked completed</li>
            </ul>
          </div>
        </div>
      </div>
      
      <div>
        <div>
          <div key={resetKey} >
            <GuidedFirstTimeExperience />

            {!showOnboarding && (
              <div>
                <div>
                  <h3>
                    Onboarding Completed
                  </h3>
                  <p>
                    The guided experience is hidden for returning users.
                  </p>
                  <button
                    onClick={handleReset}
                  >
                    Reset to Test Again
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
