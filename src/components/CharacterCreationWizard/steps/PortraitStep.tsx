// src/components/CharacterCreationWizard/steps/PortraitStep.tsx

import React, { useRef, useState } from 'react';
import { CheckCircle } from 'lucide-react';
import { CharacterPortrait } from '@/components/CharacterPortrait';
import { GeneratedImage } from '@/types/common.types';
import { PortraitSubject } from '@/types/character.types';
import { World } from '@/types/world.types';
import { LoadingState } from '@/components/ui/LoadingState';
import { PortraitCustomizationSection } from '@/components/shared';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ImageUploadPicker,
  PresetAvatarPicker,
} from '@/components/CharacterPortrait';
import { usePortraitGeneration } from '@/lib/hooks/usePortraitGeneration';

interface CharacterFormData {
  name: string;
  description?: string;
  portrait?: GeneratedImage;
  attributes: Array<{ attributeId: string; value: number }>;
  skills: Array<{ skillId: string; level: number; isSelected: boolean }>;
  background: {
    history: string;
    personality: string;
    physicalDescription?: string;
    goals: string[];
    isKnownFigure?: boolean;
    knownFigureType?:
      | 'historical'
      | 'fictional'
      | 'celebrity'
      | 'mythological'
      | 'other';
  };
}

type PortraitSource = 'generate' | 'presets' | 'upload';

const PORTRAIT_SOURCES: Array<{ value: PortraitSource; label: string }> = [
  { value: 'generate', label: 'Generate' },
  { value: 'presets', label: 'Preset avatars' },
  { value: 'upload', label: 'Upload' },
];

interface PortraitStepProps {
  data: {
    characterData: CharacterFormData;
    worldId: string;
  };
  onUpdate: (updates: { portrait: GeneratedImage }) => void;
  worldConfig: Partial<World>;
}

