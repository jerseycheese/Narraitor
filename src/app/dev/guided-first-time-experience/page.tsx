'use client';

import React, { useState } from 'react';
import { GuidedFirstTimeExperience } from '@/components/GuidedFirstTimeExperience';
import { useSessionStore } from '@/state/sessionStore';

export default function GuidedFirstTimeExperienceTestHarness() {
  const [resetKey, setResetKey] = useState(0);
  const {
    completeTutorialPhase,
    resetTutorialProgress,
    shouldShowOnboarding,
    isFirstTimeUser,
  } = useSessionStore();

  const isCompleted = !shouldShowOnboarding();
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
        console.error('Error clearing storage:', error);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <h1 className="text-xl font-semibold text-gray-900 mb-4">
            Guided First-Time Experience Test Harness
          </h1>
          
          <div className="flex items-center gap-4 mb-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700">
                Onboarding Status:
              </span>
              <span className={`px-2 py-1 rounded text-xs font-medium ${
<<<<<<< HEAD
                isCompleted 
                  ? 'bg-green-100 text-green-700' 
                  : 'bg-amber-100 text-amber-700'
              }`}>
                {isCompleted ? 'Completed' : 'Not Completed'}
=======
                !showOnboarding 
                  ? 'bg-green-100 text-green-700' 
                  : 'bg-amber-100 text-amber-700'
              }`}>
                {!showOnboarding ? 'Completed' : 'Not Completed'}
>>>>>>> ef6bd1f1 (test: visual regression suite and dev tools)
              </span>
            </div>
            
            {/* Debug info */}
            <div className="text-xs text-gray-500">
<<<<<<< HEAD
              shouldShow: {shouldShowOnboarding().toString()} | 
              isFirstTime: {isFirstTimeUser().toString()}
=======
              shouldShow: {showOnboarding.toString()} | 
              isFirstTime: {isFirstTimeUser?.().toString() || 'undefined'}
>>>>>>> ef6bd1f1 (test: visual regression suite and dev tools)
            </div>
            
            <button
              onClick={handleReset}
              className="px-3 py-1 bg-blue-500 hover:bg-blue-700 text-white text-sm font-medium rounded transition-colors"
            >
              Reset (Show Onboarding)
            </button>
            
            <button
              onClick={handleMarkCompleted}
              className="px-3 py-1 bg-gray-700 hover:bg-gray-700 text-white text-sm font-medium rounded transition-colors"
            >
              Mark Completed (Hide Onboarding)
            </button>
            
            <button
              onClick={handleClearStorage}
              className="px-3 py-1 bg-red-500 hover:bg-red-700 text-white text-sm font-medium rounded transition-colors"
            >
              Clear All Storage & Reload
            </button>
          </div>
          
          <div className="bg-blue-50 rounded-lg p-4">
            <h2 className="font-semibold text-blue-900 mb-2">Test Instructions:</h2>
            <ul className="text-sm text-blue-900 space-y-1">
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
      
      <div className="max-w-4xl mx-auto p-8">
        <div className="bg-background rounded-lg border shadow-sm">
          <div key={resetKey} className="p-8">
            <GuidedFirstTimeExperience />
            
<<<<<<< HEAD
            {isCompleted && (
=======
            {!showOnboarding && (
>>>>>>> ef6bd1f1 (test: visual regression suite and dev tools)
              <div className="text-center py-8">
                <div className="bg-gray-100 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Onboarding Completed
                  </h3>
                  <p className="text-gray-700 mb-4">
                    The guided experience is hidden for returning users.
                  </p>
                  <button
                    onClick={handleReset}
                    className="px-4 py-2 bg-blue-500 hover:bg-blue-700 text-white font-medium rounded transition-colors"
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
