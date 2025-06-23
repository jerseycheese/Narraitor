import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useWorldStore } from '@/state/worldStore';
import { World } from '@/types/world.types';
import WorldBasicInfoForm from '@/components/forms/WorldBasicInfoForm';
import WorldAttributesForm from '@/components/forms/WorldAttributesForm';
import WorldSkillsForm from '@/components/forms/WorldSkillsForm';
import WorldSettingsForm from '@/components/forms/WorldSettingsForm';
import WorldImageForm from '@/components/forms/WorldImageForm';
import { useAsyncState } from '@/hooks';

interface WorldEditorProps {
  worldId: string;
}

const WorldEditor: React.FC<WorldEditorProps> = ({ worldId }) => {
  const router = useRouter();
  const [world, setWorld] = useState<World | null>(null);
  
  // Async state management using new hooks
  const loadingState = useAsyncState<World>();
  const saveState = useAsyncState();
  
  // Load world data on mount
  useEffect(() => {
    loadingState.execute(async () => {
      const { worlds } = useWorldStore.getState();
      const worldData = worlds[worldId];
      
      if (!worldData) {
        throw new Error('World not found');
      }
      
      setWorld(worldData);
      return worldData;
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [worldId]);
  
  // Handle saving all world changes
  const handleSave = async () => {
    if (!world) return;
    
    await saveState.execute(async () => {
      const { updateWorld } = useWorldStore.getState();
      updateWorld(worldId, world);
      
      // Small delay to show save state
      await new Promise(resolve => setTimeout(resolve, 500));
      
      router.push('/worlds'); // Navigate back to worlds list
    });
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
  
  if (loadingState.isLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="text-lg text-gray-600">Loading world data...</div>
      </div>
    );
  }
  
  if (loadingState.error || !world) {
    return (
      <div className="p-4">
        <div className="text-red-600">{loadingState.error || 'World not found'}</div>
        <button 
          onClick={() => router.push('/worlds')}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Return to Worlds
        </button>
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
        <button 
          onClick={handleCancel}
          className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-100"
          disabled={saveState.isLoading}
        >
          Cancel
        </button>
        <button 
          onClick={handleSave}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          disabled={saveState.isLoading}
        >
          {saveState.isLoading ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
};

export default WorldEditor;
