'use client';

import { useState, useEffect, useMemo } from 'react';
import { Plus, Sparkles, Play, Globe } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useCharacterStore, type Character } from '@/state/characterStore';
import { useWorldStore } from '@/state/worldStore';
import { useSessionStore } from '@/state/sessionStore';
import { useNarrativeStore } from '@/state/narrativeStore';
import { CharacterDeletionService } from '@/services/characterDeletionService';
import { getTimestamp } from '@/lib/utils';
import { CharacterCard } from '@/components/CharacterCard';
import { PageLayout } from '@/components/shared/PageLayout';
import { Hero } from '@/components/shared/Hero';
import { SSRClientOnly } from '@/components/shared/SSRClientOnly';
import { ActionButtonGroup } from '@/components/shared/ActionButtonGroup';
import { generateUniqueId } from '@/lib/utils/generateId';
import type { GeneratedCharacterData } from '@/lib/ai/characterGenerator';
// Using API routes for secure AI operations
import { GenerateCharacterDialog } from '@/components/GenerateCharacterDialog';
import { World } from '@/types/world.types';
import DeleteConfirmationDialog from '@/components/DeleteConfirmationDialog';
import { Toast } from '@/components/ui/toast';
import { getGenreLabel } from '@/lib/constants/genres';
import { GameSessionConfirmationDialog } from '@/components/GameSession/GameSessionConfirmationDialog';
import type { GeneratedImage } from '@/types/common.types';

// Type for character portrait update
type CharacterPortraitUpdate = {
  portrait: GeneratedImage;
};

// Helper function to transform generated data to character attributes
function transformGeneratedAttributes(generatedData: GeneratedCharacterData, currentWorld: World) {
  return generatedData.attributes.map((attr) => {
    const worldAttr = currentWorld.attributes.find((wa) => wa.id === attr.id);
    return {
      id: generateUniqueId('attr'),
      characterId: '', // Will be set by store
      worldAttributeId: attr.id, // Store reference to world attribute ID
      name: worldAttr?.name || 'Unknown',
      baseValue: attr.value, // Use the AI-generated value
      modifiedValue: attr.value, // Use the AI-generated value
      category: worldAttr?.category || 'General'
    };
  });
}

// Helper function to transform generated data to character skills
function transformGeneratedSkills(generatedData: GeneratedCharacterData, currentWorld: World) {
  return generatedData.skills.map((skill) => {
    const worldSkill = currentWorld.skills.find((ws) => ws.id === skill.id);
    return {
      id: generateUniqueId('skill'),
      characterId: '', // Will be set by store
      worldSkillId: skill.id, // Store reference to world skill ID
      name: worldSkill?.name || 'Unknown',
      level: skill.level,
      category: worldSkill?.category
    };
  });
}

// Helper function to generate portrait for character
async function generateCharacterPortrait(
  characterId: string,
  generatedData: GeneratedCharacterData,
  currentWorld: World,
  currentWorldId: string,
  updateCharacter: (id: string, updates: CharacterPortraitUpdate) => void
) {
  try {
    // Create a Character-like object for portrait generation (combined approach)
    const characterForPortrait = {
      id: characterId,
      name: generatedData.name,
      worldId: currentWorldId,
      background: {
        history: generatedData.background.description,
        personality: generatedData.background.personality,
        physicalDescription: generatedData.background.physicalDescription || '',
        goals: [],
        fears: [],
        isKnownFigure: generatedData.isKnownFigure || false
      }
    };
    
    // Use secure API endpoint for portrait generation
    const response = await fetch('/api/generate-portrait', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        character: characterForPortrait,
        world: currentWorld
      })
    });
    
    if (response.ok) {
      const result = await response.json();
      // Handle both response formats for compatibility
      const portrait = result.portrait || {
        type: 'ai-generated',
        url: result.image,
        generatedAt: getTimestamp(),
        prompt: result.prompt
      };
      // Update character with generated portrait
      updateCharacter(characterId, { portrait });
    }
    // If portrait generation fails, continue without portrait - character already has placeholder
  } catch {
    // Portrait generation failed, but character creation should continue
  }
}


