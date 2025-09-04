// src/components/GameSession/EndingScreen.tsx

'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Star } from 'lucide-react';
import { useNarrativeStore } from '@/state/narrativeStore';
import { useCharacterStore } from '@/state/characterStore';
import { useWorldStore } from '@/state/worldStore';
import { useSessionStore } from '@/state/sessionStore';
import { useAsyncOperation } from '@/lib/hooks/useAsyncOperation';
import { LoadingState } from '@/components/ui/LoadingState';
import { ErrorDisplay } from '@/components/ui/ErrorDisplay';
import { PageLayout } from '@/components/shared/PageLayout';
import { SectionWrapper } from '@/components/shared/SectionWrapper';
import { CardActionGroup, type CardAction } from '@/components/shared/cards/CardActionGroup';
import Image from 'next/image';
import { Button } from '@/components/ui/button';


/**
 * EndingScreen displays the story ending with narrative closure
 * Uses shared components (PageLayout, SectionWrapper, CardActionGroup) and existing tone-based styling
 * Following our TDD approach and acceptance criteria
 */
export function EndingScreen() {
  const router = useRouter();
  const { 
    currentEnding, 
    isGeneratingEnding, 
    endingError, 
    // clearEnding, // Not currently used
    getSessionSegments 
  } = useNarrativeStore();
  
  const { characters } = useCharacterStore();
  const { worlds } = useWorldStore();
  
  // State for ending image generation
  const generatedForEndingRef = useRef<string | null>(null);

  // Use async operation hook for image generation
  const {
    execute: generateEndingImageExecute,
    isLoading: isGeneratingImage,
    data: endingImage,
    error: imageError
  } = useAsyncOperation(
    async (ending: typeof currentEnding) => {
      if (!ending || generatedForEndingRef.current === ending.id) {
        throw new Error('Invalid ending or already generated');
      }
      
      generatedForEndingRef.current = ending.id;
      
      const character = characters[ending.characterId];
      const world = worlds[ending.worldId];
      
      // Get recent narrative segments for context
      const recentSegments = getSessionSegments(ending.sessionId);
      const recentNarrative = recentSegments
        .slice(-5)
        .map(segment => segment.content);
      
      const response = await fetch('/api/generate-ending-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ending,
          world,
          character,
          recentNarrative
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate ending image');
      }

      const data = await response.json();
      return data.imageUrl;
    },
    {
      onError: (error) => {
        console.error('Failed to generate ending image:', error);
        generatedForEndingRef.current = null; // Reset on error so user can retry
      }
    }
  );

  const generateEndingImage = useCallback(() => {
    if (currentEnding && !isGeneratingImage) {
      generateEndingImageExecute(currentEnding);
    }
  }, [currentEnding, isGeneratingImage, generateEndingImageExecute]);

  // Generate ending image when ending is available (but not in Storybook or test environment)
  useEffect(() => {
    // Skip image generation in Storybook or test environment
    const isStorybook = typeof window !== 'undefined' && 
      (window.location.port === '6006' || window.location.hostname.includes('storybook'));
    const isTest = process.env.NODE_ENV === 'test';
    
    if (currentEnding && 
        !endingImage && 
        !isGeneratingImage && 
        !isStorybook &&
        !isTest &&
        generatedForEndingRef.current !== currentEnding.id) {
      generateEndingImage();
    }
  }, [currentEnding, endingImage, isGeneratingImage, generateEndingImage]); // Include all dependencies

  // Note: Removed automatic cleanup to prevent clearing ending during development re-renders
  // The ending should be cleared manually when navigating away

  // Show loading state while generating
  if (isGeneratingEnding) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="text-center space-y-4">
          <LoadingState message="Generating your story ending..." />
          <p className="text-gray-700">
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
      <PageLayout 
        title="No Ending Available" 
        description="It looks like the story ending wasn't generated properly."
        className="bg-gray-100"
      >
        <div className="text-center">
          <CardActionGroup 
            primaryActions={[{
              key: 'return-home',
              text: 'Return to Home',
              onClick: () => router.push('/worlds'),
              variant: 'primary'
            }]}
          />
        </div>
      </PageLayout>
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

  // Determine header text color based on tone for better contrast
  const getHeaderTextColor = (tone: string) => {
    switch (tone) {
      case 'triumphant': // Amber background (amber-500: #f59e0b)
        return 'text-black'; // Black text for bright amber
      case 'hopeful': // Green background (green-500: #22c55e)
        return 'text-white'; // White text for green
      case 'bittersweet': // Blue background (blue-700: #1d4ed8)
        return 'text-white'; // White text for blue
      case 'mysterious': // Gray background (gray-700: #374151)
        return 'text-white'; // White text for dark gray
      case 'tragic': // Red background (red-700: #b91c1c)
        return 'text-white'; // White text for dark red
      default:
        return 'text-white'; // Default to white text
    }
  };

  // Navigation actions using shared CardAction format
  const navigationActions: CardAction[] = [
    {
      key: 'back-to-worlds',
      text: 'Back to Worlds',
      onClick: () => router.push('/worlds'),
      variant: 'primary',
      flex: true,
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    },
    {
      key: 'new-character', 
      text: 'New Character',
      onClick: () => router.push(`/characters/create?worldId=${currentEnding.worldId}`),
      variant: 'primary',
      flex: true,
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      )
    },
    {
      key: 'new-story',
      text: 'New Story',
      onClick: async () => {
        // Set the current character, end the session, clear the ending, then navigate to play
        const { setCurrentCharacter } = useCharacterStore.getState();
        const { clearEnding, clearSessionSegments, clearSessionDecisions } = useNarrativeStore.getState();
        const { endSession } = useSessionStore.getState();
        
        // End the current session if it exists
        if (currentEnding.sessionId) {
          clearSessionSegments(currentEnding.sessionId);
          clearSessionDecisions(currentEnding.sessionId);
        }
        
        // End the current session to save it
        await endSession();
        
        setCurrentCharacter(currentEnding.characterId);
        clearEnding();
        router.push(`/world/${currentEnding.worldId}/play?fresh=true`);
      },
      variant: 'success',
      flex: true,
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    }
  ];

  return (
    <>
      {/* Screen reader announcement */}
      <div 
        className="sr-only" 
        role="status" 
        aria-live="polite"
        aria-label="story complete"
      >
        Story Complete: {currentEnding.tone} ending
      </div>

      <PageLayout
        title="The End"
        description={`${character?.name || 'Unknown Hero'} • ${world?.name || 'Unknown Realm'}${currentEnding.playTime ? ` • Play Time: ${formatPlayTime(currentEnding.playTime)}` : ''}`}
        maxWidth="4xl"
        className={`ending-screen ending-${currentEnding.tone} ${getHeaderTextColor(currentEnding.tone)}`}
      >
        <div className="space-y-6">
          {/* Ending Image */}
          <div className="mb-8 rounded-lg overflow-hidden shadow-lg">
            {isGeneratingImage ? (
              <div className="w-full h-48 md:h-64 lg:h-80 bg-gray-100 flex items-center justify-center">
                <div className="text-center">
                  <LoadingState message="Generating ending image..." />
                  <p className="text-gray-700 mt-2 text-sm">
                    Creating a visual representation of your story&apos;s conclusion...
                  </p>
                </div>
              </div>
            ) : endingImage ? (
              <Image 
                src={endingImage} 
                alt={`${currentEnding.tone} ending for ${character?.name || 'the hero'}'s story`}
                width={800}
                height={400}
                className="w-full h-48 md:h-64 lg:h-80 object-cover"
              />
            ) : imageError ? (
              <div className="w-full h-48 md:h-64 lg:h-80 bg-gray-100 flex items-center justify-center">
                <div className="text-center text-gray-500">
                  <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 002 2z" />
                  </svg>
                  <p className="text-sm">{imageError.message || 'Unable to generate ending image'}</p>
                  <Button 
                    onClick={generateEndingImage}
                    variant="link"
                    size="sm"
                    className="mt-2 text-sm"
                  >
                    Try Again
                  </Button>
                </div>
              </div>
            ) : (
              <div className="w-full h-48 md:h-64 lg:h-80 bg-gray-100 flex items-center justify-center">
                <div className="text-center text-gray-500">
                  <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 002 2z" />
                  </svg>
                  <p className="text-sm">Ending image</p>
                </div>
              </div>
            )}
          </div>
          {/* Epilogue */}
          <SectionWrapper title="Epilogue" className="bg-white/95 backdrop-blur-sm">
            <div className="text-lg text-gray-900 leading-relaxed whitespace-pre-wrap">
              {currentEnding.epilogue}
            </div>
          </SectionWrapper>

          <div className="grid gap-6 lg:grid-cols-2">
            {/* Character Legacy */}
            <div>
              <SectionWrapper title="Character Legacy" className="bg-white/90 backdrop-blur-sm h-full">
                <div className="text-gray-900 leading-relaxed">
                  {currentEnding.characterLegacy}
                </div>
              </SectionWrapper>
            </div>

            {/* Achievements */}
            {currentEnding.achievements && currentEnding.achievements.length > 0 && (
              <div>
                <SectionWrapper title="Achievements" className="bg-white/90 backdrop-blur-sm h-full">
                  <div className="space-y-2">
                    {currentEnding.achievements.map((achievement, index) => {
                      // Split achievement into title and description
                      const colonIndex = achievement.indexOf(':');
                      const title = colonIndex > 0 ? achievement.substring(0, colonIndex) : achievement;
                      const description = colonIndex > 0 ? achievement.substring(colonIndex + 1).trim() : '';
                      
                      return (
                        <div
                          key={index}
                          className="flex items-start justify-start space-x-2 text-gray-900 p-2"
                        >
                          <Star className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                          <div className="min-w-0 flex-1 break-words">
                            <span className="font-bold break-words">{title}</span>
                            {description && <span className="break-words">: {description}</span>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </SectionWrapper>
              </div>
            )}
          </div>

          {/* World Impact */}
          <SectionWrapper title="Impact on the World" className="bg-white/90 backdrop-blur-sm">
            <div className="text-gray-900 leading-relaxed">
              {currentEnding.worldImpact}
            </div>
          </SectionWrapper>

          {/* Next Steps */}
          <SectionWrapper title="What's Next?" className="bg-white/95 backdrop-blur-sm">
            <CardActionGroup
              primaryActions={navigationActions}
              layout="horizontal"
              gap="lg"
            />
          </SectionWrapper>
        </div>
      </PageLayout>

    </>
  );
}