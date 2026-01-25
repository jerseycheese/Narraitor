// src/components/QuickStartCharacters/QuickStartCharacters.tsx

'use client';

import React, { useState, useEffect } from 'react';
import { World, CharacterArchetype } from '@/types/world.types';
import { 
  generateCharacterArchetypes, 
  generateRandomArchetype 
} from '@/lib/utils/characterArchetypes';
import { ActionButtonGroup } from '@/components/shared/ActionButtonGroup';
import { Button } from '@/components/ui/button';
import { CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
}

export const QuickStartCharacters = React.memo(function QuickStartCharacters({
  world,
  onCharacterSelect,
  onCustomizeClick,
  existingCharacterNames = []
}: QuickStartCharactersProps) {
  const [archetypes, setArchetypes] = useState<CharacterArchetype[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedArchetype, setSelectedArchetype] = useState<string | null>(null);

  const generateArchetypes = async () => {
    try {
      setLoading(true);
      setError(null);

      // Use stored templates if available (faster, pre-generated during world creation)
      if (world.characterTemplates && world.characterTemplates.length > 0) {
        setArchetypes(world.characterTemplates);
      } else {
        // Fall back to on-demand generation if templates not available
        const generated = await generateCharacterArchetypes(world, existingCharacterNames);
        setArchetypes(generated);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      console.error('QuickStartCharacters archetype generation failed:', {
        error: err,
        world: world.name,
        genre: world.genre,
        attributes: world.attributes?.length || 0,
        skills: world.skills?.length || 0
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
      const randomArchetype = await generateRandomArchetype(world, existingCharacterNames);
      handleArchetypeSelect(randomArchetype);
    } catch (err) {
      console.error('QuickStartCharacters random archetype generation failed:', {
        error: err,
        world: world.name,
        genre: world.genre
      });
      setError('Failed to generate random character. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (loading && archetypes.length === 0) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Quick Start Characters</h2>
          <p className="text-lg text-gray-700 mb-1">
            Jump straight into your adventure with {world.name}
          </p>
        </div>
        <LoadingSkeleton
          size="md"
          skeletonLines={6}
          message={`Creating archetypes for your ${getGenreLabel(world.genre)} world...`}
          centered={true}
          className="py-12"
        />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Quick Start Characters</h2>
        </div>
        <ErrorDisplay
          variant="section"
          severity="error"
          title="Character Generation Failed"
          message={error}
          showRetry={true}
          onRetry={generateArchetypes}
          className="py-12"
        />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Quick Start Characters</h2>
        <p className="text-lg text-gray-700 mb-1">
          Jump straight into your adventure with {world.name}
        </p>
        <p className="text-sm text-gray-500">
          Choose from these pre-generated {getGenreLabel(world.genre)} archetypes or create your own
        </p>
      </div>

      {/* Archetype Cards */}
      <div 
        className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
        data-testid="archetypes-grid"
        data-tutorial="quickstart-archetypes"
      >
        {archetypes.map((archetype) => (
          <ActiveStateCard
            key={archetype.id}
            isActive={selectedArchetype === archetype.id}
            activeText="Selected Character"
            onClick={() => handleArchetypeSelect(archetype)}
            activeClassName="border-green-500 bg-green-50 shadow-xl ring-2 ring-green-500"
            inactiveClassName="border-gray-300 bg-white hover:shadow-lg"
            testId="archetype-card"
          >
            <CardHeader className="pb-3">
              <CardTitle className="text-xl font-bold text-gray-900">
                {archetype.name}
              </CardTitle>
              <CardDescription className="text-sm text-gray-700">
                {archetype.description}
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {/* Personality & Background */}
              <div>
                <p className="text-sm text-gray-700 leading-relaxed">
                  {archetype.background.personality}
                </p>
              </div>

              {/* Top Attributes */}
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-2">Key Attributes</h4>
                <div className="flex flex-wrap gap-1">
                  {archetype.attributes
                    .sort((a, b) => (b.value || 0) - (a.value || 0))
                    .slice(0, 3)
                    .map((attr, idx) => (
                      <Badge 
                        key={`${archetype.id}-attr-${attr.id ?? attr.name}-${idx}`}
                        variant="secondary" 
                        count={attr.value}
                        className="text-xs"
                      >
                        {attr.name}
                      </Badge>
                    ))}
                </div>
              </div>

              {/* Top Skills */}
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-2">Best Skills</h4>
                <div className="flex flex-wrap gap-1">
                  {archetype.skills
                    .sort((a, b) => (b.level || 0) - (a.level || 0))
                    .slice(0, 3)
                    .map((skill, idx) => (
                      <Badge 
                        key={`${archetype.id}-skill-${skill.id ?? skill.name}-${idx}`} 
                        variant="outline" 
                        count={skill.level}
                        className="text-xs"
                      >
                        {skill.name}
                      </Badge>
                    ))}
                </div>
              </div>

              {/* Motivation */}
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-1">Motivation</h4>
                <p className="text-xs text-gray-700 italic">
                  &ldquo;{archetype.background.motivation}&rdquo;
                </p>
              </div>

              {/* Select Button */}
              <Button 
                className="w-full mt-4"
                onClick={(e) => {
                  e.stopPropagation();
                  handleArchetypeSelect(archetype);
                }}
                disabled={loading || selectedArchetype === archetype.id}
              >
                {selectedArchetype === archetype.id ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" aria-hidden="true" />
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
      <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
        <ActionButtonGroup
          className="flex-col sm:flex-row w-full sm:w-auto"
          actions={[
            {
              label: loading ? 'Generating...' : 'Generate New Random Character',
              onClick: handleRandomSelect,
              variant: 'outline',
              size: 'lg',
              icon: loading ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <Sparkles className="w-4 h-4" aria-hidden="true" />
              ),
              disabled: loading,
              dataTutorial: 'quickstart-random',
            },
            {
              label: 'Create Custom Character',
              onClick: onCustomizeClick,
              variant: 'ghost',
              size: 'lg',
              icon: (
                <Plus className="w-4 h-4" aria-hidden="true" />
              ),
              dataTutorial: 'quickstart-custom',
            }
          ]}
        />
      </div>

      {/* Additional Info */}
      <div className="mt-8 text-center space-y-2">
        <p className="text-sm text-gray-700">
          <strong>Generate New Random Character:</strong> Creates a completely new random character for this world
        </p>
        <p className="text-sm text-gray-700">
          <strong>Create Custom Character:</strong> Build your own character from scratch with full customization
        </p>
        <p className="text-xs text-gray-500 mt-4">
          You can always edit any character later through the character editor
        </p>
      </div>
    </div>
  );
});
