'use client';

import { useState, useEffect, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { Plus, Sparkles, Globe } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCharacterStore, type Character } from '@/state/characterStore';
import { useWorldStore } from '@/state/worldStore';
import { useSessionStore } from '@/state/sessionStore';
import { useNarrativeStore } from '@/state/narrativeStore';
import { deleteCharacterWithCleanup } from '@/services/characterDeletionService';
import { readString, writeString } from '@/lib/utils/browserStorage';
import { CharacterCard } from '@/components/CharacterCard';
import {
  CharacterViewToggle,
  type CharacterViewMode,
} from '@/components/character/CharacterViewToggle';
import { PageLayout } from '@/components/shared/PageLayout';
import { Hero } from '@/components/shared/Hero';
import { ActionButtonGroup } from '@/components/shared/ActionButtonGroup';
import { EmptyState } from '@/components/ui/EmptyState/EmptyState';
import { Button } from '@/components/ui/button';
import { generateUniqueId } from '@/lib/utils/generateId';
import type { GeneratedCharacterData } from '@/lib/generators/characterGenerator';
import { World } from '@/types/world.types';
import DeleteConfirmationDialog from '@/components/DeleteConfirmationDialog';
import { Toast } from '@/components/ui/toast';
import { getGenreLabel } from '@/lib/constants/genres';
import { GameSessionConfirmationDialog } from '@/components/GameSession/GameSessionConfirmationDialog';
import type { GeneratedImage } from '@/types/common.types';
import { generatePortrait } from '@/lib/api/generatePortrait';
import { characterApi } from '@/lib/api/characterApi';

// CharacterTable pulls @tanstack/react-table but only renders in table view,
// and the generate dialog only matters once the page is interactive. Load both
// on demand so the grid-default list page ships less up front (issue #1357).
const CharacterTable = dynamic(
  () =>
    import('@/components/character/CharacterTable').then((m) => ({
      default: m.CharacterTable,
    })),
  { ssr: false }
);
const GenerateCharacterDialog = dynamic(
  () =>
    import('@/components/GenerateCharacterDialog').then((m) => ({
      default: m.GenerateCharacterDialog,
    })),
  { ssr: false }
);

type CharacterPortraitUpdate = {
  portrait: GeneratedImage;
};

interface CharacterContext {
  recentEvent?: string;
  relationships: Array<{
    characterId: string;
    characterName: string;
    portraitUrl?: string | null;
  }>;
}

function transformGeneratedAttributes(
  generatedData: GeneratedCharacterData,
  currentWorld: World
) {
  return generatedData.attributes.map((attr) => {
    const worldAttr = currentWorld.attributes.find((wa) => wa.id === attr.id);
    return {
      id: generateUniqueId('attr'),
      characterId: '',
      worldAttributeId: attr.id,
      name: worldAttr?.name || 'Unknown',
      baseValue: attr.value,
      modifiedValue: attr.value,
      category: worldAttr?.category || 'General',
    };
  });
}

function transformGeneratedSkills(
  generatedData: GeneratedCharacterData,
  currentWorld: World
) {
  return generatedData.skills.map((skill) => {
    const worldSkill = currentWorld.skills.find((ws) => ws.id === skill.id);
    return {
      id: generateUniqueId('skill'),
      characterId: '',
      worldSkillId: skill.id,
      name: worldSkill?.name || 'Unknown',
      level: skill.level,
      category: worldSkill?.category,
    };
  });
}

async function generateCharacterPortrait(
  characterId: string,
  generatedData: GeneratedCharacterData,
  currentWorld: World,
  currentWorldId: string,
  updateCharacter: (id: string, updates: CharacterPortraitUpdate) => void
) {
  try {
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
        isKnownFigure: generatedData.isKnownFigure || false,
      },
    };

    const { portrait } = await generatePortrait({
      character: characterForPortrait,
      world: currentWorld,
    });
    if (portrait) {
      updateCharacter(characterId, { portrait });
    }
  } catch {
    // Fail silently
  }
}

