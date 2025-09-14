// src/components/GameSession/EndingScreen.tsx

'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Star, Globe, Plus, Play, Image as ImageIcon, ImageOff } from 'lucide-react';
import { useNarrativeStore } from '@/state/narrativeStore';
import { useCharacterStore } from '@/state/characterStore';
import { useWorldStore } from '@/state/worldStore';
import { useSessionStore } from '@/state/sessionStore';
import { LoadingState } from '@/components/ui/LoadingState';
import { ErrorDisplay } from '@/components/ui/ErrorDisplay';
import { SectionWrapper } from '@/components/shared/SectionWrapper';
import { CardActionGroup, type CardAction } from '@/components/shared/cards/CardActionGroup';
import Image from 'next/image';
import { Button } from '@/components/ui/button';


/**
 * EndingScreen displays the story ending with narrative closure
 * Uses shared components (SectionWrapper, CardActionGroup) and existing tone-based styling
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
      <div className="flex items-center justify-center min-h-screen bg-background" role="main" aria-live="polite">
        <div className="text-center space-y-4">
          <LoadingState message="Generating your story ending..." />
          <p className="text-muted-foreground">
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
      <div className="text-center space-y-8">
        <header>
          <h1 className="text-4xl font-bold mb-4">No Ending Available</h1>
          <p className="opacity-90">It looks like the story ending wasn&apos;t generated properly.</p>
        </header>
        <CardActionGroup 
          primaryActions={[{
            key: 'return-home',
            text: 'Return to Home',
            onClick: () => router.push('/worlds'),
            variant: 'primary'
          }]}
        />
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

  // Determine header text color based on tone for better contrast and accessibility
  const getHeaderTextColor = (tone: string) => {
    switch (tone) {
      case 'triumphant': // Amber background - needs dark text for proper contrast
        return 'text-foreground'; // Use semantic foreground color
      case 'hopeful': // Green background - needs light text
        return 'text-primary-foreground'; // Use primary foreground for contrast
      case 'mysterious': // Dark gray background - needs light text
        return 'text-primary-foreground'; // Use primary foreground for contrast
      case 'tragic': // Red background - needs light text
        return 'text-primary-foreground'; // Use primary foreground for contrast
      default:
        return 'text-primary-foreground'; // Default to high contrast text
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
      icon: (<Globe className="w-4 h-4" aria-hidden="true" />)
    },
    {
      key: 'new-character', 
      text: 'New Character',
      onClick: () => router.push(`/characters/create?worldId=${currentEnding.worldId}`),
      variant: 'primary',
      flex: true,
      icon: (<Plus className="w-4 h-4" aria-hidden="true" />)
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
        router.push(`/worlds/${currentEnding.worldId}/play?fresh=true`);
      },
      variant: 'success',
      flex: true,
      icon: (<Play className="w-4 h-4" aria-hidden="true" />)
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

      <div className="pb-0">
        {/* Ending Header with tone-based background */}
        <div className={`p-4 sm:py-8 ending-${currentEnding.tone} ${getHeaderTextColor(currentEnding.tone)} rounded-lg shadow-lg mb-8`}>
          <header>
            <h1 className="text-4xl font-bold mb-4">
              The End
            </h1>
            <p className="opacity-90">
              {`${character?.name || 'Unknown Hero'} • ${world?.name || 'Unknown Realm'}${currentEnding.playTime ? ` • Play Time: ${formatPlayTime(currentEnding.playTime)}` : ''}`}
            </p>
          </header>
        </div>
        <div className="space-y-8">
          {/* Ending Image */}
          <section 
            className="rounded-lg overflow-hidden shadow-lg" 
            aria-label="Story ending illustration"
          >
            {isGeneratingImage ? (
              <div className="w-full h-48 md:h-64 lg:h-80 bg-muted flex items-center justify-center" role="img" aria-live="polite" aria-label="Generating ending image">
                <div className="text-center">
                  <LoadingState message="Generating ending image..." />
                  <p className="text-muted-foreground mt-2 text-sm">
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
                priority
              />
            ) : imageError ? (
              <div className="w-full h-48 md:h-64 lg:h-80 bg-muted flex items-center justify-center">
                <div className="text-center text-muted-foreground">
                  <ImageOff className="w-12 h-12 mx-auto mb-2" aria-hidden="true" />
                  <p className="text-sm">Unable to generate ending image</p>
                  <Button 
                    onClick={generateEndingImage}
                    variant="link"
                    size="sm"
                    className="mt-2 text-sm"
                    aria-label="Retry generating ending image"
                  >
                    Try Again
                  </Button>
                </div>
              </div>
            ) : (
              <div className="w-full h-48 md:h-64 lg:h-80 bg-muted flex items-center justify-center">
                <div className="text-center text-muted-foreground">
                  <ImageIcon className="w-12 h-12 mx-auto mb-2" aria-hidden="true" />
                  <p className="text-sm">Ending image</p>
                </div>
              </div>
            )}
          </section>

          {/* Epilogue */}
          <section>
            <SectionWrapper title="Epilogue" className="bg-card/95 backdrop-blur-sm border border-border">
              <div className="text-lg text-card-foreground leading-relaxed whitespace-pre-wrap">
                {currentEnding.epilogue}
              </div>
            </SectionWrapper>
          </section>

          <div className="grid gap-8 lg:grid-cols-2">
            {/* Character Legacy */}
            <section>
              <SectionWrapper title="Character Legacy" className="bg-card/90 backdrop-blur-sm border border-border h-full">
                <div className="text-card-foreground leading-relaxed">
                  {currentEnding.characterLegacy}
                </div>
              </SectionWrapper>
            </section>

            {/* Achievements */}
            {currentEnding.achievements && currentEnding.achievements.length > 0 && (
              <section aria-label="Story achievements">
                <SectionWrapper title="Achievements" className="bg-card/90 backdrop-blur-sm border border-border h-full">
                  <ul className="space-y-3" role="list">
                    {currentEnding.achievements.map((achievement, index) => {
                      // Split achievement into title and description
                      const colonIndex = achievement.indexOf(':');
                      const title = colonIndex > 0 ? achievement.substring(0, colonIndex) : achievement;
                      const description = colonIndex > 0 ? achievement.substring(colonIndex + 1).trim() : '';
                      
                      return (
                        <li
                          key={index}
                          className="flex items-start justify-start space-x-3 text-card-foreground p-2"
                        >
                          <Star className="w-5 h-5 text-warning mt-0.5 flex-shrink-0" aria-hidden="true" />
                          <div className="min-w-0 flex-1 break-words">
                            <span className="font-semibold break-words">{title}</span>
                            {description && <span className="block text-muted-foreground text-sm mt-1 break-words">{description}</span>}
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </SectionWrapper>
              </section>
            )}
          </div>

          {/* World Impact */}
          <section>
            <SectionWrapper title="Impact on the World" className="bg-card/90 backdrop-blur-sm border border-border">
              <div className="text-card-foreground leading-relaxed">
                {currentEnding.worldImpact}
              </div>
            </SectionWrapper>
          </section>

          {/* Next Steps */}
          <section>
            <SectionWrapper title="What's Next?" className="bg-card/95 backdrop-blur-sm border border-border">
              <CardActionGroup
                primaryActions={navigationActions}
                layout="horizontal"
                gap="lg"
              />
            </SectionWrapper>
          </section>
        </div>
      </div>

    </>
  );
}