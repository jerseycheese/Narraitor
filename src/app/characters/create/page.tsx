'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { worldStore } from '@/state/worldStore';
import { CharacterCreationWizard } from '@/components/CharacterCreationWizard';

export default function CharacterCreatePage() {
  const router = useRouter();
  const { currentWorldId } = worldStore();
  
  // Clear any existing auto-save data when starting a new character
  useEffect(() => {
    if (currentWorldId) {
      const saveKey = `character-creation-${currentWorldId}`;
      sessionStorage.removeItem(saveKey);
    }
  }, [currentWorldId]);

  if (!currentWorldId) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">Create Character</h1>
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <div className="w-20 h-20 bg-amber-100 rounded-full mx-auto mb-4 flex items-center justify-center">
              <svg className="w-10 h-10 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold mb-2">World Required</h2>
            <p className="text-gray-600 mb-2">
              Characters are created within specific worlds.
            </p>
            <p className="text-gray-500 text-sm mb-6">
              Each world defines unique attributes, skills, and rules that shape your characters.
            </p>
            <button
              onClick={() => router.push('/worlds')}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors shadow-md hover:shadow-lg"
            >
              Select a World First
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Create New Character</h1>
        <div className="bg-white rounded-lg shadow p-8">
          <CharacterCreationWizard 
            key={`new-character-${currentWorldId}`} 
            worldId={currentWorldId} 
            initialStep={0} 
          />
        </div>
      </div>
    </div>
  );
}