export default function CharactersPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const {
    characters,
    currentCharacterId,
    setCurrentCharacter,
    createCharacter,
    updateCharacter,
  } = useCharacterStore();
  const { worlds, currentWorldId, worldStates } = useWorldStore();
  const currentSessionId = useSessionStore((state) => state.id);
  const { getSessionSegments } = useNarrativeStore();
  const [mounted, setMounted] = useState(false);

  const [isGenerating, setIsGenerating] = useState(false);
  const [generatingStatus, setGeneratingStatus] = useState<string>('');
  const [generateError, setGenerateError] = useState<string | null>(null);
  const [showGenerateDialog, setShowGenerateDialog] = useState(false);
  const [characterName, setCharacterName] = useState('');
  const [generationType, setGenerationType] = useState<
    'known' | 'original' | 'specific'
  >(() => {
    const types: Array<'known' | 'original'> = ['known', 'original'];
    return types[Math.floor(Math.random() * types.length)];
  });
  const [deleteDialog, setDeleteDialog] = useState({
    isOpen: false,
    characterId: null as string | null,
    characterName: '',
    isDeleting: false,
  });
  const [characterSwitchDialog, setCharacterSwitchDialog] = useState({
    isOpen: false,
    characterId: null as string | null,
    characterName: '',
  });
  const [toasts, setToasts] = useState<
    Array<{
      id: string;
      title: string;
      description?: string;
      variant: 'success' | 'error';
      duration?: number;
    }>
  >([]);

  const [viewMode, setViewMode] = useState<CharacterViewMode>('grid');

  useEffect(() => {
    const saved = readString('local', 'character-view-mode');
    if (saved === 'grid' || saved === 'table') {
      setViewMode(saved);
    }
  }, []);

  const handleViewModeChange = (mode: CharacterViewMode) => {
    setViewMode(mode);
    writeString('local', 'character-view-mode', mode);
  };

  const worldIdFromUrl = searchParams.get('worldId');
  const effectiveWorldId = worldIdFromUrl || currentWorldId;
  const currentWorld = effectiveWorldId ? worlds[effectiveWorldId] : null;
  const worldCharacters = (Object.values(characters) as Character[]).filter(
    (char) => char.worldId === effectiveWorldId
  );
  const worldState = effectiveWorldId
    ? worldStates?.[effectiveWorldId]
    : undefined;

  const characterContextById = useMemo(() => {
    if (!worldState) {
      return {} as Record<string, CharacterContext>;
    }

    const relationshipByCharacter = worldState.characterRelationships ?? {};

    return worldCharacters.reduce(
      (acc, character) => {
        const relationshipEntries = relationshipByCharacter[character.id] ?? {};

        const relationships = Object.entries(relationshipEntries)
          .filter(
            ([otherId]) =>
              otherId !== character.id && Boolean(characters[otherId])
          )
          .sort(([, a], [, b]) =>
            b.lastInteraction.localeCompare(a.lastInteraction)
          )
          .slice(0, 2)
          .map(([otherId]) => {
            const relatedCharacter = characters[otherId];
            return {
              characterId: otherId,
              characterName: relatedCharacter?.name ?? 'Unknown',
              portraitUrl: relatedCharacter?.portrait?.url ?? null,
            };
          });

        const characterEvents = (worldState.majorEvents ?? [])
          .filter((event) => event.characterId === character.id)
          .sort((a, b) => b.timestamp.localeCompare(a.timestamp));

        const recentEvent =
          characterEvents.length > 0
            ? characterEvents[0].description
            : undefined;

        acc[character.id] = {
          recentEvent,
          relationships,
        };

        return acc;
      },
      {} as Record<string, CharacterContext>
    );
  }, [worldState, worldCharacters, characters]);

  const currentProgress = currentSessionId
    ? getSessionSegments(currentSessionId).length
    : 0;

  useEffect(() => {
    setMounted(true);
  }, []);

  const headerTitle =
    mounted && currentWorld?.image?.url ? undefined : 'My Characters';
  const headerDescription =
    mounted && currentWorld?.image?.url
      ? undefined
      : 'Create unique characters for your interactive narrative adventures.';

  const addToast = (
    toast: Omit<
      {
        id: string;
        title: string;
        description?: string;
        variant: 'success' | 'error';
        duration?: number;
      },
      'id'
    >
  ) => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    const newToast = { ...toast, id };
    setToasts((prev) => [...prev, newToast]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, toast.duration || 3000);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const handleCreateCharacter = () => {
    router.push('/characters/create');
  };

  const handleGenerateCharacter = async () => {
    if (!currentWorld || !effectiveWorldId) return;
    if (generationType === 'specific' && !characterName.trim()) {
      setGenerateError('Please enter a character name');
      return;
    }

    setIsGenerating(true);
    setGenerateError(null);
    setGeneratingStatus('Creating character...');

    try {
      const existingNames = worldCharacters.map((char) => char.name);
      const nameToUse =
        generationType === 'specific' ? characterName : undefined;

      const generatedData: GeneratedCharacterData = await characterApi.generateCharacter({
        worldId: effectiveWorldId,
        characterType: generationType,
        existingNames: existingNames,
        suggestedName: nameToUse,
        world: currentWorld,
      });

      const characterId = createCharacter({
        name: generatedData.name,
        description: generatedData.background.description || '',
        worldId: effectiveWorldId,
        level: generatedData.level,
        attributes: transformGeneratedAttributes(generatedData, currentWorld!),
        skills: transformGeneratedSkills(generatedData, currentWorld!),
        derivedStats: [],
        background: {
          history: generatedData.background.description,
          personality: generatedData.background.personality,
          goals: generatedData.background.motivation
            ? [generatedData.background.motivation]
            : [],
          fears: generatedData.background.fears || [],
          physicalDescription:
            generatedData.background.physicalDescription || '',
          relationships: [],
          isKnownFigure: generatedData.isKnownFigure || false,
        },
        isPlayer: true,
        status: {
          health: 100,
          maxHealth: 100,
          conditions: [],
        },
        inventory: {
          characterId: '',
          items: [],
          capacity: 20,
          categories: [],
          itemOrder: [],
        },
        portrait: {
          type: 'placeholder',
          url: null,
        },
      });

      setCurrentCharacter(characterId);
      setGeneratingStatus('Generating portrait...');
      await generateCharacterPortrait(
        characterId,
        generatedData,
        currentWorld!,
        effectiveWorldId,
        updateCharacter
      );

      setShowGenerateDialog(false);
      setCharacterName('');
      setGenerationType('known');
      setGenerateError(null);
      router.push(`/characters/${characterId}`);
    } catch (error) {
      setGenerateError(
        error instanceof Error ? error.message : 'Failed to generate character'
      );
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
      isDeleting: false,
    });
  };

  const handleConfirmDelete = async () => {
    if (!deleteDialog.characterId) return;
    setDeleteDialog((prev) => ({ ...prev, isDeleting: true }));

    try {
      const characterName = deleteDialog.characterName;
      await deleteCharacterWithCleanup(deleteDialog.characterId);
      addToast({
        title: 'Character Deleted',
        description: `${characterName} has been permanently deleted`,
        variant: 'success',
      });
      setDeleteDialog({
        isOpen: false,
        characterId: null,
        characterName: '',
        isDeleting: false,
      });
    } catch {
      addToast({
        title: 'Delete Failed',
        description: "Couldn't delete this character. Try again in a moment.",
        variant: 'error',
      });
      setDeleteDialog((prev) => ({ ...prev, isDeleting: false }));
    }
  };

  const handleCancelDelete = () => {
    setDeleteDialog({
      isOpen: false,
      characterId: null,
      characterName: '',
      isDeleting: false,
    });
  };

  const handleCharacterPlay = (characterId: string) => {
    const character = characters[characterId];
    if (!character) return;

    if (currentCharacterId !== characterId && currentProgress > 0) {
      setCharacterSwitchDialog({
        isOpen: true,
        characterId,
        characterName: character.name,
      });
    } else {
      setCurrentCharacter(characterId);
      router.push(`/worlds/${character.worldId}/play`);
    }
  };

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

  const handleCancelCharacterSwitch = () => {
    setCharacterSwitchDialog({
      isOpen: false,
      characterId: null,
      characterName: '',
    });
  };

  if (mounted && (!effectiveWorldId || !currentWorld)) {
    return (
      <PageLayout title="My Characters">
        <EmptyState
          className="characters-empty-no-world"
          icon={<Globe aria-hidden="true" />}
          title="Choose Your World"
          description="Characters live inside a world. Head to Worlds to pick one, then come back here to view and create characters."
          action={
            <Button variant="default" onClick={() => router.push('/worlds')}>
              Go to Worlds
            </Button>
          }
        />
      </PageLayout>
    );
  }

  const actionButtons = [
    {
      label: 'Create Character',
      onClick: handleCreateCharacter,
      variant: 'primary' as const,
      icon: <Plus aria-hidden="true" />,
    },
    {
      label: 'Generate Character',
      onClick: () => setShowGenerateDialog(true),
      variant: 'secondary' as const,
      disabled: isGenerating,
      icon: <Sparkles aria-hidden="true" />,
    },
  ];

  return (
    <PageLayout title={headerTitle} description={headerDescription}>
      {/* When the world hero replaces the visible page header, PageLayout
          renders no h1, so keep a screen-reader page heading (#1530). */}
      {!headerTitle && <h1 className="sr-only">My Characters</h1>}

      {mounted && currentWorld && (
        <Hero
          title={currentWorld.name}
          image={
            currentWorld.image?.url
              ? { url: currentWorld.image.url, alt: currentWorld.name }
              : undefined
          }
          subtitle={
            currentWorld.genre ? getGenreLabel(currentWorld.genre) : undefined
          }
          titleElement="h2"
        />
      )}

      {mounted && currentWorld && (
        <div className="characters-toolbar">
          <CharacterViewToggle
            mode={viewMode}
            onModeChange={handleViewModeChange}
          />
          <ActionButtonGroup actions={actionButtons} layout="horizontal" gap="sm" />
        </div>
      )}

      <div className="characters-body">
        {!currentWorld || worldCharacters.length === 0 ? (
          <div className="characters-empty">
            <h2>No characters in {currentWorld?.name || 'this world'} yet</h2>
            <ActionButtonGroup
              layout="horizontal"
              gap="sm"
              actions={[
                {
                  label: isGenerating
                    ? generatingStatus || 'Generating...'
                    : 'Generate Character',
                  onClick: handleGenerateCharacter,
                  variant: 'secondary',
                  disabled: isGenerating,
                  size: 'lg',
                },
                {
                  label: 'Create Character',
                  onClick: handleCreateCharacter,
                  variant: 'primary',
                  size: 'lg',
                },
              ]}
            />
          </div>
        ) : viewMode === 'table' ? (
          <CharacterTable
            characters={worldCharacters as Character[]}
            currentCharacterId={currentCharacterId}
            onMakeActive={handleSelectCharacter}
            onView={handleViewCharacter}
            onPlay={handleCharacterPlay}
            onEdit={handleEditCharacter}
            onDelete={handleDeleteCharacter}
          />
        ) : (
          <div className="characters-grid">
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
      </div>

      <GenerateCharacterDialog
        isOpen={showGenerateDialog}
        isGenerating={isGenerating}
        generatingStatus={generatingStatus}
        characterName={characterName}
        generationType={generationType}
        worldName={currentWorld?.name || ''}
        error={generateError}
        onClose={() => setShowGenerateDialog(false)}
        onGenerate={handleGenerateCharacter}
        onCharacterNameChange={setCharacterName}
        onGenerationTypeChange={setGenerationType}
      />

      <DeleteConfirmationDialog
        isOpen={deleteDialog.isOpen}
        onClose={handleCancelDelete}
        onConfirm={handleConfirmDelete}
        title="Delete Character"
        description="This action cannot be undone."
        itemName={deleteDialog.characterName}
        confirmButtonText="Delete Character"
        cancelButtonText="Cancel"
        isDeleting={deleteDialog.isDeleting}
      />

      <GameSessionConfirmationDialog
        isOpen={characterSwitchDialog.isOpen}
        onClose={handleCancelCharacterSwitch}
        onConfirm={handleConfirmedCharacterSwitch}
        type="character-switch"
        characterName={characterSwitchDialog.characterName}
        currentProgress={currentProgress}
      />

      <div>
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            title={toast.title}
            description={toast.description}
            variant={toast.variant}
            onDismiss={() => removeToast(toast.id)}
          />
        ))}
      </div>
    </PageLayout>
  );
}