export function PortraitStep({
  data,
  onUpdate,
  worldConfig,
}: PortraitStepProps) {
  const { isGenerating, error, generate, clearError } = usePortraitGeneration();

  // Local state for prompt-affecting fields
  const [localPhysicalDescription, setLocalPhysicalDescription] = useState(
    data.characterData.background?.physicalDescription || ''
  );
  const [environmentHint, setEnvironmentHint] = useState('');

  // Held locally so a player can look at an avatar or an upload without it
  // replacing the portrait already on the character.
  const [previewPortrait, setPreviewPortrait] = useState<GeneratedImage | null>(
    null
  );
  const [source, setSource] = useState<PortraitSource>('generate');

  /**
   * Bumped whenever the player switches source. Generation and file reads both
   * finish long after they start, so each one captures the value it began with
   * and drops its result if this has moved on — otherwise a slow generation
   * lands on top of the avatar the player picked while waiting for it.
   */
  const sourceEpochRef = useRef(0);

  const handleSourceChange = (value: string) => {
    sourceEpochRef.current += 1;
    setSource(value as PortraitSource);
    setPreviewPortrait(null);
    clearError();
  };

  const previewIfStillCurrent = (epoch: number) => (portrait: GeneratedImage) => {
    if (sourceEpochRef.current !== epoch) return;
    setPreviewPortrait(portrait);
  };

  const savedPortrait: GeneratedImage = data.characterData.portrait || {
    type: 'placeholder',
    url: null,
  };
  const portrait = previewPortrait ?? savedPortrait;

  const handleGeneratePortrait = async () => {
    const epoch = sourceEpochRef.current;

    const characterForGeneration: PortraitSubject = {
      name: data.characterData.name,
      background: {
        history:
          data.characterData.background.history +
          (environmentHint ? `${environmentHint}` : ''),
        personality: data.characterData.background.personality,
        physicalDescription:
          localPhysicalDescription ||
          data.characterData.background.physicalDescription,
      },
    };

    try {
      const generatedPortrait = await generate({
        character: characterForGeneration,
        world: worldConfig,
        customDescription: localPhysicalDescription,
      });
      if (sourceEpochRef.current !== epoch) return;
      if (generatedPortrait) {
        onUpdate({ portrait: generatedPortrait });
      }
    } catch {
      // Error already captured in hook state, but it belongs to a source the
      // player may have left by now.
      if (sourceEpochRef.current !== epoch) clearError();
    }
  };

  const handleRemovePortrait = () => {
    setPreviewPortrait(null);
    onUpdate({
      portrait: {
        type: 'placeholder',
        url: null,
      },
    });
    clearError();
  };

  const handleUsePreview = () => {
    if (!previewPortrait) return;
    onUpdate({ portrait: previewPortrait });
    setPreviewPortrait(null);
    clearError();
  };

  const hasSavedPortrait =
    savedPortrait.type !== 'placeholder' && Boolean(savedPortrait.url);

  // A generation failure only belongs on screen while Generate is the live
  // source and nothing newer is being previewed — the error must never win
  // over the avatar or upload the player is looking at.
  const visibleError =
    source === 'generate' && !previewPortrait ? error : null;

  const previewFromThisSource = previewIfStillCurrent(sourceEpochRef.current);

  return (
    <div className="component-portrait-step">
      <div className="portrait-step-header">
        <h3>Character Portrait</h3>
        <p>
          {data.characterData.background?.isKnownFigure
            ? `Generate a portrait of ${data.characterData.name} as they are commonly recognized`
            : 'Generate a portrait, pick a preset avatar, or upload your own image'}
        </p>
      </div>

      <div className="portrait-step-body">
        {isGenerating ? (
          <div className="portrait-step-loading">
            <LoadingState variant="spinner" size="md" />
          </div>
        ) : (
          <CharacterPortrait
            portrait={portrait}
            characterName={data.characterData.name}
            size="xlarge"
            error={visibleError}
          />
        )}

        {previewPortrait && (
          <div className="portrait-step-preview">
            <p className="portrait-step-preview-label">
              Just a preview. Choose &quot;Use this portrait&quot; to keep it —
              moving on without that leaves the character as it was.
            </p>
            <div className="portrait-step-actions">
              <button
                type="button"
                className="portrait-step-button"
                onClick={handleUsePreview}
              >
                Use this portrait
              </button>
              <button
                type="button"
                className="portrait-step-button"
                onClick={() => setPreviewPortrait(null)}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {!previewPortrait && hasSavedPortrait && (
          <div className="portrait-step-success">
            <p className="portrait-step-success-label">
              <CheckCircle aria-hidden="true" />
              Portrait saved to this character
            </p>
            <div className="portrait-step-actions">
              <button
                type="button"
                className="portrait-step-button"
                onClick={handleRemovePortrait}
              >
                Remove Portrait
              </button>
            </div>
          </div>
        )}

        <Tabs
          value={source}
          className="portrait-step-sources"
          onValueChange={handleSourceChange}
        >
          <TabsList role="group" aria-label="Where the portrait comes from">
            {PORTRAIT_SOURCES.map((option) => (
              <TabsTrigger
                key={option.value}
                value={option.value}
                aria-pressed={source === option.value}
              >
                {option.label}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="generate" className="portrait-step-generate">
            <PortraitCustomizationSection
              physicalDescription={localPhysicalDescription}
              setPhysicalDescription={setLocalPhysicalDescription}
              environmentHint={environmentHint}
              setEnvironmentHint={setEnvironmentHint}
            />
            <button
              type="button"
              className="portrait-step-button"
              onClick={handleGeneratePortrait}
              disabled={isGenerating}
              data-tutorial="portrait-generator-action"
            >
              {savedPortrait.type === 'ai-generated' && savedPortrait.url
                ? 'Regenerate Portrait'
                : 'Generate Portrait'}
            </button>
          </TabsContent>

          <TabsContent value="presets">
            <PresetAvatarPicker
              onPreview={previewFromThisSource}
              selectedUrl={portrait.url}
            />
          </TabsContent>

          <TabsContent value="upload">
            <ImageUploadPicker onPreview={previewFromThisSource} />
          </TabsContent>
        </Tabs>

        <p className="portrait-step-hint">
          A portrait is optional. You can skip this step and continue.
        </p>
      </div>
    </div>
  );
}
