// src/components/GameSession/EndingScreen.tsx

'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useNarrativeStore } from '../../state/narrativeStore';
import { useCharacterStore } from '../../state/characterStore';
import { useWorldStore } from '../../state/worldStore';
import { LoadingState } from '../ui/LoadingState';
import { ErrorDisplay } from '../ui/ErrorDisplay';

/**
 * EndingScreen displays the story ending with narrative closure
 * Following our TDD approach and acceptance criteria
 */
export function EndingScreen() {
  const router = useRouter();
  const { 
    currentEnding, 
    isGeneratingEnding, 
    endingError, 
    clearEnding 
  } = useNarrativeStore();
  
  const { characters } = useCharacterStore();
  const { worlds } = useWorldStore();

  // Clean up ending when component unmounts
  useEffect(() => {
    return () => {
      clearEnding();
    };
  }, [clearEnding]);

  // Show loading state while generating
  if (isGeneratingEnding) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center space-y-4">
          <LoadingState message="Generating your story ending..." />
          <p className="text-gray-600">
            Please wait while we craft the perfect conclusion to your journey...
          </p>
        </div>
      </div>
    );
  }

  // Handle error state
  if (endingError) {
    return (
      <ErrorDisplay 
        variant="page"
        title="Failed to generate story ending"
        message={endingError || "An unknown error occurred"}
        showRetry={true}
        onRetry={() => router.back()}
      />
    );
  }

  // Handle missing ending data
  if (!currentEnding) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold text-gray-900">No ending data available</h1>
          <p className="text-gray-600">It looks like the story ending wasn&apos;t generated properly.</p>
          <button 
            onClick={() => router.push('/worlds')}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Return to Home
          </button>
        </div>
      </div>
    );
  }

  const character = characters[currentEnding.characterId];
  const world = worlds[currentEnding.worldId];

  const formatPlayTime = (seconds?: number) => {
    if (!seconds) return 'Unknown';
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours} hours${minutes > 0 ? ` ${minutes} minutes` : ''}`;
    }
    return `${minutes} minutes`;
  };

  const handleNewStory = () => {
    router.push(`/play?characterId=${currentEnding.characterId}`);
  };

  const handleNewCharacter = () => {
    router.push(`/characters/create?worldId=${currentEnding.worldId}`);
  };

  const handleBackToWorlds = () => {
    router.push('/worlds');
  };

  return (
    <div 
      className={`min-h-screen bg-gradient-to-br ending-${currentEnding.tone} p-6`}
      data-testid="ending-container"
    >
      {/* Screen reader announcement */}
      <div 
        className="sr-only" 
        role="status" 
        aria-live="polite"
        aria-label="story complete"
      >
        Story Complete: {currentEnding.tone} ending
      </div>

      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-white drop-shadow-lg">
            Story Complete
          </h1>
          <div className="text-xl text-white/90">
            {character?.name || 'Unknown Hero'} • {world?.name || 'Unknown Realm'}
          </div>
          {currentEnding.playTime && (
            <div className="text-lg text-white/80">
              <strong>Play Time:</strong> {formatPlayTime(currentEnding.playTime)}
            </div>
          )}
        </div>

        {/* Main Content */}
        <div className="grid gap-8 md:grid-cols-1 lg:grid-cols-3">
          {/* Epilogue - Full Width */}
          <div className="lg:col-span-3">
            <div className="bg-white/95 backdrop-blur-sm rounded-xl p-6 shadow-lg">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Epilogue</h2>
              <div className="text-lg text-gray-800 leading-relaxed whitespace-pre-wrap">
                {currentEnding.epilogue}
              </div>
            </div>
          </div>

          {/* Character Legacy */}
          <div className="lg:col-span-2">
            <div className="bg-white/90 backdrop-blur-sm rounded-xl p-6 shadow-lg h-full">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Character Legacy</h2>
              <div className="text-gray-800 leading-relaxed">
                {currentEnding.characterLegacy}
              </div>
            </div>
          </div>

          {/* Achievements */}
          {currentEnding.achievements && currentEnding.achievements.length > 0 && (
            <div>
              <div className="bg-white/90 backdrop-blur-sm rounded-xl p-6 shadow-lg h-full">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Achievements</h2>
                <div className="space-y-2">
                  {currentEnding.achievements.map((achievement, index) => (
                    <div 
                      key={index}
                      className="flex items-center space-x-2 text-gray-800"
                    >
                      <span className="text-yellow-500">★</span>
                      <span>{achievement}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* World Impact */}
          <div className="lg:col-span-3">
            <div className="bg-white/90 backdrop-blur-sm rounded-xl p-6 shadow-lg">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Impact on the World</h2>
              <div className="text-gray-800 leading-relaxed">
                {currentEnding.worldImpact}
              </div>
            </div>
          </div>
        </div>

        {/* Next Steps */}
        <div className="bg-white/95 backdrop-blur-sm rounded-xl p-6 shadow-lg">
          <h2 className="text-xl font-bold text-gray-900 mb-6 text-center">
            What&apos;s Next?
          </h2>
          <div className="grid gap-4 md:grid-cols-3">
            <button
              onClick={handleNewStory}
              className="flex flex-col items-center space-y-2 p-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              <span className="text-2xl">🎭</span>
              <span className="font-semibold">New Story</span>
              <span className="text-sm text-blue-100 text-center">
                Continue with {character?.name || 'this character'}
              </span>
            </button>

            <button
              onClick={handleNewCharacter}
              className="flex flex-col items-center space-y-2 p-4 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
            >
              <span className="text-2xl">⚔️</span>
              <span className="font-semibold">New Character</span>
              <span className="text-sm text-green-100 text-center">
                Create a hero for {world?.name || 'this world'}
              </span>
            </button>

            <button
              onClick={handleBackToWorlds}
              className="flex flex-col items-center space-y-2 p-4 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
            >
              <span className="text-2xl">🌍</span>
              <span className="font-semibold">Back to Worlds</span>
              <span className="text-sm text-gray-100 text-center">
                Explore other realms
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}