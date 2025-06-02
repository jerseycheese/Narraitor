'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import WorldListScreen from '@/components/WorldListScreen/WorldListScreen';
import { worldStore } from '@/state/worldStore';
import { generateUniqueId } from '@/lib/utils/generateId';
import type { GeneratedWorldData } from '@/lib/generators/worldGenerator';

export default function WorldsPage() {
  const router = useRouter();
  const modalRef = useRef<HTMLDivElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatingStatus, setGeneratingStatus] = useState('');
  const [showPrompt, setShowPrompt] = useState(false);
  const [worldReference, setWorldReference] = useState('');
  const [worldName, setWorldName] = useState('');
  const [worldRelationship, setWorldRelationship] = useState<'set_in' | 'based_on' | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);

  // Handle focus when modal opens/closes
  useEffect(() => {
    if (showPrompt && modalRef.current) {
      // Focus the modal when it opens
      modalRef.current.focus();
      
      // Trap focus within the modal
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape' && !isGenerating) {
          setShowPrompt(false);
          setWorldReference('');
          setWorldName('');
          setWorldRelationship(undefined);
          setError(null);
        }
      };
      
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [showPrompt, isGenerating]);

  const handleCreateWorld = () => {
    router.push('/world/create');
  };

  const handleGenerateWorld = async () => {
    if (worldRelationship && !worldReference.trim()) {
      setError('Please enter an existing setting');
      return;
    }

    setIsGenerating(true);
    setGeneratingStatus('Generating world configuration...');
    setError(null);

    try {
      // Get existing world names to ensure uniqueness
      const { worlds } = worldStore.getState();
      const existingNames = Object.values(worlds).map(w => w.name);

      // Generate the world data via API
      const response = await fetch('/api/generate-world', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          worldReference: worldReference || undefined,
          worldRelationship: worldRelationship || undefined,
          existingNames,
          suggestedName: worldName || undefined
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate world');
      }

      const generatedData: GeneratedWorldData = await response.json();

      // Create attributes with IDs and worldId placeholder
      const attributes = generatedData.attributes.map(attr => ({
        ...attr,
        id: generateUniqueId('attr'),
        worldId: '' // Will be set by the store
      }));

      // Create skills with IDs, worldId placeholder, and associate with random attributes
      const skills = generatedData.skills.map(skill => ({
        ...skill,
        id: generateUniqueId('skill'),
        worldId: '', // Will be set by the store
        associatedAttributeId: attributes[Math.floor(Math.random() * attributes.length)].id
      }));

      // Create the world initially without an image
      const worldId = worldStore.getState().createWorld({
        name: generatedData.name,
        theme: generatedData.theme,
        description: generatedData.description,
        reference: worldReference || undefined,
        relationship: worldRelationship || undefined,
        attributes,
        skills,
        settings: generatedData.settings
      });

      // Now generate the world image
      setGeneratingStatus('Generating world image...');
      
      try {
        // Get the created world to generate image for it
        const createdWorld = worldStore.getState().worlds[worldId];
        console.log('🖼️ WORLD IMAGE: Starting image generation for world:', createdWorld.name);
        console.log('🖼️ WORLD IMAGE: World data being sent:', JSON.stringify(createdWorld, null, 2));
        
        const imageResponse = await fetch('/api/generate-world-image', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            world: createdWorld
          }),
        });

        console.log('🖼️ WORLD IMAGE: API response status:', imageResponse.status);
        console.log('🖼️ WORLD IMAGE: API response ok:', imageResponse.ok);

        if (imageResponse.ok) {
          const imageData = await imageResponse.json();
          console.log('🖼️ WORLD IMAGE: API response data:', imageData);
          
          // Only update with image if we actually got one
          if (imageData.imageUrl) {
            console.log('🖼️ WORLD IMAGE: Updating world with image URL:', imageData.imageUrl);
            worldStore.getState().updateWorld(worldId, {
              image: {
                type: 'placeholder' as const,
                url: imageData.imageUrl,
                generatedAt: new Date().toISOString()
              }
            });
            console.log('🖼️ WORLD IMAGE: World updated successfully');
          } else {
            console.log('🖼️ WORLD IMAGE: No imageUrl in response data');
          }
          // If no image was generated (placeholder mode), just continue without image
        } else {
          console.error('🖼️ WORLD IMAGE: API request failed with status:', imageResponse.status);
          const errorText = await imageResponse.text();
          console.error('🖼️ WORLD IMAGE: Error response:', errorText);
        }
      } catch (imageError) {
        console.error('🖼️ WORLD IMAGE: Exception during image generation:', imageError);
        // Continue without image - world creation should still succeed
      }

      // Set as current world
      worldStore.getState().setCurrentWorld(worldId);

      // Hide the prompt and reset state
      setShowPrompt(false);
      setWorldReference('');
      setWorldName('');
      setWorldRelationship(undefined);
      setIsGenerating(false);
      
      // Stay on worlds page to see the new world
    } catch (err) {
      console.error('Failed to generate world:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate world');
      setIsGenerating(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <header className="mb-8">
          <div className="flex justify-between items-center mb-4">
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
          </div>
          <p className="text-gray-600">
            Select a world to make it active, then create characters and start your interactive narrative. You can switch between worlds anytime using the world selector in the navigation bar.
          </p>
        </header>

        {/* World Generation Prompt */}
        {showPrompt && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            role="dialog"
            aria-modal="true"
            aria-labelledby="generate-world-title"
            aria-describedby="generate-world-description"
          >
            <div 
              className="bg-white rounded-lg p-6 max-w-md w-full mx-4"
              tabIndex={-1}
              ref={modalRef}
            >
              <h2 id="generate-world-title" className="text-xl font-bold mb-4">Generate World</h2>
              <div id="generate-world-description" className="space-y-4">
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
                    Leave empty for an auto-generated name
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    World Type
                  </label>
                  <div className="space-y-4">
                    <div className="flex items-start space-x-3">
                      <input
                        type="radio"
                        id="generate-relationship-none"
                        name="generate-relationship"
                        value=""
                        checked={!worldRelationship}
                        onChange={() => {
                          setWorldRelationship(undefined);
                          setWorldReference('');
                        }}
                        className="mt-1 text-purple-600 focus:ring-purple-500"
                        disabled={isGenerating}
                      />
                      <div>
                        <label htmlFor="generate-relationship-none" className="text-sm font-medium text-gray-900">
                          Original World
                        </label>
                        <p className="text-sm text-gray-600">
                          Generate a completely original world with unique settings and themes
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-3">
                      <input
                        type="radio"
                        id="generate-relationship-based-on"
                        name="generate-relationship"
                        value="based_on"
                        checked={worldRelationship === 'based_on'}
                        onChange={() => setWorldRelationship('based_on')}
                        className="mt-1 text-purple-600 focus:ring-purple-500"
                        disabled={isGenerating}
                      />
                      <div>
                        <label htmlFor="generate-relationship-based-on" className="text-sm font-medium text-gray-900">
                          Inspired By
                        </label>
                        <p className="text-sm text-gray-600">
                          Generate an original world inspired by an existing fictional universe or real setting
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-3">
                      <input
                        type="radio"
                        id="generate-relationship-set-in"
                        name="generate-relationship"
                        value="set_in"
                        checked={worldRelationship === 'set_in'}
                        onChange={() => setWorldRelationship('set_in')}
                        className="mt-1 text-purple-600 focus:ring-purple-500"
                        disabled={isGenerating}
                      />
                      <div>
                        <label htmlFor="generate-relationship-set-in" className="text-sm font-medium text-gray-900">
                          Set Within
                        </label>
                        <p className="text-sm text-gray-600">
                          Generate a world directly within an existing fictional universe or real setting
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                
                {worldRelationship && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Existing Setting <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={worldReference}
                      onChange={(e) => setWorldReference(e.target.value)}
                      placeholder="e.g., Star Wars, Victorian London, Ancient Rome, 1960s New York..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                      disabled={isGenerating}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      {worldRelationship === 'set_in' 
                        ? 'Enter the fictional universe or real setting where your world exists. Characters and locations will come from this setting.'
                        : 'Enter the fictional universe or real setting that will inspire your world. Your world will have original characters and locations with similar themes.'
                      }
                    </p>
                  </div>
                )}
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
                    setWorldRelationship(undefined);
                    setError(null);
                  }}
                  disabled={isGenerating}
                  className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-100 cursor-pointer disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleGenerateWorld}
                  disabled={isGenerating || (worldRelationship && !worldReference.trim())}
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