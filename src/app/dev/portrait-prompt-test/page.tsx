// src/app/dev/portrait-prompt-test/page.tsx

'use client';

import React, { useState } from 'react';
import { PortraitGenerator } from '@/lib/ai/portraitGenerator';
import { createAIClient } from '@/lib/ai';
import { Character } from '@/types/character.types';

export default function PortraitPromptTestPage() {
  const [characterName, setCharacterName] = useState('Bob Wiley');
  const [personality, setPersonality] = useState('Neurotic but lovable patient with multiple phobias and an endearing personality');
  const [physicalDescription, setPhysicalDescription] = useState('Middle-aged man with messy hair, anxious expression, wearing casual vacation clothes');
  const [history, setHistory] = useState('A psychiatric patient who follows his therapist on vacation');
  const [worldTheme, setWorldTheme] = useState('comedy');
  const [generatedPrompt, setGeneratedPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [detectedInfo, setDetectedInfo] = useState<{
    isKnownFigure: boolean;
    figureType?: string;
    actorName?: string;
    figureName?: string;
    detectedCharacterName?: string;
  } | null>(null);

  const generateTestPrompt = async () => {
    setIsGenerating(true);
    setError(null);
    setGeneratedImage(null);
    
    try {
      const aiClient = createAIClient();
      const generator = new PortraitGenerator(aiClient);
      
      const testCharacter: Character = {
        id: 'test',
        name: characterName,
        description: '',
        worldId: 'test-world',
        attributes: [],
        skills: [],
        background: {
          history,
          personality,
          physicalDescription,
          goals: [],
          fears: [],
          relationships: []
        },
        inventory: { items: [], capacity: 100, categories: [], characterId: 'test' },
        status: { health: 100, maxHealth: 100, conditions: [] },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Generate the portrait which includes detection and prompt generation
      const result = await generator.generatePortrait(testCharacter, {
        worldTheme
      });
      
      // The actual prompt used is returned in the result
      setGeneratedPrompt(result.prompt || 'No prompt returned');
      setGeneratedImage(result.url);
      
      // Get detection info from the portrait generator's detection results
      // This will be more accurate than parsing the prompt
      interface DetectionResult {
        isKnownFigure: boolean;
        figureType?: string;
        actorName?: string;
        figureName?: string;
      }
      
      const storedDetection = typeof window !== 'undefined' 
        ? (window as Window & { lastDetectionResult?: DetectionResult }).lastDetectionResult 
        : null;
      if (storedDetection) {
        setDetectedInfo({
          isKnownFigure: storedDetection.isKnownFigure,
          figureType: storedDetection.figureType,
          actorName: storedDetection.actorName,
          figureName: storedDetection.figureName,
          detectedCharacterName: characterName
        });
      } else {
        // Fallback: parse the prompt to detect info
        const actualPrompt = result.prompt || '';
        if (actualPrompt.includes('Cinematic portrait of') && actualPrompt.includes(' as ')) {
          const actorMatch = actualPrompt.match(/([A-Z][a-z]+ [A-Z][a-z]+) as (.+?),/);
          setDetectedInfo({
            isKnownFigure: true,
            figureType: 'fictional',
            actorName: actorMatch ? actorMatch[1] : undefined
          });
        } else if (actualPrompt.includes('Photorealistic portrait of') || actualPrompt.includes('Professional portrait photograph of')) {
          setDetectedInfo({
            isKnownFigure: true,
            figureType: actualPrompt.includes('comedian') ? 'comedian' : 
                         actualPrompt.includes('musician') ? 'musician' : 
                         actualPrompt.includes('politician') ? 'politician' : 'celebrity'
          });
        } else {
          setDetectedInfo({
            isKnownFigure: false
          });
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setError(errorMessage);
      setGeneratedPrompt(`Error: ${errorMessage}`);
    } finally {
      setIsGenerating(false);
    }
  };

  // Example presets
  const applyPreset = (preset: string) => {
    switch (preset) {
      case 'bob-wiley':
        setCharacterName('Bob Wiley');
        setPhysicalDescription('Middle-aged man with messy hair, anxious expression, wearing casual vacation clothes');
        setPersonality('Neurotic but lovable patient with multiple phobias and an endearing personality');
        setHistory('A psychiatric patient who follows his therapist on vacation');
        setWorldTheme('comedy');
        break;
      case 'judy-gemstone':
        setCharacterName('Judy Gemstone');
        setPhysicalDescription('Southern belle with big blonde hair, heavy makeup, wearing designer clothes and jewelry');
        setPersonality('Rebellious preacher\'s daughter with a wild streak and sharp tongue');
        setHistory('Member of the Gemstone family from The Righteous Gemstones TV series');
        setWorldTheme('dark comedy');
        break;
      case 'sloth':
        setCharacterName('Sloth');
        setPhysicalDescription('Large deformed man with severely misshapen face, one eye higher than the other, bald head, missing teeth, wearing Superman t-shirt');
        setPersonality('Gentle giant with childlike innocence who loves candy and making friends');
        setHistory('Character from The Goonies movie who helps the kids escape from the Fratelli crime family');
        setWorldTheme('adventure');
        break;
      case 'nathan-fielder':
        setCharacterName('Nathan Fielder');
        setPhysicalDescription('Awkward man with deadpan expression, wearing business casual attire');
        setPersonality('Socially awkward business consultant with unconventional ideas');
        setHistory('Graduated from one of Canada\'s top business schools with really good grades');
        setWorldTheme('comedy documentary');
        break;
      case 'gizmo':
        setCharacterName('Gizmo');
        setPhysicalDescription('Small furry creature with large ears, big eyes, brown and white fur');
        setPersonality('Sweet, gentle mogwai who loves to sing and is afraid of bright lights');
        setHistory('A mogwai who must not be fed after midnight or get wet');
        setWorldTheme('horror comedy');
        break;
      case 'arthur-morgan':
        setCharacterName('Arthur Morgan');
        setPhysicalDescription('Rugged outlaw with stubble, wearing cowboy hat, leather vest, and gun holster');
        setPersonality('Tough but honorable outlaw with a complex moral code');
        setHistory('Senior member of the Van der Linde gang in the dying days of the Wild West');
        setWorldTheme('western');
        break;
      case 'ryan-howard':
        setCharacterName('Ryan Howard');
        setPhysicalDescription('Young ambitious office worker with styled hair and trendy business casual attire');
        setPersonality('Ambitious, self-centered, trendy, and opportunistic with a superiority complex');
        setHistory('Started as a temp at Dunder Mifflin but climbed the corporate ladder through manipulation');
        setWorldTheme('office comedy');
        break;
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Portrait Prompt Testing</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Input Controls */}
          <div className="space-y-4">
            <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
              <h2 className="text-xl font-semibold mb-4 text-white">Character Configuration</h2>
              
              {/* Presets */}
              <div className="mb-6">
                <label className="block text-sm font-medium mb-3 text-gray-300">Quick Presets:</label>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => applyPreset('bob-wiley')}
                    className="px-4 py-2 bg-blue-600 text-white rounded font-medium hover:bg-blue-700 transition-colors"
                  >
                    Bob Wiley
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPreset('judy-gemstone')}
                    className="px-4 py-2 bg-pink-600 text-white rounded font-medium hover:bg-pink-700 transition-colors"
                  >
                    Judy Gemstone
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPreset('sloth')}
                    className="px-4 py-2 bg-green-600 text-white rounded font-medium hover:bg-green-700 transition-colors"
                  >
                    Sloth
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPreset('nathan-fielder')}
                    className="px-4 py-2 bg-gray-600 text-white rounded font-medium hover:bg-gray-700 transition-colors"
                  >
                    Nathan Fielder
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPreset('gizmo')}
                    className="px-4 py-2 bg-purple-600 text-white rounded font-medium hover:bg-purple-700 transition-colors"
                  >
                    Gizmo
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPreset('arthur-morgan')}
                    className="px-4 py-2 bg-orange-600 text-white rounded font-medium hover:bg-orange-700 transition-colors"
                  >
                    Arthur Morgan
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPreset('ryan-howard')}
                    className="px-4 py-2 bg-red-600 text-white rounded font-medium hover:bg-red-700 transition-colors"
                  >
                    Ryan Howard
                  </button>
                </div>
              </div>
              
              {/* Character Name */}
              <div className="mb-4">
                <label htmlFor="character-name" className="block text-sm font-medium mb-2 text-gray-300">
                  Character Name:
                </label>
                <input
                  id="character-name"
                  type="text"
                  value={characterName}
                  onChange={(e) => setCharacterName(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              
              
              {/* Physical Description */}
              <div className="mb-4">
                <label htmlFor="physical-description" className="block text-sm font-medium mb-2 text-gray-300">
                  Physical Description:
                </label>
                <textarea
                  id="physical-description"
                  value={physicalDescription}
                  onChange={(e) => setPhysicalDescription(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="Describe the character's appearance"
                />
              </div>
              
              {/* Personality */}
              <div className="mb-4">
                <label htmlFor="personality" className="block text-sm font-medium mb-2 text-gray-300">
                  Personality:
                </label>
                <textarea
                  id="personality"
                  value={personality}
                  onChange={(e) => setPersonality(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              
              {/* History */}
              <div className="mb-4">
                <label htmlFor="history" className="block text-sm font-medium mb-2 text-gray-300">
                  History:
                </label>
                <textarea
                  id="history"
                  value={history}
                  onChange={(e) => setHistory(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              
              {/* World Theme */}
              <div className="mb-4">
                <label htmlFor="world-theme" className="block text-sm font-medium mb-2 text-gray-300">
                  World Theme:
                </label>
                <input
                  id="world-theme"
                  type="text"
                    value={worldTheme}
                    onChange={(e) => setWorldTheme(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="e.g., fantasy, cyberpunk, medieval"
                  />
              </div>
              
              <button
                type="button"
                onClick={generateTestPrompt}
                disabled={isGenerating}
                className="w-full px-4 py-3 bg-blue-600 text-white rounded font-medium hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isGenerating ? 'Generating...' : 'Generate Portrait'}
              </button>
            </div>
          </div>
          
          {/* Output Display */}
          <div className="space-y-4">
            {/* Generated Image Display - Moved to top */}
            {(generatedImage || error) && (
              <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
                <h2 className="text-xl font-semibold mb-4 text-white">Generated Portrait</h2>
                
                {error ? (
                  <div className="bg-red-900/20 border border-red-600/50 rounded p-4">
                    <p className="text-red-400">{error}</p>
                  </div>
                ) : generatedImage ? (
                  <div className="space-y-4">
                    <div className="relative aspect-square w-full max-w-md mx-auto bg-gray-900 rounded-lg overflow-hidden">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={generatedImage}
                        alt="Generated portrait"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="text-center">
                      <a
                        href={generatedImage}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors"
                      >
                        Open in new tab
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </a>
                    </div>
                  </div>
                ) : null}
              </div>
            )}
            
            {generatedPrompt && (
              <>
                <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
                  <h2 className="text-xl font-semibold mb-4 text-white">Generated Prompt</h2>
                  <pre className="whitespace-pre-wrap break-words bg-gray-900 p-4 rounded text-sm text-gray-200 border border-gray-700">
                    {generatedPrompt}
                  </pre>
                  <div className="mt-4 flex items-center gap-4">
                    <button
                      type="button"
                      onClick={() => navigator.clipboard.writeText(generatedPrompt)}
                      className="px-4 py-2 bg-gray-600 text-white rounded font-medium hover:bg-gray-700 transition-colors"
                    >
                      Copy Prompt
                    </button>
                    <span className="text-sm text-gray-400">
                      Length: {generatedPrompt.length} characters
                    </span>
                  </div>
                </div>
                
                {/* Prompt Analysis */}
                <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
                  <h2 className="text-xl font-semibold mb-4 text-white">Prompt Analysis</h2>
                  <div className="space-y-3 text-sm">
                    <div className="bg-blue-900/30 border border-blue-600/50 rounded p-3">
                      <p className="text-blue-300">
                        <strong>Note:</strong> The AI will automatically detect if the character name is a known figure 
                        and adjust the portrait style accordingly (photorealistic for real people, fantasy art for original characters).
                      </p>
                    </div>
                    
                    {/* Detection Results */}
                    {detectedInfo && (
                      <div className="bg-gray-900 rounded p-3 space-y-2">
                        <div className="flex justify-between">
                          <span className="text-gray-400">Known Figure:</span>
                          <span className={`font-medium ${detectedInfo.isKnownFigure ? 'text-green-400' : 'text-gray-400'}`}>
                            {detectedInfo.isKnownFigure ? 'Yes' : 'No'}
                          </span>
                        </div>
                        {detectedInfo.figureType && (
                          <div className="flex justify-between">
                            <span className="text-gray-400">Figure Type:</span>
                            <span className="text-gray-200 font-medium capitalize">
                              {detectedInfo.figureType}
                            </span>
                          </div>
                        )}
                        {detectedInfo.isKnownFigure && !detectedInfo.actorName && !detectedInfo.figureName && detectedInfo.detectedCharacterName && (
                          <div className="flex justify-between">
                            <span className="text-gray-400">Detected Person:</span>
                            <span className="text-green-400 font-medium">
                              {detectedInfo.detectedCharacterName}
                            </span>
                          </div>
                        )}
                        {detectedInfo.figureName && (
                          <div className="flex justify-between">
                            <span className="text-gray-400">Source Media:</span>
                            <span className="text-yellow-400 font-medium">
                              {detectedInfo.figureName}
                            </span>
                          </div>
                        )}
                        {detectedInfo.actorName && (
                          <div className="flex justify-between">
                            <span className="text-gray-400">Actor Detected:</span>
                            <span className="text-blue-400 font-medium">
                              {detectedInfo.actorName}
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                    
                    <div className="flex justify-between">
                      <span className="text-gray-400">Components:</span>
                      <span className="text-gray-200 font-medium">
                        {generatedPrompt.split(',').length} parts
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Prompt Length:</span>
                      <span className="text-gray-200 font-medium">
                        {generatedPrompt.length} characters
                      </span>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}