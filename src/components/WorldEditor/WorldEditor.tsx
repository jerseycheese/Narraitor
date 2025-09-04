import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useWorldStore } from '@/state/worldStore';
import { World } from '@/types/world.types';
import { Button } from '@/components/ui/button';
import WorldBasicInfoForm from '@/components/forms/WorldBasicInfoForm';
import WorldAttributesForm from '@/components/forms/WorldAttributesForm';
import WorldSkillsForm from '@/components/forms/WorldSkillsForm';
import WorldSettingsForm from '@/components/forms/WorldSettingsForm';
import WorldImageForm from '@/components/forms/WorldImageForm';
import { useAsyncOperation } from '@/lib/hooks/useAsyncOperation';

interface WorldEditorProps {
  worldId: string;
}

const WorldEditor: React.FC<WorldEditorProps> = ({ worldId }) => {
  const router = useRouter();
  const [world, setWorld] = useState<World | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Async operation hook for saving
  const saveOperation = useAsyncOperation(
    async (worldData: World) => {
      const { updateWorld } = useWorldStore.getState();
      updateWorld(worldId, worldData);
      
      // Small delay to show save state
      await new Promise(resolve => setTimeout(resolve, 500));
      
      return worldData;
    },
    {
      onSuccess: () => {
        router.push('/worlds'); // Navigate back to worlds list
      },
      onError: () => {
        setError('Failed to save world');
      }
    }
  );
  
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
    
    await saveOperation.execute(world);
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
      <div className="flex justify-center items-center p-8">
        <div className="text-lg text-gray-700">Loading world data...</div>
      </div>
    );
  }
  
  if (error || !world) {
    return (
      <div className="p-4">
        <div className="text-red-500">{error || 'World not found'}</div>
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
    <div className="space-y-8">
      <WorldBasicInfoForm 
        world={world} 
        onChange={handleWorldChange} 
      />
      
      <WorldImageForm
        world={world}
        onChange={handleWorldChange}
      />
      
      <WorldAttributesForm 
        attributes={world.attributes} 
        skills={world.skills}
        worldId={worldId} 
        maxAttributes={world.settings.maxAttributes}
        onChange={(attributes) => handleWorldChange({ attributes })} 
      />
      
      <WorldSkillsForm 
        skills={world.skills} 
        attributes={world.attributes} 
        worldId={worldId} 
        onChange={(skills) => handleWorldChange({ skills })} 
      />
      
      <WorldSettingsForm 
        settings={world.settings} 
        toneSettings={world.toneSettings}
        onChange={(settings) => handleWorldChange({ settings })} 
        onToneSettingsChange={(toneSettings) => handleWorldChange({ toneSettings })}
      />
      
      <div className="flex justify-end space-x-4 pt-4 border-t">
        <Button 
          variant="outline"
          onClick={handleCancel}
          disabled={saveOperation.isLoading}
        >
          Cancel
        </Button>
        <Button 
          onClick={handleSave}
          disabled={saveOperation.isLoading}
        >
          {saveOperation.isLoading ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </div>
  );
};

export default WorldEditor;
