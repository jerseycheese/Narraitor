'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useWorldStore } from '@/state/worldStore';
import { World } from '@/types/world.types';
import { Button } from '@/components/ui/button';
import { CollapsibleSection } from '@/components/ui/CollapsibleSection';
import WorldBasicInfoForm from '@/components/forms/WorldBasicInfoForm';
import WorldAttributesForm from '@/components/forms/WorldAttributesForm';
import WorldSkillsForm from '@/components/forms/WorldSkillsForm';
import WorldSettingsForm from '@/components/forms/WorldSettingsForm';
import WorldImageForm from '@/components/forms/WorldImageForm';

interface WorldEditorProps {
  worldId: string;
}

const WorldEditor: React.FC<WorldEditorProps> = ({ worldId }) => {
  const router = useRouter();
  const [world, setWorld] = useState<World | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Reactive store selectors for hydration-safe loading
  const storeWorld = useWorldStore((state) => state.worlds[worldId]);
  const storeWorlds = useWorldStore((state) => state.worlds);
  const storeLoading = useWorldStore((state) => state.loading);
  const fetchWorlds = useWorldStore((state) => state.fetchWorlds);

  // Kick off store hydration on mount
  useEffect(() => {
    fetchWorlds().catch(() => {
      // Swallow errors; UI will show fallback error state
    });
  }, [fetchWorlds]);

  // Update local component state when store changes (supports delayed hydration)
  useEffect(() => {
    // While store reports loading OR the store has no worlds yet, keep loading
    const hasAnyWorlds = storeWorlds && Object.keys(storeWorlds).length > 0;

    if (storeLoading || !hasAnyWorlds) {
      setLoading(true);
      setError(null);
      return;
    }

    if (storeWorld) {
      setWorld(storeWorld);
      setError(null);
      setLoading(false);
      return;
    }

    // Store is hydrated and has worlds, but not this id
    setError('World not found');
    setLoading(false);
  }, [storeWorld, storeWorlds, storeLoading, worldId]);

  // No SSR gating here; component is client-only via directive at top

  // Handle saving all world changes
  const handleSave = async () => {
    if (!world) return;

    setSaving(true);
    try {
      const { updateWorld } = useWorldStore.getState();
      updateWorld(worldId, world);

      // Small delay to show save state
      await new Promise((resolve) => setTimeout(resolve, 500));

      router.push('/worlds'); // Navigate back to worlds list
    } catch {
      setError('Failed to save world');
    } finally {
      setSaving(false);
    }
  };

  // Handle canceling edits
  const handleCancel = () => {
    router.push('/worlds');
  };

  // Update world state when form sections change
  const handleWorldChange = (updates: Partial<World>) => {
    if (!world) return;
    setWorld({ ...world, ...updates });
  };

  if (loading) {
    return (
      <div className="world-editor-loading" role="status" aria-label="Loading world data">
        <div>Loading world data...</div>
      </div>
    );
  }

  if (error || !world) {
    return (
      <div className="world-editor-error" role="alert">
        <div>{error || 'World not found'}</div>
        <Button onClick={() => router.push('/worlds')}>Return to Worlds</Button>
      </div>
    );
  }

  return (
    <form
      className="component-world-editor world-editor-form"
      data-testid="world-editor-root"
      onSubmit={(e) => {
        e.preventDefault();
        handleSave();
      }}
    >
      <CollapsibleSection title="Basic Information">
        <WorldBasicInfoForm world={world} onChange={handleWorldChange} />
      </CollapsibleSection>

      <CollapsibleSection title="World Image" initialCollapsed={true}>
        <WorldImageForm world={world} onChange={handleWorldChange} />
      </CollapsibleSection>

      <CollapsibleSection title="Attributes" initialCollapsed={true}>
        <WorldAttributesForm
          attributes={world.attributes}
          skills={world.skills}
          worldId={worldId}
          maxAttributes={world.settings.maxAttributes}
          onChange={(attributes) => handleWorldChange({ attributes })}
        />
      </CollapsibleSection>

      <CollapsibleSection title="Skills" initialCollapsed={true}>
        <WorldSkillsForm
          skills={world.skills}
          attributes={world.attributes}
          worldId={worldId}
          onChange={(skills) => handleWorldChange({ skills })}
        />
      </CollapsibleSection>

      <CollapsibleSection title="World Settings" initialCollapsed={true}>
        <WorldSettingsForm
          settings={world.settings}
          toneSettings={world.toneSettings}
          onChange={(settings) => handleWorldChange({ settings })}
          onToneSettingsChange={(toneSettings) =>
            handleWorldChange({ toneSettings })
          }
        />
      </CollapsibleSection>

      <div className="world-editor-actions">
        <Button
          type="button"
          variant="outline"
          onClick={handleCancel}
          disabled={saving}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={saving}>
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </form>
  );
};

export default WorldEditor;
