import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { worldStore } from '@/state/worldStore';
import { World } from '@/types/world.types';
import WorldBasicInfoForm from '@/components/forms/WorldBasicInfoForm';
import WorldAttributesForm from '@/components/forms/WorldAttributesForm';
import WorldSkillsForm from '@/components/forms/WorldSkillsForm';
import WorldSettingsForm from '@/components/forms/WorldSettingsForm';

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
      const { worlds } = worldStore.getState();
      const worldData = worlds[worldId];
      
      if (!worldData) {
        setError('World not found');
        setLoading(false);
        return;
      }
      
      setWorld(worldData);
      setLoading(false);
    } catch (err) {
      setError('Failed to load world data');
      setLoading(false);
      console.error('Error loading world:', err);
    }
  }, [worldId]);
  
  // Handle saving all world changes
  const handleSave = async () => {
    if (!world) return;
    
    setSaving(true);
    try {
      const { updateWorld } = worldStore.getState();
      updateWorld(worldId, world);
      
      // Small delay to show save state
      await new Promise(resolve => setTimeout(resolve, 500));
      
      router.push('/worlds'); // Navigate back to worlds list
    } catch (err) {
      setError('Failed to save world');
      console.error('Error saving world:', err);
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
      <div className="flex justify-center items-center p-8">
        <div className="text-lg text-gray-600">Loading world data...</div>
      </div>
    );
  }
  
  if (error || !world) {
    return (
      <div className="p-4">
        <div className="text-red-600">{error || 'World not found'}</div>
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
      
      <WorldAttributesForm 
        attributes={world.attributes} 
        worldId={worldId} 
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
        onChange={(settings) => handleWorldChange({ settings })} 
      />
      
      <div className="flex justify-end space-x-4 pt-4 border-t">
        <button 
          onClick={handleCancel}
          className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-100"
          disabled={saving}
        >
          Cancel
        </button>
        <button 
          onClick={handleSave}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          disabled={saving}
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
};

export default WorldEditor;