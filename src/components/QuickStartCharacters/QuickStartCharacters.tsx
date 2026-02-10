// src/components/QuickStartCharacters/QuickStartCharacters.tsx

'use client';

import React, { useState, useEffect } from 'react';
import { World, CharacterArchetype } from '@/types/world.types';
import {
  generateCharacterArchetypes,
  generateRandomArchetype,
} from '@/lib/utils/characterArchetypes';
import { ActionButtonGroup } from '@/components/shared/ActionButtonGroup';
import { Button } from '@/components/ui/button';
import {
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { LoadingSkeleton } from '@/components/ui/LoadingState/LoadingState';
import { ErrorDisplay } from '@/components/ui/ErrorDisplay/ErrorDisplay';
import { ActiveStateCard } from '@/components/shared/cards/ActiveStateCard';
import { Badge } from '@/components/ui/badge';
import { Loader2, Sparkles, Plus } from 'lucide-react';
import { getGenreLabel } from '@/lib/constants/genres';

const SELECTION_DELAY_MS = 300;

export interface QuickStartCharactersProps {
  world: World;
  onCharacterSelect: (archetype: CharacterArchetype) => void;
  onCustomizeClick: () => void;
  existingCharacterNames?: string[];
  onReady?: () => void;
}

export const QuickStartCharacters = React.memo(function QuickStartCharacters({
  world,
  onCharacterSelect,
  onCustomizeClick,
  existingCharacterNames = [],
  onReady,
}: QuickStartCharactersProps) {
  const [archetypes, setArchetypes] = useState<CharacterArchetype[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedArchetype, setSelectedArchetype] = useState<string | null>(
    null
  );

  const generateArchetypes = async () => {
    try {
      setLoading(true);
      setError(null);

      // Use stored templates if available (faster, pre-generated during world creation)
      if (world.characterTemplates && world.characterTemplates.length > 0) {
        setArchetypes(world.characterTemplates);
      } else {
        // Fall back to on-demand generation if templates not available
        const generated = await generateCharacterArchetypes(
          world,
          existingCharacterNames
        );
        setArchetypes(generated);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      console.error('QuickStartCharacters archetype generation failed:', {
        error: err,
        world: world.name,
        genre: world.genre,
        attributes: world.attributes?.length || 0,
        skills: world.skills?.length || 0,
      });
      setError(`Unable to generate character options: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    generateArchetypes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [world.id]); // Only depend on world.id to prevent infinite loops from object reference changes

  // Trigger onReady when loading is finished and content is available
  useEffect(() => {
    if (!loading && archetypes.length > 0) {
      // Timeout to ensure DOM is painted and stable
      const timer = setTimeout(() => {
        onReady?.();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [loading, archetypes, onReady]);

  const handleArchetypeSelect = (archetype: CharacterArchetype) => {
    setSelectedArchetype(archetype.id);
    // Small delay to show selection state before proceeding
    setTimeout(() => {
      onCharacterSelect(archetype);
    }, SELECTION_DELAY_MS);
  };

  const handleRandomSelect = async () => {
    try {
      setLoading(true);
      const randomArchetype = await generateRandomArchetype(
        world,
        existingCharacterNames
      );
      handleArchetypeSelect(randomArchetype);
    } catch (err) {
      console.error(
        'QuickStartCharacters random archetype generation failed:',
        {
          error: err,
          world: world.name,
          genre: world.genre,
        }
      );
      setError('Failed to generate random character. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (loading && archetypes.length === 0) {
    return (
      <div>
        <div>
          <h2>Quick Start Characters</h2>
          <p>Jump straight into your adventure with {world.name}</p>
        </div>
        <LoadingSkeleton
          size="md"
          skeletonLines={6}
          message={`Creating archetypes for your ${getGenreLabel(world.genre)} world...`}
          centered={true}
        />
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <div>
          <h2>Quick Start Characters</h2>
        </div>
        <ErrorDisplay
          variant="section"
          severity="error"
          title="Character Generation Failed"
          message={error}
          showRetry={true}
          onRetry={generateArchetypes}
        />
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div>
        <h2>Quick Start Characters</h2>
        <p>Jump straight into your adventure with {world.name}</p>
        <p>
          Choose from these pre-generated {getGenreLabel(world.genre)}{' '}
          archetypes or create your own
        </p>
      </div>

      {/* Archetype Cards */}
      <div data-testid="archetypes-grid" data-tutorial="quickstart-archetypes">
        {archetypes.map((archetype) => (
          <ActiveStateCard
            key={archetype.id}
            isActive={selectedArchetype === archetype.id}
            activeText="Selected Character"
            onClick={() => handleArchetypeSelect(archetype)}
            testId="archetype-card"
          >
            <CardHeader>
              <CardTitle>{archetype.name}</CardTitle>
              <CardDescription>{archetype.description}</CardDescription>
            </CardHeader>

            <CardContent>
              {/* Personality & Background */}
              <div>
                <p>{archetype.background.personality}</p>
              </div>

              {/* Top Attributes */}
              <div>
                <h4>Key Attributes</h4>
                <div>
                  {archetype.attributes
                    .sort((a, b) => (b.value || 0) - (a.value || 0))
                    .slice(0, 3)
                    .map((attr, idx) => (
                      <Badge
                        key={`${archetype.id}-attr-${attr.id ?? attr.name}-${idx}`}
                        variant="secondary"
                        count={attr.value}
                      >
                        {attr.name}
                      </Badge>
                    ))}
                </div>
              </div>

              {/* Top Skills */}
              <div>
                <h4>Best Skills</h4>
                <div>
                  {archetype.skills
                    .sort((a, b) => (b.level || 0) - (a.level || 0))
                    .slice(0, 3)
                    .map((skill, idx) => (
                      <Badge
                        key={`${archetype.id}-skill-${skill.id ?? skill.name}-${idx}`}
                        variant="outline"
                        count={skill.level}
                      >
                        {skill.name}
                      </Badge>
                    ))}
                </div>
              </div>

              {/* Motivation */}
              <div>
                <h4>Motivation</h4>
                <p>&ldquo;{archetype.background.motivation}&rdquo;</p>
              </div>

              {/* Select Button */}
              <Button
                onClick={(e) => {
                  e.stopPropagation();
                  handleArchetypeSelect(archetype);
                }}
                disabled={loading || selectedArchetype === archetype.id}
              >
                {selectedArchetype === archetype.id ? (
                  <>
                    <Loader2 aria-hidden="true" />
                    Starting Game...
                  </>
                ) : (
                  'Select Character'
                )}
              </Button>
            </CardContent>
          </ActiveStateCard>
        ))}
      </div>

      {/* Action Buttons */}
      <div>
        <ActionButtonGroup
          actions={[
            {
              label: loading
                ? 'Generating...'
                : 'Generate New Random Character',
              onClick: handleRandomSelect,
              variant: 'secondary',
              size: 'lg',
              icon: loading ? (
                <Loader2 aria-hidden="true" />
              ) : (
                <Sparkles aria-hidden="true" />
              ),
              disabled: loading,
              dataTutorial: 'quickstart-random',
            },
            {
              label: 'Create Custom Character',
              onClick: onCustomizeClick,
              variant: 'ghost',
              size: 'lg',
              icon: <Plus aria-hidden="true" />,
              dataTutorial: 'quickstart-custom',
            },
          ]}
        />
      </div>

      {/* Additional Info */}
      <div>
        <p>
          <strong>Generate New Random Character:</strong> Creates a completely
          new random character for this world
        </p>
        <p>
          <strong>Create Custom Character:</strong> Build your own character
          from scratch with full customization
        </p>
        <p>
          You can always edit any character later through the character editor
        </p>
      </div>
    </div>
  );
});
