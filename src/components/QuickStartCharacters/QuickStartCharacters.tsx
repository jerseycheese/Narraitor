// src/components/QuickStartCharacters/QuickStartCharacters.tsx

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { World } from '@/types/world.types';
import { 
  CharacterArchetype, 
  generateCharacterArchetypes, 
  generateRandomArchetype 
} from '@/lib/utils/characterArchetypes';
import { Button } from '@/components/ui/button';
import { CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LoadingSkeleton } from '@/components/ui/LoadingState/LoadingState';
import { ErrorDisplay } from '@/components/ui/ErrorDisplay/ErrorDisplay';
import { ActiveStateCard } from '@/components/shared/cards/ActiveStateCard';
import { TopAttributesBadges, TopSkillsBadges } from '@/components/shared/AttributeSkillBadges';
import { Loader2, Dice6, User, Settings } from 'lucide-react';

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

  const generateArchetypes = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const generated = await generateCharacterArchetypes(world, existingCharacterNames);
      setArchetypes(generated);
    } catch (err) {
      setError('Unable to generate character options. Please try again.');
      console.error('Failed to generate archetypes:', err);
    } finally {
      setLoading(false);
    }
  }, [world, existingCharacterNames]);

  useEffect(() => {
    generateArchetypes();
  }, [generateArchetypes]);

  const handleArchetypeSelect = (archetype: CharacterArchetype) => {
    setSelectedArchetype(archetype.id);
    // Small delay to show selection state before proceeding
    setTimeout(() => {
      onCharacterSelect(archetype);
    }, 300);
  };

  const handleRandomSelect = async () => {
    try {
      setLoading(true);
      const randomArchetype = await generateRandomArchetype(world, existingCharacterNames);
      handleArchetypeSelect(randomArchetype);
    } catch (err) {
      setError('Failed to generate random character. Please try again.');
      console.error('Failed to generate random archetype:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading && archetypes.length === 0) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Quick Start Characters</h2>
          <p className="text-lg text-gray-600 mb-1">
            Jump straight into your adventure with {world.name}
          </p>
        </div>
        <LoadingSkeleton
          size="md"
          skeletonLines={6}
          message={`Creating archetypes for your ${world.genre} world...`}
          centered={true}
          className="py-12"
        />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-6xl mx-auto p-6">
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
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Quick Start Characters</h2>
        <p className="text-lg text-gray-600 mb-1">
          Jump straight into your adventure with {world.name}
        </p>
        <p className="text-sm text-gray-500">
          Choose from these pre-generated {world.genre} archetypes or create your own
        </p>
      </div>

      {/* Archetype Cards */}
      <div 
        className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
        data-testid="archetypes-grid"
      >
        {archetypes.map((archetype) => (
          <ActiveStateCard
            key={archetype.id}
            isActive={selectedArchetype === archetype.id}
            activeText="Selected Character"
            onClick={() => handleArchetypeSelect(archetype)}
            activeClassName="border-green-500 bg-green-50 shadow-xl ring-2 ring-green-400"
            inactiveClassName="border-gray-300 bg-white hover:shadow-lg"
            testId="archetype-card"
          >
            <CardHeader className="pb-3">
              <CardTitle className="text-xl font-bold text-gray-900">
                {archetype.name}
              </CardTitle>
              <CardDescription className="text-sm text-gray-600">
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
                <TopAttributesBadges
                  items={archetype.attributes}
                  maxItems={3}
                  showRemainingCount={false}
                />
              </div>

              {/* Top Skills */}
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-2">Best Skills</h4>
                <TopSkillsBadges
                  items={archetype.skills}
                  maxItems={3}
                  showRemainingCount={false}
                />
              </div>

              {/* Motivation */}
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-1">Motivation</h4>
                <p className="text-xs text-gray-600 italic">
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
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Starting Game...
                  </>
                ) : (
                  <>
                    <User className="h-4 w-4 mr-2" />
                    Select Character
                  </>
                )}
              </Button>
            </CardContent>
          </ActiveStateCard>
        ))}
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
        <Button
          variant="outline"
          size="lg"
          onClick={handleRandomSelect}
          disabled={loading}
          className="w-full sm:w-auto"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Dice6 className="h-4 w-4 mr-2" />
          )}
          Random Character
        </Button>

        <div className="text-sm text-gray-500 hidden sm:block">or</div>

        <Button
          variant="ghost"
          size="lg"
          onClick={onCustomizeClick}
          className="w-full sm:w-auto"
        >
          <Settings className="h-4 w-4 mr-2" />
          Customize Character
        </Button>
      </div>

      {/* Additional Info */}
      <div className="mt-8 text-center">
        <p className="text-xs text-gray-500">
          You can customize any character later through the character editor
        </p>
      </div>
    </div>
  );
});