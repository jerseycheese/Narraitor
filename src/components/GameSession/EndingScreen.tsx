// src/components/GameSession/EndingScreen.tsx

'use client';

import React, {
  useEffect,
  useState,
  useRef,
  useCallback,
  useMemo,
} from 'react';
import { useRouter } from 'next/navigation';
import { useShallow } from 'zustand/react/shallow';
import { Play } from 'lucide-react';
import { useNarrativeStore } from '@/state/narrativeStore';
import { useCharacterStore } from '@/state/characterStore';
import { useWorldStore } from '@/state/worldStore';
import { useSessionStore } from '@/state/sessionStore';
import { LoadingState } from '@/components/ui/LoadingState';
import { ErrorDisplay } from '@/components/ui/ErrorDisplay';
import { SectionWrapper } from '@/components/shared/SectionWrapper';
import { CollapsibleSection } from '@/components/ui/CollapsibleSection';
import {
  CardActionGroup,
  type CardAction,
} from '@/components/shared/cards/CardActionGroup';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { buildStoryFromCheckpoints } from '@/lib/narrative/storyCheckpointHelpers';
import { generateEndingImage as requestEndingImage } from '@/lib/api/endingImageApi';
import { capitalize } from '@/lib/utils/formatters';
import { useImageGenerationSupport } from '@/hooks/useImageGenerationSupport';

import Logger from '@/lib/utils/logger';
const logger = new Logger('EndingScreen');

/**
 * EndingScreen displays the story ending with narrative closure
 * Uses shared components (SectionWrapper, CardActionGroup) and existing tone-based styling
 * Following our TDD approach and acceptance criteria
 */
