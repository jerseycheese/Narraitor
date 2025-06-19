'use client';

import React, { useState } from 'react';
import { GuidedFirstTimeExperience } from '@/components/GuidedFirstTimeExperience';
import { sessionStore } from '@/state/sessionStore';

export default function GuidedFirstTimeExperienceTestHarness() {
  const [resetKey, setResetKey] = useState(0);
  const { setOnboardingCompleted, onboardingCompleted } = sessionStore();

  const handleReset = () => {
    setOnboardingCompleted(false);
    setResetKey(prev => prev + 1);
  };

  const handleMarkCompleted = () => {
    setOnboardingCompleted(true);
    setResetKey(prev => prev + 1);
  };

  return (
    <div className="min-h-screen bg-gray-50">
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
                onboardingCompleted 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-yellow-100 text-yellow-800'
              }`}>
                {onboardingCompleted ? 'Completed' : 'Not Completed'}
              </span>
            </div>
            
            <button
              onClick={handleReset}
              className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded transition-colors"
            >
              Reset (Show Onboarding)
            </button>
            
            <button
              onClick={handleMarkCompleted}
              className="px-3 py-1 bg-gray-600 hover:bg-gray-700 text-white text-sm font-medium rounded transition-colors"
            >
              Mark Completed (Hide Onboarding)
            </button>
          </div>
          
          <div className="bg-blue-50 rounded-lg p-4">
            <h2 className="font-semibold text-blue-900 mb-2">Test Instructions:</h2>
            <ul className="text-sm text-blue-800 space-y-1">
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
        <div className="bg-white rounded-lg shadow-lg">
          <div key={resetKey} className="p-8">
            <GuidedFirstTimeExperience />
            
            {onboardingCompleted && (
              <div className="text-center py-8">
                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Onboarding Completed
                  </h3>
                  <p className="text-gray-600 mb-4">
                    The guided experience is hidden for returning users.
                  </p>
                  <button
                    onClick={handleReset}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded transition-colors"
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