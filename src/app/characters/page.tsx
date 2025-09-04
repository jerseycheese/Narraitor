'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useCharacterStore, type Character } from '@/state/characterStore';
import { useWorldStore } from '@/state/worldStore';
import { CharacterDeletionService } from '@/services/characterDeletionService';
import { CharacterCard } from '@/components/CharacterCard';
import { PageLayout } from '@/components/shared/PageLayout';
import { Hero } from '@/components/shared/Hero';
import { ActionButtonGroup } from '@/components/shared/ActionButtonGroup';
import { generateUniqueId } from '@/lib/utils/generateId';
import type { GeneratedCharacterData } from '@/lib/ai/characterGenerator';
// Using API routes for secure AI operations
import { GenerateCharacterDialog } from '@/components/GenerateCharacterDialog';
import { World } from '@/types/world.types';
import DeleteConfirmationDialog from '@/components/DeleteConfirmationDialog';
import { Toast } from '@/components/ui/toast';
import { getGenreLabel } from '@/lib/constants/genres';
import { useAsyncOperation } from '@/lib/hooks/useAsyncOperation';

// Type for character portrait update
type CharacterPortraitUpdate = {
  portrait: {
    type: 'ai-generated' | 'placeholder';
    url: string | null;
    generatedAt?: string;
    prompt?: string;
  };
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
        generatedAt: new Date().toISOString(),
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
  const { worlds, currentWorldId } = useWorldStore();
  const [showGenerateDialog, setShowGenerateDialog] = useState(false);
  const [characterName, setCharacterName] = useState('');
  const [generationType, setGenerationType] = useState<'known' | 'original' | 'specific'>('known');
  const [deleteDialog, setDeleteDialog] = useState({
    isOpen: false,
    characterId: null as string | null,
    characterName: '',
    isDeleting: false
  });
  const [toasts, setToasts] = useState<Array<{
    id: string;
    title: string;
    description?: string;
    variant: 'success' | 'error';
    duration?: number;
  }>>([]);

  // Async operation hook for character generation
  const generateOperation = useAsyncOperation(
    async () => {
      if (!currentWorld || !effectiveWorldId) throw new Error('No world selected');
      
      // Validate specific character name
      if (generationType === 'specific' && !characterName.trim()) {
        throw new Error('Please enter a character name');
      }
      
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
        attributes: transformGeneratedAttributes(generatedData, currentWorld),
        skills: transformGeneratedSkills(generatedData, currentWorld),
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
          categories: []
        },
        portrait: {
          type: 'placeholder',
          url: null
        }
      });
      
      // Select the new character
      setCurrentCharacter(characterId);
      
      // Generate portrait for the character
      await generateCharacterPortrait(
        characterId,
        generatedData,
        currentWorld,
        effectiveWorldId,
        updateCharacter
      );
      
      return { characterId, generatedData };
    },
    {
      onSuccess: ({ characterId }) => {
        // Reset dialog state
        setShowGenerateDialog(false);
        setCharacterName('');
        setGenerationType('known');
        
        // Navigate to view the character
        router.push(`/characters/${characterId}`);
      }
    }
  );

  // Async operation hook for character deletion
  const deleteOperation = useAsyncOperation(
    async (characterId: string) => {
      const character = characters[characterId];
      if (!character) throw new Error('Character not found');
      
      // Use service layer for decoupled deletion with journal cleanup
      await CharacterDeletionService.deleteCharacterWithCleanup(characterId);
      
      return character.name;
    },
    {
      onSuccess: (characterName) => {
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
      },
      onError: () => {
        // Error toast
        addToast({
          title: 'Delete Failed',
          description: 'Failed to delete character. Please try again.',
          variant: 'error'
        });
        
        setDeleteDialog(prev => ({ ...prev, isDeleting: false }));
      }
    }
  );
  
  // Use worldId from URL if provided, otherwise use the current world
  const worldIdFromUrl = searchParams.get('worldId');
  const effectiveWorldId = worldIdFromUrl || currentWorldId;
  
  const currentWorld = effectiveWorldId ? worlds[effectiveWorldId] : null;
  const worldCharacters = (Object.values(characters) as Character[]).filter(
    (char) => char.worldId === effectiveWorldId
  );

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
  
  const handleGenerateCharacter = () => {
    generateOperation.execute();
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

  const handleConfirmDelete = () => {
    if (!deleteDialog.characterId) return;
    
    setDeleteDialog(prev => ({ ...prev, isDeleting: true }));
    deleteOperation.execute(deleteDialog.characterId);
  };

  const handleCancelDelete = () => {
    setDeleteDialog({ 
      isOpen: false, 
      characterId: null, 
      characterName: '', 
      isDeleting: false 
    });
  };

  if (!effectiveWorldId || !currentWorld) {
    return (
      <PageLayout
        title="My Characters"
        description="Create unique characters for your interactive narrative adventures."
      >
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="w-20 h-20 bg-blue-100 rounded-full mx-auto mb-4 flex items-center justify-center">
            <svg className="w-10 h-10 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
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
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
      )
    },
    {
      label: 'Generate Character',
      onClick: () => setShowGenerateDialog(true),
      variant: 'secondary' as const,
      disabled: generateOperation.isLoading,
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
      )
    },
    ...(currentCharacterId && effectiveWorldId ? [{
      label: 'Start Playing',
      onClick: () => {
        const character = characters[currentCharacterId];
        if (character) {
          router.push(`/world/${character.worldId}/play`);
        }
      },
      variant: 'success' as const,
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    }] : [])
  ];

  return (
    <PageLayout
      title={currentWorld?.image?.url ? undefined : "My Characters"}
      description={currentWorld?.image?.url ? undefined : `Create unique characters for your interactive narrative adventures. Use the "Make Active" button on a character to set them as your current character for gameplay.`}
    >
      {/* Show world hero with image or themed background */}
      {currentWorld && (
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

      {/* Action buttons below hero when world exists */}
      {currentWorld && (
        <div className="mb-8 flex justify-end">
          <ActionButtonGroup actions={actionButtons} />
        </div>
      )}

      {/* Show back link if viewing from a specific world without image */}
      {worldIdFromUrl && !currentWorld?.image?.url && (
        <div className="mb-6 -mt-8">
          <Link
            href={`/world/${worldIdFromUrl}`}
            className="text-link-primary flex items-center gap-2 no-underline"
          >
            <span>←</span> Back to {currentWorld.name}
          </Link>
        </div>
      )}

      {generateOperation.error && (
        <div className="mb-4 p-4 bg-red-200 border border-red-500 rounded-lg text-red-700">
          <p className="font-medium">Generation Failed</p>
          <p className="text-sm mt-1">{generateOperation.error}</p>
        </div>
      )}

      {worldCharacters.length === 0 ? (
        <div className="bg-white rounded-lg shadow-lg p-12 text-center max-w-2xl mx-auto">
          <div className="mb-6">
            <h2 className="text-2xl font-semibold mb-2">No characters in {currentWorld.name} yet</h2>
            <p className="text-gray-700 mb-2">
              Choose how you&apos;d like to add your first character.
            </p>
          </div>
          <ActionButtonGroup
            actions={[
              {
                label: generateOperation.isLoading ? 'Generating...' : 'Generate Character',
                onClick: handleGenerateCharacter,
                variant: 'secondary',
                disabled: generateOperation.isLoading,
                size: 'lg',
                icon: generateOperation.isLoading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                )
              },
              {
                label: 'Create Character',
                onClick: handleCreateCharacter,
                variant: 'primary',
                size: 'lg',
                icon: (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                )
              }
            ]}
            className="justify-center"
          />
          <div className="mt-6 text-sm text-gray-500">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
              <div>
                <p className="font-medium text-blue-700 mb-1">Generate Character</p>
                <p>AI creates a character {currentWorld.reference ? `from ${currentWorld.reference}` : 'for your world'}</p>
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
          {worldCharacters.map(character => (
            <CharacterCard
              key={character.id}
              character={character}
              isActive={currentCharacterId === character.id}
              onMakeActive={() => handleSelectCharacter(character.id)}
              onView={() => handleViewCharacter(character.id)}
              onPlay={() => {
                setCurrentCharacter(character.id);
                router.push(`/world/${character.worldId}/play`);
              }}
              onEdit={() => handleEditCharacter(character.id)}
              onDelete={() => handleDeleteCharacter(character.id)}
            />
          ))}
        </div>
      )}
      
      {/* Character Generation Dialog */}
      <GenerateCharacterDialog
        isOpen={showGenerateDialog}
        isGenerating={generateOperation.isLoading}
        generatingStatus={generateOperation.isLoading ? 'Generating character...' : ''}
        characterName={characterName}
        generationType={generationType}
        worldName={currentWorld?.name || ''}
        error={generateOperation.error}
        onClose={() => {
          setShowGenerateDialog(false);
          setCharacterName('');
          setGenerationType('known');
          generateOperation.clearError();
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
        isDeleting={deleteOperation.isLoading}
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
