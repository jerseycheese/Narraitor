'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { worldStore } from '@/state/worldStore';
import { CharacterCreationWizard } from '@/components/CharacterCreationWizard';

export default function CharacterCreatePage() {
  const router = useRouter();
  const { currentWorldId } = worldStore();

  if (!currentWorldId) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">Create Character</h1>
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-gray-600 mb-4">Please select a world first before creating a character.</p>
            <button
              onClick={() => router.push('/worlds')}
              className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Go to Worlds
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
          <CharacterCreationWizard worldId={currentWorldId} />
        </div>
      </div>
    </div>
  );
}