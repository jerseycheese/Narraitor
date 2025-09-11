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
  
  // Load world data on mount
  useEffect(() => {
    try {
      const { worlds } = useWorldStore.getState();
      const worldData = worlds[worldId];
      
      if (!worldData) {
        setError('World not found');
        setLoading(false);
        return;
      }
      
      setWorld(worldData);
      setLoading(false);
    } catch {
      setError('Failed to load world data');
      setLoading(false);
    }
  }, [worldId]);
  
  // Handle saving all world changes
  const handleSave = async () => {
    if (!world) return;
    
    setSaving(true);
    try {
      const { updateWorld } = useWorldStore.getState();
      updateWorld(worldId, world);
      
      // Small delay to show save state
      await new Promise(resolve => setTimeout(resolve, 500));
      
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
      <div className="flex justify-center items-center p-8" role="status" aria-label="Loading world data">
        <div className="text-lg text-muted-foreground">Loading world data...</div>
      </div>
    );
  }
  
  if (error || !world) {
    return (
      <div className="p-4" role="alert">
        <div className="text-destructive">{error || 'World not found'}</div>
        <Button 
          onClick={() => router.push('/worlds')}
          className="mt-4"
        >
          Return to Worlds
        </Button>
      </div>
    );
  }
  
  return (
    <form onSubmit={(e) => { e.preventDefault(); handleSave(); }} className="space-y-6">
      <CollapsibleSection 
        title="Basic Information" 
        initiallyExpanded={true}
        className="bg-background"
      >
        <WorldBasicInfoForm 
          world={world} 
          onChange={handleWorldChange} 
        />
      </CollapsibleSection>

      <CollapsibleSection 
        title="World Image" 
        initiallyExpanded={false}
        className="bg-background"
      >
        <WorldImageForm
          world={world}
          onChange={handleWorldChange}
        />
      </CollapsibleSection>
      
      <CollapsibleSection 
        title="Attributes" 
        initiallyExpanded={false}
        className="bg-background"
      >
        <WorldAttributesForm 
          attributes={world.attributes} 
          skills={world.skills}
          worldId={worldId} 
          maxAttributes={world.settings.maxAttributes}
          onChange={(attributes) => handleWorldChange({ attributes })} 
        />
      </CollapsibleSection>
      
      <CollapsibleSection 
        title="Skills" 
        initiallyExpanded={false}
        className="bg-background"
      >
        <WorldSkillsForm 
          skills={world.skills} 
          attributes={world.attributes} 
          worldId={worldId} 
          onChange={(skills) => handleWorldChange({ skills })} 
        />
      </CollapsibleSection>
      
      <CollapsibleSection 
        title="World Settings" 
        initiallyExpanded={false}
        className="bg-background"
      >
        <WorldSettingsForm 
          settings={world.settings} 
          toneSettings={world.toneSettings}
          onChange={(settings) => handleWorldChange({ settings })} 
          onToneSettingsChange={(toneSettings) => handleWorldChange({ toneSettings })}
        />
      </CollapsibleSection>
      
      <div className="flex justify-end space-x-4 pt-6 border-t border-border">
        <Button 
          type="button"
          variant="outline"
          onClick={handleCancel}
          disabled={saving}
        >
          Cancel
        </Button>
        <Button 
          type="submit"
          disabled={saving}
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </form>
  );
};

export default WorldEditor;
