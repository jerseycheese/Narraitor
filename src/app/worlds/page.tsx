'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import WorldListScreen from '@/components/WorldListScreen/WorldListScreen';
import { worldStore } from '@/state/worldStore';
import { generateWorld } from '@/lib/ai/worldGenerator';
import { generateUniqueId } from '@/lib/utils/generateId';

export default function WorldsPage() {
  const router = useRouter();
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatingStatus, setGeneratingStatus] = useState('');
  const [showPrompt, setShowPrompt] = useState(false);
  const [worldReference, setWorldReference] = useState('');
  const [worldName, setWorldName] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleCreateWorld = () => {
    router.push('/world/create');
  };

  const handleGenerateWorld = async () => {
    if (!worldReference.trim()) {
      setError('Please enter a world reference');
      return;
    }

    setIsGenerating(true);
    setGeneratingStatus('Generating world configuration...');
    setError(null);

    try {
      // Get existing world names to ensure uniqueness
      const { worlds } = worldStore.getState();
      const existingNames = Object.values(worlds).map(w => w.name);

      // Generate the world data
      const generatedData = await generateWorld(worldReference, existingNames, worldName);

      // Create attributes with IDs
      const attributes = generatedData.attributes.map(attr => ({
        ...attr,
        id: generateUniqueId('attr')
      }));

      // Create skills with IDs and associate with random attributes
      const skills = generatedData.skills.map(skill => ({
        ...skill,
        id: generateUniqueId('skill'),
        associatedAttributeId: attributes[Math.floor(Math.random() * attributes.length)].id
      }));

      // Create the world
      const worldId = worldStore.getState().createWorld({
        name: generatedData.name,
        theme: generatedData.theme,
        description: generatedData.description,
        attributes,
        skills,
        settings: generatedData.settings
      });

      // Hide the prompt and reset state
      setShowPrompt(false);
      setWorldReference('');
      setWorldName('');
      setIsGenerating(false);
      
      // Navigate to the new world
      router.push(`/world/${worldId}/edit`);
    } catch (err) {
      console.error('Failed to generate world:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate world');
      setIsGenerating(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <header className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold">
            My Worlds
          </h1>
          <div className="flex gap-2">
            <button
              onClick={handleCreateWorld}
              data-testid="create-world-button"
              className="py-2 px-4 bg-blue-500 text-white rounded-md border-none cursor-pointer text-base font-medium hover:bg-blue-600 transition-colors"
            >
              Create World
            </button>
            <button
              onClick={() => setShowPrompt(true)}
              disabled={isGenerating}
              className="py-2 px-4 bg-purple-500 text-white rounded-md border-none cursor-pointer text-base font-medium hover:bg-purple-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Generate World
            </button>
          </div>
        </header>

        {/* World Generation Prompt */}
        {showPrompt && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <h2 className="text-xl font-bold mb-4">Generate World</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    World Name (optional)
                  </label>
                  <input
                    type="text"
                    value={worldName}
                    onChange={(e) => setWorldName(e.target.value)}
                    placeholder="e.g., The Shattered Realms, Neo Tokyo 2185..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    disabled={isGenerating}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Leave empty to let AI generate a name
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Based On <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={worldReference}
                    onChange={(e) => setWorldReference(e.target.value)}
                    placeholder="e.g., Middle Earth, Star Wars, Victorian London..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    disabled={isGenerating}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Enter a fictional or non-fictional world to base your new world on
                  </p>
                </div>
              </div>
              {error && (
                <p className="text-red-600 text-sm mb-4">{error}</p>
              )}
              {isGenerating && (
                <p className="text-purple-600 text-sm mb-4 flex items-center gap-2">
                  <span className="inline-block w-4 h-4 border-2 border-purple-600 border-t-transparent rounded-full animate-spin"></span>
                  {generatingStatus}
                </p>
              )}
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => {
                    setShowPrompt(false);
                    setWorldReference('');
                    setWorldName('');
                    setError(null);
                  }}
                  disabled={isGenerating}
                  className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-100 cursor-pointer disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleGenerateWorld}
                  disabled={isGenerating || !worldReference.trim()}
                  className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isGenerating ? 'Generating...' : 'Generate'}
                </button>
              </div>
            </div>
          </div>
        )}

        <section>
          <WorldListScreen />
        </section>
      </div>
    </main>
  );
}