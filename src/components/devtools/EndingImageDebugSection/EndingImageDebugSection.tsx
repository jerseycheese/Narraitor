// src/components/devtools/EndingImageDebugSection/EndingImageDebugSection.tsx

import React, { useState } from 'react';
import Image from 'next/image';
import { CollapsibleSection } from '@/components/ui/CollapsibleSection';
import { useNarrativeStore } from '@/state/narrativeStore';
import { useCharacterStore, type Character } from '@/state/characterStore';
import { useWorldStore } from '@/state/worldStore';
import type { StoryEnding, EndingTone, EndingType } from '@/types/narrative.types';
import { capitalize, getTimestamp } from '@/lib/utils';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { generateEndingImage, generateEndingImagePrompt } from '@/lib/api/endingImageApi';
import Logger from '@/lib/utils/logger';

const logger = new Logger('EndingImageDebug');

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
  const characters = useCharacterStore(state => state.characters);
  const worlds = useWorldStore((state) => state.worlds);
  
  const toneOptions: EndingTone[] = ['triumphant', 'mysterious', 'tragic', 'hopeful'];
  
  // Create a mock ending for testing
  const createMockEnding = (): StoryEnding => {
    const mockCharacter = (Object.values(characters) as Character[])[0];
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
      createdAt: getTimestamp(),
      updatedAt: getTimestamp(),
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
      const character = characters[mockEnding.characterId] || (Object.values(characters) as Character[])[0];
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
      
      const params = {
        ending: mockEnding,
        world,
        characterName: character?.name,
        recentNarrative
      };

      logger.debug('Calling ending image API with data:', params);

      const result = await generateEndingImagePrompt(params);
      logger.debug('API response result:', result);

      setGeneratedPrompt(result.prompt || result.imageGenerationPrompt || 'No prompt returned');
      setLastGenerationResult(result);

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
      const character = characters[mockEnding.characterId] || (Object.values(characters) as Character[])[0];
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
      
      const params = {
        ending: mockEnding,
        world,
        characterName: character?.name,
        recentNarrative
      };

      logger.debug('Generating full ending image with data:', params);

      const result = await generateEndingImage(params);

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
    return `ending-${tone}`;
  };

  // Tone backgrounds come from the live theme (--ending-* in the ds* theme
  // files) so the preview matches what EndingScreen actually renders under
  // the active data-theme. Muted-text token as the unknown-tone fallback.
  const getToneBackgroundColor = (tone: EndingTone) =>
    `var(--ending-${tone}, var(--color-text-muted))`;

  const currentCharacter = currentEnding ? characters[currentEnding.characterId] : (Object.values(characters) as Character[])[0];
  const currentWorld = currentEnding ? worlds[currentEnding.worldId] : Object.values(worlds)[0];

  return (
    <CollapsibleSection title="Ending Image Generation Debug" initialCollapsed={true}>
      <div>
        
        {/* Current Ending Info */}
        {currentEnding ? (
          <div>
            <h4>Active Ending Available</h4>
            <div>
              <div><strong>Tone:</strong> {currentEnding.tone}</div>
              <div><strong>Type:</strong> {currentEnding.type}</div>
              <div><strong>Character:</strong> {currentCharacter?.name || 'Unknown'}</div>
              <div><strong>World:</strong> {currentWorld?.name || 'Unknown'} ({currentWorld?.genre || 'No genre'})</div>
            </div>
          </div>
        ) : (
          <div>
            <h4>No Active Ending</h4>
            <p>Using mock data for testing. Generate an actual ending to see real prompts.</p>
          </div>
        )}

        {/* Tone & CSS Class Inspection */}
        {currentEnding && (
          <div>
            <h4>AI-Selected Tone & CSS Inspection</h4>
            <div>
              <div>
                <div><strong>AI Selected Tone:</strong> <span>{currentEnding.tone}</span></div>
                <div><strong>CSS Class Applied:</strong> <span>{getEndingCSSClass(currentEnding.tone)}</span></div>
              </div>
              
              {/* Visual Preview */}
              <div>
                <div>EndingScreen Preview:</div>
                <div 
                  className={getEndingCSSClass(currentEnding.tone)}
                  style={{ backgroundColor: getToneBackgroundColor(currentEnding.tone) }}
                >
                  <div>The End</div>
                  <div>{currentCharacter?.name} • {currentWorld?.name}</div>
                </div>
              </div>
              
              {/* Tone Color Reference */}
              <div>
                <div><strong>Background Color:</strong> {getToneBackgroundColor(currentEnding.tone)}</div>
                <div><strong>Expected in CSS:</strong> .ending-{currentEnding.tone}</div>
              </div>
            </div>
          </div>
        )}

        {/* Mock Ending Configuration */}
        {!currentEnding && (
          <div>
            <h4>Mock Ending Configuration</h4>
            
            <div>
              <div>
                <label>Ending Tone:</label>
                <Select 
                  value={selectedTone} 
                  onChange={(e) => setSelectedTone(e.target.value as EndingTone)}
                  
                >
                  {toneOptions.map((tone) => (
                    <option key={tone} value={tone}>
                      {capitalize(tone)}
                    </option>
                  ))}
                </Select>
              </div>
              
              <div>
                <label>Custom Epilogue (optional):</label>
                <Textarea
                  value={customEpilogue}
                  onChange={(e) => setCustomEpilogue(e.target.value)}
                  placeholder="Leave empty to use default mock epilogue..."
                  
                  rows={3}
                />
              </div>
              
              <div>
                <label>Custom Character Legacy (optional):</label>
                <Textarea
                  value={customLegacy}
                  onChange={(e) => setCustomLegacy(e.target.value)}
                  placeholder="Leave empty to use default mock legacy..."
                  
                  rows={2}
                />
              </div>
              
              <div>
                <label>Custom World Impact (optional):</label>
                <Textarea
                  value={customWorldImpact}
                  onChange={(e) => setCustomWorldImpact(e.target.value)}
                  placeholder="Leave empty to use default mock world impact..."
                  
                  rows={2}
                />
              </div>
            </div>
          </div>
        )}

        {/* Data Summary */}
        <div>
          <h4>Data Summary</h4>
          <div>
            <div><strong>Character:</strong> {currentCharacter?.name || 'No characters available'}</div>
            <div><strong>World:</strong> {currentWorld?.name || 'No worlds available'} ({currentWorld?.genre || 'No genre'})</div>
            <div><strong>Available Characters:</strong> {Object.keys(characters).length}</div>
            <div><strong>Available Worlds:</strong> {Object.keys(worlds).length}</div>
          </div>
        </div>

        {/* Prompt Generation */}
        <div>
          <div>
            <Button
              onClick={generatePromptPreview}
              
              size="sm"
              variant="default"
              disabled={isGenerating}
            >
              {isGenerating ? 'Generating...' : 'Generate Prompt Preview'}
            </Button>
            <Button
              onClick={testFullGeneration}
              
              size="sm"
              variant="success"
              disabled={isGenerating}
            >
              {isGenerating ? 'Generating...' : 'Test Full Generation'}
            </Button>
            {generatedPrompt && (
              <Button
                onClick={copyPromptToClipboard}
                
                size="sm"
                variant="secondary"
              >
                Copy Prompt
              </Button>
            )}
          </div>

          {generatedPrompt && (
            <div>
              <h4>Generated Prompt:</h4>
              <pre>
                {generatedPrompt}
              </pre>
            </div>
          )}
        </div>

        {/* Last Generation Results */}
        {lastGenerationResult && (
          <div>
            <h4>Last Generation Results:</h4>
            <div>
              
              {/* Tone Information */}
              {lastGenerationResult.tone && (
                <div>
                  <div><strong>Generated with Tone:</strong> <span>{lastGenerationResult.tone}</span></div>
                  <div><strong>Would use CSS:</strong> <span>{getEndingCSSClass(lastGenerationResult.tone as EndingTone)}</span></div>
                  
                  {/* Tone Match Check */}
                  {currentEnding && currentEnding.tone !== lastGenerationResult.tone && (
                    <div>
                      <div>
                        <strong>Warning: Tone Mismatch!</strong> Current ending tone ({currentEnding.tone}) doesn&apos;t match last generation ({lastGenerationResult.tone})
                      </div>
                    </div>
                  )}
                  
                  {currentEnding && currentEnding.tone === lastGenerationResult.tone && (
                    <div>
                      <div>
                        Tone matches current ending
                      </div>
                    </div>
                  )}
                </div>
              )}
              
              {/* API Response Details */}
              <div>
                <div><strong>AI Generated:</strong> {lastGenerationResult.aiGenerated ? 'Yes' : 'No (fallback used)'}</div>
                <div><strong>Service:</strong> {lastGenerationResult.service || 'Unknown'}</div>
                <div><strong>Placeholder:</strong> {lastGenerationResult.placeholder ? 'Yes' : 'No'}</div>
              </div>
              
              {/* Generated Image */}
              {lastGeneratedImage && (
                <div>
                  <div>Generated Image:</div>
                  <div>
                    <Image
                      src={lastGeneratedImage}
                      alt="Generated ending scene"
                      fill
                      
                      unoptimized // For base64 data URLs
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Prompt Building Tips */}
        <div>
          <h4>Ending Image Prompt Tips:</h4>
          <ul>
            <li>Tone determines visual mood and color palette</li>
            <li>World theme affects art style and setting elements</li>
            <li>Epilogue content influences scene composition</li>
            <li>Character legacy adds emotional context</li>
            <li>Recent narrative provides story-specific details</li>
            <li>Achievements can influence symbolic elements</li>
          </ul>
        </div>

        {/* API Debug Info */}
        <div>
          <h4>API Debug Info:</h4>
          <div>
            <div><strong>Endpoint:</strong> /api/generate-ending-image</div>
            <div><strong>Model:</strong> gemini-2.0-flash-preview-image-generation</div>
            <div><strong>Security:</strong> Server-side API key (secure)</div>
            <div><strong>Fallback:</strong> Themed placeholder images if AI fails</div>
          </div>
        </div>
      </div>
    </CollapsibleSection>
  );
}