export default function CharactersPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { characters, currentCharacterId, setCurrentCharacter, createCharacter, updateCharacter } = useCharacterStore();
  const { worlds, currentWorldId, worldStates } = useWorldStore();
  const currentSessionId = useSessionStore((state) => state.id);
  const { getSessionSegments } = useNarrativeStore();
  const [mounted, setMounted] = useState(false);

  // No test globals – use persisted store state only
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatingStatus, setGeneratingStatus] = useState<string>('');
  const [generateError, setGenerateError] = useState<string | null>(null);
  const [showGenerateDialog, setShowGenerateDialog] = useState(false);
  const [characterName, setCharacterName] = useState('');
  const [generationType, setGenerationType] = useState<'known' | 'original' | 'specific'>(() => {
    const types: Array<'known' | 'original'> = ['known', 'original'];
    return types[Math.floor(Math.random() * types.length)];
  });
  const [deleteDialog, setDeleteDialog] = useState({
    isOpen: false,
    characterId: null as string | null,
    characterName: '',
    isDeleting: false
  });
  const [characterSwitchDialog, setCharacterSwitchDialog] = useState({
    isOpen: false,
    characterId: null as string | null,
    characterName: '',
  });
  const [toasts, setToasts] = useState<Array<{
    id: string;
    title: string;
    description?: string;
    variant: 'success' | 'error';
    duration?: number;
  }>>([]);
  
  // Use worldId from URL if provided, otherwise use the current world
  const worldIdFromUrl = searchParams.get('worldId');
  
  // Use normal store data
  const effectiveWorldId = worldIdFromUrl || currentWorldId;
  const currentWorld = effectiveWorldId ? worlds[effectiveWorldId] : null;
  const worldCharacters = (Object.values(characters) as Character[]).filter(
    (char) => char.worldId === effectiveWorldId
  );
  const worldState = effectiveWorldId ? worldStates?.[effectiveWorldId] : undefined;

  const characterContextById = useMemo(() => {
    if (!worldState) {
      return {} as Record<string, {
        recentEvent?: string;
        relationships: Array<{ characterId: string; characterName: string; portraitUrl?: string | null }>;
      }>;
    }

    const relationshipByCharacter = worldState.characterRelationships ?? {};

    return worldCharacters.reduce((acc, character) => {
      const relationshipEntries = relationshipByCharacter[character.id] ?? {};

      const relationships = Object.entries(relationshipEntries)
        .filter(([otherId]) => otherId !== character.id && Boolean(characters[otherId]))
        .sort(([, a], [, b]) => b.lastInteraction.localeCompare(a.lastInteraction))
        .slice(0, 2)
        .map(([otherId]) => {
          const relatedCharacter = characters[otherId];
          return {
            characterId: otherId,
            characterName: relatedCharacter?.name ?? 'Unknown',
            portraitUrl: relatedCharacter?.portrait?.url ?? null,
          };
        });

      // Find the most recent major event for this character
      const characterEvents = (worldState.majorEvents ?? [])
        .filter(event => event.characterId === character.id)
        .sort((a, b) => b.timestamp.localeCompare(a.timestamp));

      const recentEvent = characterEvents.length > 0 ? characterEvents[0].description : undefined;

      acc[character.id] = {
        recentEvent,
        relationships,
      };

      return acc;
    }, {} as Record<string, {
      recentEvent?: string;
      relationships: Array<{ characterId: string; characterName: string; portraitUrl?: string | null }>;
    }>);
  }, [worldState, worldCharacters, characters]);

  // Get current session progress for confirmation dialog
  const currentProgress = currentSessionId ? getSessionSegments(currentSessionId).length : 0;

  // Mark mounted after first client render to make header SSR-safe
  useEffect(() => {
    setMounted(true);
  }, []);

  // Compute header content in a hydration-safe way: keep it on during SSR/first paint
  const headerTitle = mounted && currentWorld?.image?.url ? undefined : 'My Characters';
  const headerDescription = mounted && currentWorld?.image?.url
    ? undefined
    : 'Create unique characters for your interactive narrative adventures. Use the "Make Active" button on a character to set them as your current character for gameplay.';

  // Toast management
  const addToast = (toast: Omit<typeof toasts[0], 'id'>) => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    const newToast = { ...toast, id };
    setToasts(prev => [...prev, newToast]);
    
    // Auto-remove toast after duration
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, toast.duration || 3000);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const handleCreateCharacter = () => {
    router.push('/characters/create');
  };
  
  const handleGenerateCharacter = async () => {
    if (!currentWorld || !effectiveWorldId) return;
    
    // Validate specific character name
    if (generationType === 'specific' && !characterName.trim()) {
      setGenerateError('Please enter a character name');
      return;
    }
    
    setIsGenerating(true);
    setGenerateError(null);
    setGeneratingStatus('Creating character...');
    
    try {
      // Get existing character names to avoid duplicates
      const existingNames = worldCharacters.map(char => char.name);
      
      // Generate character data based on type
      const nameToUse = generationType === 'specific' ? characterName : undefined;
      
      // Use the character generation API route
      const response = await fetch('/api/generate-character', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          worldId: effectiveWorldId,
          characterType: generationType,
          existingNames: existingNames,
          suggestedName: nameToUse,
          world: currentWorld // Pass the world data to the API
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate character');
      }

      const generatedData: GeneratedCharacterData = await response.json();
      
      // Create the character with transformed attributes and skills
      const characterId = createCharacter({
        name: generatedData.name,
        description: generatedData.background.description || '',
        worldId: effectiveWorldId,
        level: generatedData.level,
        attributes: transformGeneratedAttributes(generatedData, currentWorld!),
        skills: transformGeneratedSkills(generatedData, currentWorld!),
        background: {
          history: generatedData.background.description,
          personality: generatedData.background.personality,
          goals: generatedData.background.motivation ? [generatedData.background.motivation] : [],
          fears: generatedData.background.fears || [], // AI-generated fears
          physicalDescription: generatedData.background.physicalDescription || '',
          relationships: [], // Initialize empty relationships array
          isKnownFigure: generatedData.isKnownFigure || false
        },
        isPlayer: true,
        status: {
          health: 100,
          maxHealth: 100,
          conditions: [],
        },
        inventory: {
          characterId: '', // Will be set by the store
          items: [],
          capacity: 20,
          categories: [],
          itemOrder: []
        },
        portrait: {
          type: 'placeholder',
          url: null
        }
      });
      
      // Select the new character
      setCurrentCharacter(characterId);
      
      // Generate portrait for the character
      setGeneratingStatus('Generating portrait...');
      await generateCharacterPortrait(
        characterId,
        generatedData,
        currentWorld!,
        effectiveWorldId,
        updateCharacter
      );
      
      // Reset dialog state
      setShowGenerateDialog(false);
      setCharacterName('');
      setGenerationType(() => {
        const types: Array<'known' | 'original'> = ['known', 'original'];
        return types[Math.floor(Math.random() * types.length)];
      });
      setGenerateError(null);
      
      // Navigate to view the character
      router.push(`/characters/${characterId}`);
    } catch (error) {
      setGenerateError(error instanceof Error ? error.message : 'Failed to generate character');
    } finally {
      setIsGenerating(false);
      setGeneratingStatus('');
    }
  };

  const handleSelectCharacter = (characterId: string) => {
    setCurrentCharacter(characterId);
  };

  const handleViewCharacter = (characterId: string) => {
    router.push(`/characters/${characterId}`);
  };

  const handleEditCharacter = (characterId: string) => {
    router.push(`/characters/${characterId}/edit`);
  };

  const handleDeleteCharacter = (characterId: string) => {
    const character = characters[characterId];
    if (!character) return;
    
    setDeleteDialog({
      isOpen: true,
      characterId,
      characterName: character.name,
      isDeleting: false
    });
  };

  const handleConfirmDelete = async () => {
    if (!deleteDialog.characterId) return;
    
    setDeleteDialog(prev => ({ ...prev, isDeleting: true }));
    
    try {
      const characterName = deleteDialog.characterName;
      
      // Use service layer for decoupled deletion with journal cleanup
      await CharacterDeletionService.deleteCharacterWithCleanup(deleteDialog.characterId);
      
      // Success toast
      addToast({
        title: 'Character Deleted',
        description: `${characterName} has been permanently deleted`,
        variant: 'success'
      });
      
      // Close dialog
      setDeleteDialog({ 
        isOpen: false, 
        characterId: null, 
        characterName: '', 
        isDeleting: false 
      });
    } catch {
      // Error toast
      addToast({
        title: 'Delete Failed',
        description: 'Failed to delete character. Please try again.',
        variant: 'error'
      });
      
      setDeleteDialog(prev => ({ ...prev, isDeleting: false }));
    }
  };

  const handleCancelDelete = () => {
    setDeleteDialog({
      isOpen: false,
      characterId: null,
      characterName: '',
      isDeleting: false
    });
  };

  // Handle character play with confirmation for character switching
  const handleCharacterPlay = (characterId: string) => {
    const character = characters[characterId];
    if (!character) return;

    // If switching to a different character and there's active progress, show confirmation
    if (currentCharacterId !== characterId && currentProgress > 0) {
      setCharacterSwitchDialog({
        isOpen: true,
        characterId,
        characterName: character.name,
      });
    } else {
      // No confirmation needed - either same character or no progress to lose
      setCurrentCharacter(characterId);
      router.push(`/worlds/${character.worldId}/play`);
    }
  };

  // Handle confirmed character switch
  const handleConfirmedCharacterSwitch = () => {
    const { characterId } = characterSwitchDialog;
    if (characterId) {
      const character = characters[characterId];
      if (character) {
        setCurrentCharacter(characterId);
        router.push(`/worlds/${character.worldId}/play`);
      }
    }
    setCharacterSwitchDialog({
      isOpen: false,
      characterId: null,
      characterName: '',
    });
  };

  // Handle cancel character switch
  const handleCancelCharacterSwitch = () => {
    setCharacterSwitchDialog({
      isOpen: false,
      characterId: null,
      characterName: '',
    });
  };

  if (mounted && (!effectiveWorldId || !currentWorld)) {
    return (
      <PageLayout
        title="My Characters"
        description={"Create unique characters for your interactive narrative adventures. Use the \"Make Active\" button on a character to set them as your current character for gameplay."}
      >
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="w-20 h-20 bg-blue-100 rounded-full mx-auto mb-4 flex items-center justify-center">
            <Globe className="w-10 h-10 text-blue-500" aria-hidden="true" />
          </div>
          <h2 className="text-xl font-semibold mb-2">Choose Your World</h2>
          <p className="text-gray-700 mb-6">
            Characters belong to specific worlds. To create characters, you need to select an active world first.
          </p>
          <div className="bg-blue-100 border border-blue-500 rounded-md p-4 mb-6 text-sm">
            <h3 className="font-medium text-blue-900 mb-2">How to get started:</h3>
            <ol className="list-decimal list-inside space-y-1 text-blue-700">
              <li>Go to the Worlds page</li>
              <li>Click &quot;Make Active&quot; on any world you want to play in</li>
              <li>Return here to create characters for that world</li>
            </ol>
          </div>
          <ActionButtonGroup
            actions={[{
              label: 'Go to Worlds',
              onClick: () => router.push('/worlds'),
              variant: 'primary',
              size: 'lg'
            }]}
            className="justify-center"
          />
          <p className="text-sm text-gray-500 mt-4">
            Each world has unique attributes, skills, and themes that shape your characters
          </p>
        </div>
      </PageLayout>
    );
  }

  const actionButtons = [
    {
      label: 'Create Character',
      onClick: handleCreateCharacter,
      variant: 'primary' as const,
      icon: (
        <Plus className="w-4 h-4" aria-hidden="true" />
      )
    },
    {
      label: 'Generate Character',
      onClick: () => setShowGenerateDialog(true),
      variant: 'secondary' as const,
      disabled: isGenerating,
      icon: (
        <Sparkles className="w-4 h-4" aria-hidden="true" />
      )
    },
    ...(currentCharacterId && effectiveWorldId ? [{
      label: 'Start Playing',
      onClick: () => {
        const character = characters[currentCharacterId];
        if (character) {
          router.push(`/worlds/${character.worldId}/play`);
        }
      },
      variant: 'success' as const,
      icon: (
        <Play className="w-4 h-4" aria-hidden="true" />
      )
    }] : [])
  ];

  return (
    <PageLayout
      title={headerTitle}
      description={headerDescription}
    >
      {/* Show world hero with image or themed background (after hydration) */}
      {mounted && currentWorld && (
        <div className="mb-6">
          <Hero
            title={worldIdFromUrl ? `${currentWorld.name} Characters` : `${currentWorld.name} Characters`}
            image={currentWorld.image?.url ? {
              url: currentWorld.image.url,
              alt: `${currentWorld.name} world`
            } : undefined}
            theme={(currentWorld.genre as 'fantasy' | 'sci-fi' | 'modern' | 'historical' | 'horror' | 'mystery' | 'western' | 'cyberpunk' | 'other') || 'default'}
            subtitle={currentWorld.genre ? getGenreLabel(currentWorld.genre) : undefined}
            height="h-32 sm:h-40"
            titleElement="h2"
          />
        </div>
      )}

      {/* Action buttons below hero when world exists (after hydration) */}
      {mounted && currentWorld && (
        <div className="mb-8 flex justify-end">
          <ActionButtonGroup actions={actionButtons} />
        </div>
      )}

      {/* Show back link if viewing from a specific world without image */}
      {mounted && worldIdFromUrl && !currentWorld?.image?.url && (
        <div className="mb-6 -mt-8">
          <Link
            href={`/worlds/${worldIdFromUrl}`}
            className="text-link-primary flex items-center gap-2 no-underline"
          >
            <span>←</span> Back to {currentWorld?.name || 'World'}
          </Link>
        </div>
      )}

      {generateError && (
        <div className="mb-4 p-4 bg-red-200 border border-red-500 rounded-lg text-red-700">
          <p className="font-medium">Generation Failed</p>
          <p className="text-sm mt-1">{generateError}</p>
        </div>
      )}

      <SSRClientOnly>
        {!currentWorld || worldCharacters.length === 0 ? (
          <div className="bg-white rounded-lg shadow-lg p-12 text-center max-w-2xl mx-auto">
            <div className="mb-6">
              <h2 className="text-2xl font-semibold mb-2">{currentWorld ? `No characters in ${currentWorld.name} yet` : 'No characters yet'}</h2>
              <p className="text-gray-700 mb-2">
                Choose how you&apos;d like to add your first character.
              </p>
            </div>
            <ActionButtonGroup
              actions={[
                {
                  label: isGenerating ? (generatingStatus || 'Generating...') : 'Generate Character',
                  onClick: handleGenerateCharacter,
                  variant: 'secondary',
                  disabled: isGenerating,
                  size: 'lg',
                  icon: isGenerating ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <Sparkles className="w-5 h-5" aria-hidden="true" />
                  )
                },
                {
                  label: 'Create Character',
                  onClick: handleCreateCharacter,
                  variant: 'primary',
                  size: 'lg',
                  icon: (
                    <Plus className="w-5 h-5" aria-hidden="true" />
                  )
                }
              ]}
              className="justify-center"
            />
            <div className="mt-6 text-sm text-gray-500">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
                <div>
                  <p className="font-medium text-blue-700 mb-1">Generate Character</p>
                  <p>AI creates a character {currentWorld?.reference ? `from ${currentWorld.reference}` : 'for your world'}</p>
                  <p className="text-xs mt-1">Choose known figures, original characters, or specific names</p>
                </div>
                <div>
                  <p className="font-medium text-green-700 mb-1">Create Character</p>
                  <p>Design your own character with custom details</p>
                  <p className="text-xs mt-1">Full control over attributes, skills, and background</p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {(worldCharacters as Character[]).map((character) => (
              <CharacterCard
                key={character.id}
                character={character}
                isActive={currentCharacterId === character.id}
                onMakeActive={() => handleSelectCharacter(character.id)}
                onView={() => handleViewCharacter(character.id)}
                onPlay={() => handleCharacterPlay(character.id)}
                onEdit={() => handleEditCharacter(character.id)}
                onDelete={() => handleDeleteCharacter(character.id)}
                context={characterContextById[character.id]}
              />
            ))}
          </div>
        )}
      </SSRClientOnly>
      
      {/* Character Generation Dialog */}
      <GenerateCharacterDialog
        isOpen={showGenerateDialog}
        isGenerating={isGenerating}
        generatingStatus={generatingStatus}
        characterName={characterName}
        generationType={generationType}
        worldName={currentWorld?.name || ''}
        error={generateError}
        onClose={() => {
          setShowGenerateDialog(false);
          setCharacterName('');
          setGenerationType('known');
          setGenerateError(null);
        }}
        onGenerate={handleGenerateCharacter}
        onCharacterNameChange={setCharacterName}
        onGenerationTypeChange={setGenerationType}
      />

      {/* Character Deletion Confirmation Dialog */}
      <DeleteConfirmationDialog
        isOpen={deleteDialog.isOpen}
        onClose={handleCancelDelete}
        onConfirm={handleConfirmDelete}
        title="Delete Character"
        description="This action cannot be undone. All associated game sessions and journal entries will also be permanently deleted."
        itemName={deleteDialog.characterName}
        confirmButtonText="Delete Character"
        cancelButtonText="Cancel"
        isDeleting={deleteDialog.isDeleting}
      />

      {/* Character Switch Confirmation Dialog */}
      <GameSessionConfirmationDialog
        isOpen={characterSwitchDialog.isOpen}
        onClose={handleCancelCharacterSwitch}
        onConfirm={handleConfirmedCharacterSwitch}
        type="character-switch"
        characterName={characterSwitchDialog.characterName}
        currentProgress={currentProgress}
      />

      {/* Toast Notifications */}
      <div className="fixed top-4 right-4 space-y-2 z-50">
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            title={toast.title}
            description={toast.description}
            variant={toast.variant}
            duration={toast.duration}
            onDismiss={() => removeToast(toast.id)}
          />
        ))}
      </div>
    </PageLayout>
  );
}