export function EndingScreen() {
  const router = useRouter();
  const imageSupport = useImageGenerationSupport();
  const {
    currentEnding,
    isGeneratingEnding,
    endingError,
    // clearEnding, // Not currently used
    getSessionSegments,
    updateCurrentEnding,
  } = useNarrativeStore();

  // Scope to the entity maps (via useShallow) so the ending screen doesn't
  // re-render on unrelated character/world-store writes.
  const { characters } = useCharacterStore(
    useShallow((state) => ({ characters: state.characters }))
  );
  const { worlds } = useWorldStore(
    useShallow((state) => ({ worlds: state.worlds }))
  );

  // Get story checkpoints for this session (must be called before early returns)
  const worldState = useWorldStore((state) =>
    currentEnding ? state.worldStates[currentEnding.worldId] : undefined
  );
  const sessionCheckpoints = useMemo(
    () =>
      currentEnding
        ? (worldState?.storyCheckpoints ?? []).filter(
            (checkpoint) => checkpoint.sessionId === currentEnding.sessionId
          )
        : [],
    [worldState?.storyCheckpoints, currentEnding]
  );

  // Build complete story from checkpoints
  const fullStory = useMemo(
    () => buildStoryFromCheckpoints(sessionCheckpoints),
    [sessionCheckpoints]
  );

  // State for ending image generation
  const [endingImage, setEndingImage] = useState<string | null>(null);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);
  const generatedForEndingRef = useRef<string | null>(null);

  // Initialize image from currentEnding if available
  useEffect(() => {
    if (currentEnding?.imageUrl && !endingImage) {
      setEndingImage(currentEnding.imageUrl);
    }
  }, [currentEnding?.imageUrl, endingImage]);

  const generateEndingImage = useCallback(async () => {
    if (
      !currentEnding ||
      isGeneratingImage ||
      generatedForEndingRef.current === currentEnding.id
    ) {
      return; // Prevent multiple simultaneous requests or duplicate generation
    }

    // Check if image URL already exists on the ending
    if (currentEnding.imageUrl) {
      setEndingImage(currentEnding.imageUrl);
      generatedForEndingRef.current = currentEnding.id;
      return;
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
        .map((segment) => segment.content);

      const data = await requestEndingImage({
        ending: currentEnding,
        world,
        characterName: character?.name,
        recentNarrative,
      });
      setEndingImage(data.imageUrl);

      // Update the ending in the store with the image URL
      // Use functional update to avoid race conditions with stale closures
      const endingIdToUpdate = currentEnding.id;
      updateCurrentEnding((current) => {
        // Only update if this is still the same ending
        if (!current || current.id !== endingIdToUpdate) {
          return current;
        }
        return {
          ...current,
          imageUrl: data.imageUrl,
        };
      });
    } catch (error) {
      logger.error('Failed to load ending image:', error);
      setImageError("Couldn't load the ending image.");
      generatedForEndingRef.current = null; // Reset on error so user can retry
    } finally {
      setIsGeneratingImage(false);
    }
  }, [
    currentEnding,
    isGeneratingImage,
    characters,
    worlds,
    getSessionSegments,
    updateCurrentEnding,
  ]);

  // Ending image generation is purely decorative and manually triggered
  // (placeholder "Generate Image" button / error-state "Try Again") rather
  // than auto-firing on mount — it's an extra Gemini round-trip the player
  // hasn't asked for.

  // Note: Removed automatic cleanup to prevent clearing ending during development re-renders
  // The ending should be cleared manually when navigating away

  // Show loading state while generating
  if (isGeneratingEnding) {
    return (
      <div role="main" aria-live="polite">
        <div>
          <LoadingState message="Loading your story ending..." />
          <p>
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
        title="Unable to load story ending"
        message={endingError}
        showRetry={true}
        onRetry={() => router.back()}
      />
    );
  }

  // Handle missing ending data
  if (!currentEnding) {
    return (
      <div>
        <header>
          <h1>No Ending Available</h1>
          <p>It looks like the story ending isn&apos;t available right now.</p>
        </header>
        <CardActionGroup
          primaryActions={[
            {
              key: 'return-home',
              text: 'Return to Home',
              onClick: () => router.push('/worlds'),
              variant: 'primary',
            },
          ]}
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
      return `${hours} hours ${minutes > 0 ? ` ${minutes} minutes` : ''}`;
    }
    return `${minutes} minutes`;
  };

  // Navigation actions using shared CardAction format
  const navigationActions: CardAction[] = [
    {
      key: 'back-to-worlds',
      text: 'Back to Worlds',
      onClick: () => router.push('/worlds'),
      variant: 'primary',
      flex: true,
    },
    {
      key: 'new-story',
      text: 'New Story',
      onClick: async () => {
        // Set the current character, end the session, clear the ending, then navigate to play
        const { setCurrentCharacter } = useCharacterStore.getState();
        const { clearEnding, clearSessionSegments, clearSessionDecisions } =
          useNarrativeStore.getState();
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
      icon: <Play aria-hidden="true" />,
    },
  ];

  return (
    <div className="component-ending-screen" data-testid="ending-screen">
      {/* Hero Section: Combined Header with Image */}
      <section
        className="component-ending-screen-hero"
        aria-label="Story ending"
      >
        {isGeneratingImage ? (
          <div
            className="component-ending-screen-hero-loading"
            role="img"
            aria-live="polite"
            aria-label="Loading ending image"
          >
            <div className="component-ending-screen-hero-loading-body">
              <LoadingState message="Loading ending image..." />
              <p>
                Preparing a visual representation of your story&apos;s
                conclusion...
              </p>
            </div>
          </div>
        ) : endingImage ? (
          <div className="component-ending-screen-hero-frame">
            <Image
              className="component-ending-screen-hero-image"
              src={endingImage}
              alt={`${capitalize(currentEnding.tone)} ending for ${character?.name || 'the character'}'s story`}
              width={1280}
              height={720}
              priority
            />
            <div className="component-ending-screen-hero-overlay">
              <header className="component-ending-screen-hero-header">
                {/* h2 in every hero branch: the page-level h1 belongs to the
                      route (sr-only "Story Complete", #1532), and this was the
                      only branch still rendering the hero title as an h1. */}
                <h2 className="component-ending-screen-hero-title">The End</h2>
                <p className="component-ending-screen-hero-meta">
                  {`${character?.name || 'Unknown Hero'} • ${world?.name || 'Unknown Realm'}${currentEnding.playTime ? ` • Play Time: ${formatPlayTime(currentEnding.playTime)}` : ''}`}
                </p>
              </header>
            </div>
          </div>
        ) : imageError ? (
          <div
            className={`component-ending-screen-hero-frame ending-${currentEnding.tone}`}
          >
            <div className="component-ending-screen-hero-error">
              <p>{imageError}</p>
              <Button
                onClick={generateEndingImage}
                variant="link"
                size="sm"
                aria-label="Retry loading ending image"
              >
                Try Again
              </Button>
            </div>
            <div className="component-ending-screen-hero-overlay">
              <header className="component-ending-screen-hero-header">
                <h2 className="component-ending-screen-hero-title">The End</h2>
                <p className="component-ending-screen-hero-meta">
                  {`${character?.name || 'Unknown Hero'} • ${world?.name || 'Unknown Realm'}${currentEnding.playTime ? ` • Play Time: ${formatPlayTime(currentEnding.playTime)}` : ''}`}
                </p>
              </header>
            </div>
          </div>
        ) : (
          <div
            className={`component-ending-screen-hero-frame ending-${currentEnding.tone}`}
          >
            <div className="component-ending-screen-hero-placeholder">
              {/* Without the reason, a button that can never succeed just looks
                  broken every time it is pressed. */}
              <p>{imageSupport.reason ?? 'Ending image'}</p>
              {imageSupport.supported && (
                <Button
                  onClick={generateEndingImage}
                  variant="link"
                  size="sm"
                  aria-label="Generate ending image"
                >
                  Generate Image
                </Button>
              )}
            </div>
            <div className="component-ending-screen-hero-overlay">
              <header className="component-ending-screen-hero-header">
                <h2 className="component-ending-screen-hero-title">The End</h2>
                <p className="component-ending-screen-hero-meta">
                  {`${character?.name || 'Unknown Hero'} • ${world?.name || 'Unknown Realm'}${currentEnding.playTime ? ` • Play Time: ${formatPlayTime(currentEnding.playTime)}` : ''}`}
                </p>
              </header>
            </div>
          </div>
        )}
      </section>

      <div className="component-ending-screen-content">
        {/* Epilogue */}
        <section>
          <SectionWrapper title="Epilogue">
            <div className="manuscript-ending-prose">
              {currentEnding.epilogue}
            </div>
          </SectionWrapper>
        </section>

        {/* Character Legacy */}
        <section>
          <SectionWrapper title="Character Legacy">
            <div className="manuscript-ending-prose">
              {currentEnding.characterLegacy}
            </div>
          </SectionWrapper>
        </section>

        {/* Achievements */}
        {currentEnding.achievements &&
          currentEnding.achievements.length > 0 && (
            <section aria-label="Story achievements">
              <SectionWrapper title="Achievements">
                <ul
                  className="component-ending-screen-achievements"
                  role="list"
                >
                  {currentEnding.achievements.map((achievement, index) => {
                    // Split achievement into title and description
                    const colonIndex = achievement.indexOf(':');
                    const title =
                      colonIndex > 0
                        ? achievement.substring(0, colonIndex)
                        : achievement;
                    const description =
                      colonIndex > 0
                        ? achievement.substring(colonIndex + 1).trim()
                        : '';

                    return (
                      <li
                        key={index}
                        className="component-ending-screen-achievement"
                      >
                        <div className="component-ending-screen-achievement-body">
                          <span className="component-ending-screen-achievement-title">
                            {title}
                          </span>
                          {description && (
                            <span className="component-ending-screen-achievement-description">
                              {description}
                            </span>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </SectionWrapper>
            </section>
          )}

        {/* World Impact */}
        <section>
          <SectionWrapper title="Impact on the World">
            <div className="manuscript-ending-prose">
              {currentEnding.worldImpact}
            </div>
          </SectionWrapper>
        </section>

        {/* Your Story - Collapsible Section */}
        <section>
          <CollapsibleSection title="Your Story" initialCollapsed={true}>
            <div>
              {fullStory ? (
                <div className="manuscript-ending-prose">
                  {fullStory.split(/\n{2,}/).map((paragraph, index) => (
                    <p key={`story-paragraph-${index}`}>{paragraph.trim()}</p>
                  ))}
                </div>
              ) : (
                <p>No story checkpoints available for this session.</p>
              )}
            </div>
          </CollapsibleSection>
        </section>

        {/* Next Steps */}
        <section>
          <SectionWrapper title="What's Next?">
            <CardActionGroup
              primaryActions={navigationActions}
              layout="horizontal"
              gap="lg"
            />
          </SectionWrapper>
        </section>
      </div>
    </div>
  );
}
