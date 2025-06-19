// src/components/devtools/EndingImageDebugSection/EndingImageDebugSection.tsx

import React, { useState } from 'react';
import Image from 'next/image';
import { CollapsibleSection } from '../CollapsibleSection';
import { useNarrativeStore } from '../../../state/narrativeStore';
import { useCharacterStore } from '../../../state/characterStore';
import { useWorldStore } from '../../../state/worldStore';
import type { StoryEnding, EndingTone, EndingType } from '../../../types/narrative.types';

export function EndingImageDebugSection() {
  const [generatedPrompt, setGeneratedPrompt] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [lastGeneratedImage, setLastGeneratedImage] = useState<string | null>(null);
  const [selectedTone, setSelectedTone] = useState<EndingTone>('hopeful');
  const [customEpilogue, setCustomEpilogue] = useState('');
  const [customLegacy, setCustomLegacy] = useState('');
  const [customWorldImpact, setCustomWorldImpact] = useState('');
  const [lastGenerationResult, setLastGenerationResult] = useState<{ 
    tone?: string; 
    prompt?: string; 
    imageUrl?: string;
    aiGenerated?: boolean;
    service?: string;
    placeholder?: boolean;
  } | null>(null);
  
  // Get data from stores
  const { currentEnding, getSessionSegments } = useNarrativeStore();
  const characters = useCharacterStore((state) => state.characters);
  const worlds = useWorldStore((state) => state.worlds);
  
  const toneOptions: EndingTone[] = ['triumphant', 'bittersweet', 'mysterious', 'tragic', 'hopeful'];
  
  // Create a mock ending for testing
  const createMockEnding = (): StoryEnding => {
    const mockCharacter = Object.values(characters)[0];
    const mockWorld = Object.values(worlds)[0];
    
    return {
      id: 'debug-ending',
      sessionId: 'debug-session',
      characterId: mockCharacter?.id || 'debug-character',
      worldId: mockWorld?.id || 'debug-world',
      type: 'player-choice' as EndingType,
      tone: selectedTone,
      epilogue: customEpilogue || 'The hero stood at the edge of the realm, looking back at all they had accomplished. The journey had been long and filled with challenges, but in the end, they had found what they were searching for. The story comes to a close with a sense of completion and new beginnings on the horizon.',
      characterLegacy: customLegacy || 'The hero will be remembered as a beacon of hope and courage. Their actions inspired others to follow in their footsteps, creating a lasting impact that would echo through generations.',
      worldImpact: customWorldImpact || 'The world was forever changed by the hero\'s actions. Peace was restored to the land, and the people could once again look toward the future with optimism.',
      timestamp: new Date(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      achievements: [
        'Master of Destiny: Shaped the fate of the realm through decisive actions',
        'Hero of the People: Saved countless lives through brave deeds',
        'Legend Born: Became a story that will be told for generations'
      ]
    };
  };

  const generatePromptPreview = async () => {
    setIsGenerating(true);
    
    try {
      const mockEnding = currentEnding || createMockEnding();
      const character = characters[mockEnding.characterId] || Object.values(characters)[0];
      const world = worlds[mockEnding.worldId] || Object.values(worlds)[0];
      
      // Get recent narrative segments for context
      let recentNarrative: string[] = [];
      if (currentEnding) {
        const recentSegments = getSessionSegments(currentEnding.sessionId);
        recentNarrative = recentSegments
          .slice(-5)
          .map(segment => segment.content);
      } else {
        // Mock narrative for testing
        recentNarrative = [
          'The final battle began at dawn, with allies gathering from across the realm.',
          'With a mighty strike, the hero defeated the ancient evil that had plagued the land.',
          'The people cheered as peace was restored to the kingdom.',
          'The hero looked upon their companions, knowing their journey together was ending.',
          'A new chapter was beginning, but this story had reached its conclusion.'
        ];
      }
      
      const requestBody = {
        ending: mockEnding,
        world,
        character,
        recentNarrative,
        promptOnly: true // Flag to return only the prompt
      };
      
      console.log('Calling ending image API with data:', requestBody);
      
      const response = await fetch('/api/generate-ending-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API request failed: ${response.status} - ${errorText}`);
      }
      
      const result = await response.json();
      console.log('API response result:', result);
      
      const prompt = result.prompt || result.imageGenerationPrompt || 'No prompt returned';
      setGeneratedPrompt(prompt);
      setLastGenerationResult(result);
      
      // If an image was generated, show it
      if (result.imageUrl && !result.placeholder) {
        setLastGeneratedImage(result.imageUrl);
      }
      
    } catch (error) {
      setGeneratedPrompt(`Error generating prompt: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const testFullGeneration = async () => {
    setIsGenerating(true);
    
    try {
      const mockEnding = currentEnding || createMockEnding();
      const character = characters[mockEnding.characterId] || Object.values(characters)[0];
      const world = worlds[mockEnding.worldId] || Object.values(worlds)[0];
      
      // Get recent narrative segments for context
      let recentNarrative: string[] = [];
      if (currentEnding) {
        const recentSegments = getSessionSegments(currentEnding.sessionId);
        recentNarrative = recentSegments
          .slice(-5)
          .map(segment => segment.content);
      } else {
        // Mock narrative for testing
        recentNarrative = [
          'The final battle began at dawn, with allies gathering from across the realm.',
          'With a mighty strike, the hero defeated the ancient evil that had plagued the land.',
          'The people cheered as peace was restored to the kingdom.',
          'The hero looked upon their companions, knowing their journey together was ending.',
          'A new chapter was beginning, but this story had reached its conclusion.'
        ];
      }
      
      const requestBody = {
        ending: mockEnding,
        world,
        character,
        recentNarrative
      };
      
      console.log('Generating full ending image with data:', requestBody);
      
      const response = await fetch('/api/generate-ending-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API request failed: ${response.status} - ${errorText}`);
      }
      
      const result = await response.json();
      
      setGeneratedPrompt(result.imageGenerationPrompt || result.prompt || 'No prompt returned');
      setLastGeneratedImage(result.imageUrl);
      setLastGenerationResult(result);
      
    } catch (error) {
      setGeneratedPrompt(`Generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const copyPromptToClipboard = () => {
    navigator.clipboard.writeText(generatedPrompt);
  };

  // Helper function to get CSS class for tone (from EndingScreen component)
  const getEndingCSSClass = (tone: EndingTone) => {
    return `ending-screen ending-${tone}`;
  };

  // Helper function to get header text color for tone (from EndingScreen component)
  const getHeaderTextColor = (tone: EndingTone) => {
    switch (tone) {
      case 'triumphant': // Amber background (#f59e0b)
        return 'text-black'; // Black text for bright amber
      case 'hopeful': // Emerald background (#10b981)  
        return 'text-white'; // White text for emerald
      case 'bittersweet': // Violet background (#8b5cf6)
        return 'text-white'; // White text for violet
      case 'mysterious': // Gray background (#374151)
        return 'text-white'; // White text for dark gray
      case 'tragic': // Dark red background (#991b1b)
        return 'text-white'; // White text for dark red
      default:
        return 'text-white'; // Default to white text
    }
  };

  // Get tone mapping for CSS classes
  const getToneBackgroundColor = (tone: EndingTone) => {
    switch (tone) {
      case 'triumphant':
        return '#f59e0b'; // amber-500
      case 'bittersweet':
        return '#8b5cf6'; // violet-500
      case 'mysterious':
        return '#374151'; // gray-700
      case 'tragic':
        return '#991b1b'; // red-800
      case 'hopeful':
        return '#10b981'; // emerald-500
      default:
        return '#6b7280'; // gray-500
    }
  };

  const currentCharacter = currentEnding ? characters[currentEnding.characterId] : Object.values(characters)[0];
  const currentWorld = currentEnding ? worlds[currentEnding.worldId] : Object.values(worlds)[0];

  return (
    <CollapsibleSection title="Ending Image Generation Debug" initialCollapsed={true}>
      <div className="space-y-4">
        
        {/* Current Ending Info */}
        {currentEnding ? (
          <div className="bg-green-900 bg-opacity-30 p-3 rounded border border-green-700">
            <h4 className="font-medium mb-2 text-green-300">✅ Active Ending Available</h4>
            <div className="text-sm space-y-1 text-slate-300">
              <div><strong>Tone:</strong> {currentEnding.tone}</div>
              <div><strong>Type:</strong> {currentEnding.type}</div>
              <div><strong>Character:</strong> {currentCharacter?.name || 'Unknown'}</div>
              <div><strong>World:</strong> {currentWorld?.name || 'Unknown'} ({currentWorld?.theme || 'No theme'})</div>
            </div>
          </div>
        ) : (
          <div className="bg-yellow-900 bg-opacity-30 p-3 rounded border border-yellow-700">
            <h4 className="font-medium mb-2 text-yellow-300">⚠️ No Active Ending</h4>
            <p className="text-sm text-slate-300">Using mock data for testing. Generate an actual ending to see real prompts.</p>
          </div>
        )}

        {/* Tone & CSS Class Inspection */}
        {currentEnding && (
          <div className="bg-purple-900 bg-opacity-30 p-3 rounded border border-purple-700">
            <h4 className="font-medium mb-2 text-purple-300">🎨 AI-Selected Tone & CSS Inspection</h4>
            <div className="space-y-3">
              <div className="text-sm space-y-1 text-slate-300">
                <div><strong>AI Selected Tone:</strong> <span className="font-mono bg-slate-700 px-2 py-1 rounded">{currentEnding.tone}</span></div>
                <div><strong>CSS Class Applied:</strong> <span className="font-mono bg-slate-700 px-2 py-1 rounded">{getEndingCSSClass(currentEnding.tone)}</span></div>
                <div><strong>Header Text Color:</strong> <span className="font-mono bg-slate-700 px-2 py-1 rounded">{getHeaderTextColor(currentEnding.tone)}</span></div>
              </div>
              
              {/* Visual Preview */}
              <div className="border border-slate-600 rounded p-2">
                <div className="text-xs text-slate-400 mb-1">EndingScreen Preview:</div>
                <div 
                  className={`${getEndingCSSClass(currentEnding.tone)} ${getHeaderTextColor(currentEnding.tone)} p-3 rounded text-center`}
                  style={{ backgroundColor: getToneBackgroundColor(currentEnding.tone) }}
                >
                  <div className="font-bold">The End</div>
                  <div className="text-sm opacity-90">{currentCharacter?.name} • {currentWorld?.name}</div>
                </div>
              </div>
              
              {/* Tone Color Reference */}
              <div className="text-xs text-slate-400">
                <div><strong>Background Color:</strong> {getToneBackgroundColor(currentEnding.tone)}</div>
                <div><strong>Expected in CSS:</strong> .ending-{currentEnding.tone}</div>
              </div>
            </div>
          </div>
        )}

        {/* Mock Ending Configuration */}
        {!currentEnding && (
          <div className="bg-slate-700 p-3 rounded border border-slate-600">
            <h4 className="font-medium mb-2 text-slate-200">Mock Ending Configuration</h4>
            
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1 text-slate-200">Ending Tone:</label>
                <select
                  value={selectedTone}
                  onChange={(e) => setSelectedTone(e.target.value as EndingTone)}
                  className="w-full px-3 py-1 bg-slate-800 text-slate-200 border border-slate-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {toneOptions.map((tone) => (
                    <option key={tone} value={tone}>
                      {tone.charAt(0).toUpperCase() + tone.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1 text-slate-200">Custom Epilogue (optional):</label>
                <textarea
                  value={customEpilogue}
                  onChange={(e) => setCustomEpilogue(e.target.value)}
                  placeholder="Leave empty to use default mock epilogue..."
                  className="w-full px-3 py-2 bg-slate-800 text-slate-200 border border-slate-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  rows={3}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1 text-slate-200">Custom Character Legacy (optional):</label>
                <textarea
                  value={customLegacy}
                  onChange={(e) => setCustomLegacy(e.target.value)}
                  placeholder="Leave empty to use default mock legacy..."
                  className="w-full px-3 py-2 bg-slate-800 text-slate-200 border border-slate-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  rows={2}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1 text-slate-200">Custom World Impact (optional):</label>
                <textarea
                  value={customWorldImpact}
                  onChange={(e) => setCustomWorldImpact(e.target.value)}
                  placeholder="Leave empty to use default mock world impact..."
                  className="w-full px-3 py-2 bg-slate-800 text-slate-200 border border-slate-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  rows={2}
                />
              </div>
            </div>
          </div>
        )}

        {/* Data Summary */}
        <div className="bg-slate-700 p-3 rounded border border-slate-600">
          <h4 className="font-medium mb-2 text-slate-200">Data Summary</h4>
          <div className="text-sm space-y-1 text-slate-300">
            <div><strong>Character:</strong> {currentCharacter?.name || 'No characters available'}</div>
            <div><strong>World:</strong> {currentWorld?.name || 'No worlds available'} ({currentWorld?.theme || 'No theme'})</div>
            <div><strong>Available Characters:</strong> {Object.keys(characters).length}</div>
            <div><strong>Available Worlds:</strong> {Object.keys(worlds).length}</div>
          </div>
        </div>

        {/* Prompt Generation */}
        <div className="space-y-2">
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={generatePromptPreview}
              className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
              disabled={isGenerating}
            >
              {isGenerating ? 'Generating...' : 'Generate Prompt Preview'}
            </button>
            <button
              onClick={testFullGeneration}
              className="px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600"
              disabled={isGenerating}
            >
              {isGenerating ? 'Generating...' : 'Test Full Generation'}
            </button>
            {generatedPrompt && (
              <button
                onClick={copyPromptToClipboard}
                className="px-3 py-1 bg-gray-500 text-white rounded text-sm hover:bg-gray-600"
              >
                Copy Prompt
              </button>
            )}
          </div>

          {generatedPrompt && (
            <div className="bg-slate-700 p-3 rounded border border-slate-600">
              <h4 className="font-medium mb-2 text-slate-200">Generated Prompt:</h4>
              <pre className="text-sm whitespace-pre-wrap break-words bg-slate-800 p-2 rounded border border-slate-600 text-slate-300 max-h-96 overflow-y-auto">
                {generatedPrompt}
              </pre>
            </div>
          )}
        </div>

        {/* Last Generation Results */}
        {lastGenerationResult && (
          <div className="bg-slate-700 p-3 rounded border border-slate-600">
            <h4 className="font-medium mb-2 text-slate-200">Last Generation Results:</h4>
            <div className="space-y-3">
              
              {/* Tone Information */}
              {lastGenerationResult.tone && (
                <div className="text-sm space-y-1 text-slate-300">
                  <div><strong>Generated with Tone:</strong> <span className="font-mono bg-slate-800 px-2 py-1 rounded">{lastGenerationResult.tone}</span></div>
                  <div><strong>Would use CSS:</strong> <span className="font-mono bg-slate-800 px-2 py-1 rounded">{getEndingCSSClass(lastGenerationResult.tone as EndingTone)}</span></div>
                  
                  {/* Tone Match Check */}
                  {currentEnding && currentEnding.tone !== lastGenerationResult.tone && (
                    <div className="bg-red-900 bg-opacity-30 p-2 rounded border border-red-700">
                      <div className="text-red-300 text-xs">
                        ⚠️ <strong>Tone Mismatch!</strong> Current ending tone ({currentEnding.tone}) doesn&apos;t match last generation ({lastGenerationResult.tone})
                      </div>
                    </div>
                  )}
                  
                  {currentEnding && currentEnding.tone === lastGenerationResult.tone && (
                    <div className="bg-green-900 bg-opacity-30 p-2 rounded border border-green-700">
                      <div className="text-green-300 text-xs">
                        ✅ Tone matches current ending
                      </div>
                    </div>
                  )}
                </div>
              )}
              
              {/* API Response Details */}
              <div className="text-xs text-slate-400 space-y-1">
                <div><strong>AI Generated:</strong> {lastGenerationResult.aiGenerated ? 'Yes' : 'No (fallback used)'}</div>
                <div><strong>Service:</strong> {lastGenerationResult.service || 'Unknown'}</div>
                <div><strong>Placeholder:</strong> {lastGenerationResult.placeholder ? 'Yes' : 'No'}</div>
              </div>
              
              {/* Generated Image */}
              {lastGeneratedImage && (
                <div>
                  <div className="text-sm font-medium text-slate-200 mb-2">Generated Image:</div>
                  <div className="relative w-64 h-48">
                    <Image
                      src={lastGeneratedImage}
                      alt="Generated ending scene"
                      fill
                      className="rounded border border-slate-500 object-cover"
                      unoptimized // For base64 data URLs
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Prompt Building Tips */}
        <div className="bg-blue-900 bg-opacity-30 p-3 rounded text-sm border border-blue-700">
          <h4 className="font-medium mb-2 text-blue-300">💡 Ending Image Prompt Tips:</h4>
          <ul className="list-disc list-inside space-y-1 text-slate-300">
            <li>Tone determines visual mood and color palette</li>
            <li>World theme affects art style and setting elements</li>
            <li>Epilogue content influences scene composition</li>
            <li>Character legacy adds emotional context</li>
            <li>Recent narrative provides story-specific details</li>
            <li>Achievements can influence symbolic elements</li>
          </ul>
        </div>

        {/* API Debug Info */}
        <div className="bg-yellow-900 bg-opacity-30 p-3 rounded text-sm border border-yellow-700">
          <h4 className="font-medium mb-2 text-yellow-300">🔧 API Debug Info:</h4>
          <div className="space-y-1 text-slate-300">
            <div><strong>Endpoint:</strong> /api/generate-ending-image</div>
            <div><strong>Model:</strong> gemini-2.0-flash-preview-image-generation</div>
            <div><strong>Security:</strong> ✅ Server-side API key (secure)</div>
            <div><strong>Fallback:</strong> Themed placeholder images if AI fails</div>
          </div>
        </div>
      </div>
    </CollapsibleSection>
  );
}