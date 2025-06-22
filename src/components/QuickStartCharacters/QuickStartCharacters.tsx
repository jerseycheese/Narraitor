// src/components/QuickStartCharacters/QuickStartCharacters.tsx

'use client';

import React, { useState, useEffect } from 'react';
import { World } from '@/types/world.types';
import { 
  CharacterArchetype, 
  generateCharacterArchetypes, 
  generateRandomArchetype 
} from '@/lib/utils/characterArchetypes';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Dice6, User, Settings } from 'lucide-react';

export interface QuickStartCharactersProps {
  world: World;
  onCharacterSelect: (archetype: CharacterArchetype) => void;
  onCustomizeClick: () => void;
  existingCharacterNames?: string[];
}

export function QuickStartCharacters({
  world,
  onCharacterSelect,
  onCustomizeClick,
  existingCharacterNames = []
}: QuickStartCharactersProps) {
  const [archetypes, setArchetypes] = useState<CharacterArchetype[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedArchetype, setSelectedArchetype] = useState<string | null>(null);

  useEffect(() => {
    generateArchetypes();
  }, [world]); // eslint-disable-line react-hooks/exhaustive-deps

  const generateArchetypes = async () => {
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
  };

  const handleArchetypeSelect = (archetype: CharacterArchetype) => {
    setSelectedArchetype(archetype.id);
    onCharacterSelect(archetype);
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
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600 mb-4" />
        <p className="text-lg text-gray-600">Generating character options...</p>
        <p className="text-sm text-gray-500 mt-2">
          Creating archetypes for your {world.genre} world
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="text-center">
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Character Generation Error
          </h3>
          <p className="text-gray-600 mb-6">{error}</p>
          <Button onClick={generateArchetypes} variant="outline">
            Try Again
          </Button>
        </div>
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
          <Card 
            key={archetype.id} 
            className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${
              selectedArchetype === archetype.id 
                ? 'ring-2 ring-blue-500 shadow-lg' 
                : 'hover:ring-1 hover:ring-gray-300'
            }`}
            data-testid="archetype-card"
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
                <div className="flex flex-wrap gap-1">
                  {archetype.attributes
                    .sort((a, b) => b.value - a.value)
                    .slice(0, 3)
                    .map((attr) => (
                      <Badge key={attr.id} variant="secondary" className="text-xs">
                        {attr.name}: {attr.value}
                      </Badge>
                    ))}
                </div>
              </div>

              {/* Top Skills */}
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-2">Best Skills</h4>
                <div className="flex flex-wrap gap-1">
                  {archetype.skills
                    .sort((a, b) => b.level - a.level)
                    .slice(0, 3)
                    .map((skill) => (
                      <Badge key={skill.id} variant="outline" className="text-xs">
                        {skill.name}: {skill.level}
                      </Badge>
                    ))}
                </div>
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
                onClick={() => handleArchetypeSelect(archetype)}
                disabled={loading}
              >
                <User className="h-4 w-4 mr-2" />
                Select Character
              </Button>
            </CardContent>
          </Card>
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
}