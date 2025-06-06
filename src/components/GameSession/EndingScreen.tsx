// src/components/GameSession/EndingScreen.tsx

'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useNarrativeStore } from '../../state/narrativeStore';
import { useCharacterStore } from '../../state/characterStore';
import { useWorldStore } from '../../state/worldStore';
import { LoadingState } from '../ui/LoadingState';
import { ErrorDisplay } from '../ui/ErrorDisplay';
import { PageLayout } from '../shared/PageLayout';
import { SectionWrapper } from '../shared/SectionWrapper';
import { CardActionGroup, type CardAction } from '../shared/cards/CardActionGroup';
import Image from 'next/image';

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
  const [endingImage, setEndingImage] = useState<string | null>(null);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);
  const generatedForEndingRef = useRef<string | null>(null);

  const generateEndingImage = useCallback(async () => {
    if (!currentEnding || isGeneratingImage || generatedForEndingRef.current === currentEnding.id) {
      return; // Prevent multiple simultaneous requests or duplicate generation
    }
    
    generatedForEndingRef.current = currentEnding.id; // Mark this ending as being processed
    setIsGeneratingImage(true);
    setImageError(null);
    
    try {
      const character = characters[currentEnding.characterId];
      const world = worlds[currentEnding.worldId];
      
      // Get recent narrative segments for context
      const recentSegments = getSessionSegments(currentEnding.sessionId);
      const recentNarrative = recentSegments
        .slice(-5)
        .map(segment => segment.content);
      
      const response = await fetch('/api/generate-ending-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ending: currentEnding,
          world,
          character,
          recentNarrative
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate ending image');
      }

      const data = await response.json();
      setEndingImage(data.imageUrl);
    } catch (error) {
      console.error('Failed to generate ending image:', error);
      setImageError('Failed to generate ending image');
      generatedForEndingRef.current = null; // Reset on error so user can retry
    } finally {
      setIsGeneratingImage(false);
    }
  }, [currentEnding, isGeneratingImage, characters, worlds, getSessionSegments]);

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
      <PageLayout 
        title="No Ending Available" 
        description="It looks like the story ending wasn't generated properly."
        className="bg-gray-50"
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
      case 'triumphant': // Amber background (#f59e0b)
        return 'text-black'; // Black text for bright amber
      case 'hopeful': // Emerald background (#10b981)  
        return 'text-white'; // White text for emerald
      case 'bittersweet': // Violet background (#8b5cf6)
        return 'text-white'; // White text for violet
      case 'mysterious': // Gray background (#374151)
        return 'text-white'; // White text for dark gray
      case 'tragic': // Dark red background (#991b1b)
        return 'text-white'; // White text for dark red
      default:
        return 'text-white'; // Default to white text
    }
  };

  // Navigation actions using shared CardAction format
  const navigationActions: CardAction[] = [
    {
      key: 'new-story',
      text: 'New Story',
      onClick: () => router.push(`/world/${currentEnding.worldId}/play`),
      variant: 'primary',
      flex: true
    },
    {
      key: 'new-character', 
      text: 'New Character',
      onClick: () => router.push(`/characters/create?worldId=${currentEnding.worldId}`),
      variant: 'primary',
      flex: true
    },
    {
      key: 'back-to-worlds',
      text: 'Back to Worlds',
      onClick: () => router.push('/worlds'),
      variant: 'primary',
      flex: true
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
                  <p className="text-gray-600 mt-2 text-sm">
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
                  <p className="text-sm">Unable to generate ending image</p>
                  <button 
                    onClick={generateEndingImage}
                    className="mt-2 text-blue-600 hover:text-blue-800 text-sm underline"
                  >
                    Try Again
                  </button>
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
            <div className="text-lg text-gray-800 leading-relaxed whitespace-pre-wrap">
              {currentEnding.epilogue}
            </div>
          </SectionWrapper>

          <div className="grid gap-6 lg:grid-cols-2">
            {/* Character Legacy */}
            <div>
              <SectionWrapper title="Character Legacy" className="bg-white/90 backdrop-blur-sm h-full">
                <div className="text-gray-800 leading-relaxed">
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
                          className="flex items-start space-x-2 text-gray-800"
                        >
                          <span className="text-yellow-500 mt-0.5">★</span>
                          <div>
                            <span className="font-bold">{title}</span>
                            {description && <span>: {description}</span>}
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
            <div className="text-gray-800 leading-relaxed">
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