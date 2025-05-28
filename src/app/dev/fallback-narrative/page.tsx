'use client';

import { useState } from 'react';
import { NarrativeDisplay } from '@/components/Narrative/NarrativeDisplay';
import { FallbackContentManager } from '@/lib/narrative/fallback/FallbackContentManager';
import { NarrativeSegment, NarrativeContext } from '@/types/narrative.types';
import { World } from '@/types/world.types';

export default function FallbackNarrativeTestPage() {
  const [currentSegment, setCurrentSegment] = useState<NarrativeSegment | null>(null);
  const [isAIGenerated, setIsAIGenerated] = useState(true);
  const [fallbackReason, setFallbackReason] = useState<'service_unavailable' | 'timeout' | 'error' | 'rate_limit'>('service_unavailable');
  const [worldTheme, setWorldTheme] = useState('fantasy');
  const [segmentType, setSegmentType] = useState('scene');
  const [contextTags, setContextTags] = useState<string[]>(['forest']);

  const fallbackManager = new FallbackContentManager();

  const mockWorld: World = {
    id: 'test-world',
    name: 'Test World',
    description: 'A world for testing fallback content',
    theme: worldTheme,
    attributes: [],
    skills: [],
    settings: {
      maxAttributes: 10,
      maxSkills: 10,
      attributePointPool: 30,
      skillPointPool: 30
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  const mockContext: NarrativeContext = {
    worldId: 'test-world',
    currentSceneId: 'test-scene',
    characterIds: ['test-char'],
    previousSegments: [],
    currentTags: contextTags,
    sessionId: 'test-session'
  };

  const generateFallbackContent = () => {
    const content = fallbackManager.getContent(segmentType, mockContext, mockWorld);
    
    if (content) {
      const segment: NarrativeSegment = {
        id: 'test-segment-' + Date.now(),
        worldId: mockWorld.id,
        sessionId: 'test-session',
        content: content.content,
        type: content.type as 'scene' | 'dialogue' | 'action' | 'transition',
        metadata: {
          tags: content.tags,
          characterIds: ['test-char']
        },
        timestamp: new Date(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      setCurrentSegment(segment);
      setIsAIGenerated(false);
    } else {
      alert('No fallback content available for these parameters');
    }
  };

  const simulateAIContent = () => {
    const segment: NarrativeSegment = {
      id: 'ai-segment-' + Date.now(),
      worldId: mockWorld.id,
      sessionId: 'test-session',
      content: 'This is simulated AI-generated content. In a real scenario, this would come from the AI service and be much more detailed and contextual.',
      type: segmentType as 'scene' | 'dialogue' | 'action' | 'transition',
      metadata: {
        tags: contextTags,
        characterIds: ['test-char']
      },
      timestamp: new Date(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    setCurrentSegment(segment);
    setIsAIGenerated(true);
  };

  const clearContent = () => {
    setCurrentSegment(null);
    fallbackManager.clearUsageHistory();
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Fallback Narrative Test Harness</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Controls */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Configuration</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">World Theme</label>
                <select 
                  value={worldTheme} 
                  onChange={(e) => setWorldTheme(e.target.value)}
                  className="w-full p-2 border rounded"
                >
                  <option value="fantasy">Fantasy</option>
                  <option value="scifi">Sci-Fi</option>
                  <option value="western">Western</option>
                  <option value="sitcom">Sitcom</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Segment Type</label>
                <select 
                  value={segmentType} 
                  onChange={(e) => setSegmentType(e.target.value)}
                  className="w-full p-2 border rounded"
                >
                  <option value="initial">Initial Scene</option>
                  <option value="scene">Scene</option>
                  <option value="transition">Transition</option>
                  <option value="choice">Choice</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Context Tags</label>
                <div className="flex flex-wrap gap-2">
                  {['forest', 'city', 'combat', 'night', 'day', 'tavern', 'peaceful'].map(tag => (
                    <label key={tag} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={contextTags.includes(tag)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setContextTags([...contextTags, tag]);
                          } else {
                            setContextTags(contextTags.filter(t => t !== tag));
                          }
                        }}
                        className="mr-1"
                      />
                      <span className="text-sm">{tag}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Fallback Reason</label>
                <select 
                  value={fallbackReason} 
                  onChange={(e) => setFallbackReason(e.target.value as 'service_unavailable' | 'timeout' | 'error' | 'rate_limit')}
                  className="w-full p-2 border rounded"
                >
                  <option value="service_unavailable">Service Unavailable</option>
                  <option value="timeout">Timeout</option>
                  <option value="error">Error</option>
                  <option value="rate_limit">Rate Limit</option>
                </select>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Actions</h2>
            <div className="space-y-2">
              <button
                onClick={generateFallbackContent}
                className="w-full px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600"
              >
                Generate Fallback Content
              </button>
              <button
                onClick={simulateAIContent}
                className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Simulate AI Content
              </button>
              <button
                onClick={clearContent}
                className="w-full px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
              >
                Clear Content
              </button>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Statistics</h2>
            <div className="space-y-2 text-sm">
              <div>
                <span className="font-medium">Available Content:</span> {
                  fallbackManager.getContentCount(worldTheme, segmentType)
                } items
              </div>
              <div>
                <span className="font-medium">Theme Supported:</span> {
                  fallbackManager.hasContent(worldTheme) ? 'Yes' : 'No'
                }
              </div>
            </div>
          </div>
        </div>

        {/* Display */}
        <div className="space-y-6">
          <div className="bg-gray-50 p-6 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">Narrative Output</h2>
            <NarrativeDisplay
              segment={currentSegment}
              isAIGenerated={isAIGenerated}
              fallbackReason={fallbackReason}
            />
          </div>

          {currentSegment && (
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold mb-2">Debug Info</h3>
              <pre className="text-xs overflow-auto bg-gray-100 p-3 rounded">
                {JSON.stringify({
                  isAIGenerated,
                  fallbackReason: !isAIGenerated ? fallbackReason : null,
                  segmentType: currentSegment.type,
                  tags: currentSegment.metadata.tags,
                  contentLength: currentSegment.content.length
                }, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}