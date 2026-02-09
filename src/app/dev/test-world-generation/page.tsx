'use client';

import { useState } from 'react';
import { generateWorld } from '@/lib/generators/worldGenerator';
import type { GeneratedWorldData } from '@/lib/generators/worldGenerator';

export default function TestWorldGeneration() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedWorld, setGeneratedWorld] = useState<GeneratedWorldData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const testCases = [
    { reference: 'The Office', relationship: 'set_within' as const, expectedGenre: 'modern' },
    { reference: 'Star Wars', relationship: 'set_within' as const, expectedGenre: 'Sci-Fi' },
    { reference: 'Lord of the Rings', relationship: 'set_within' as const, expectedGenre: 'Fantasy' },
    { reference: 'Breaking Bad', relationship: 'set_within' as const, expectedGenre: 'modern' },
    { reference: 'The Walking Dead', relationship: 'set_within' as const, expectedGenre: 'Post-Apocalyptic' },
  ];

  const runTest = async (testCase: typeof testCases[0]) => {
    setIsGenerating(true);
    setError(null);
    setGeneratedWorld(null);

    try {
      const result = await generateWorld({
        method: 'ai',
        reference: testCase.reference,
        relationship: testCase.relationship,
        existingNames: []
      });

      setGeneratedWorld(result);

      // Check if genre matches expected
      if (result.genre !== testCase.expectedGenre) {
        setError(`Expected genre &quot;${testCase.expectedGenre}&quot; but got &quot;${result.genre}&quot;`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div >
      <h1 >World Generation Genre Test</h1>
      
      <div >
        <p >
          Test that worlds set within non-fantasy universes don&apos;t get fantasy genres or elements.
        </p>
      </div>

      <div >
        {testCases.map((testCase) => (
          <div key={testCase.reference} >
            <button
              onClick={() => runTest(testCase)}
              disabled={isGenerating}
              
            >
              Test &quot;{testCase.reference}&quot;
            </button>
            <span >
              Expected genre: {testCase.expectedGenre}
            </span>
          </div>
        ))}
      </div>

      {isGenerating && (
        <div >
          <p >Generating world...</p>
        </div>
      )}

      {error && (
        <div >
          <p >Error:</p>
          <p >{error}</p>
        </div>
      )}

      {generatedWorld && (
        <div >
          <h2 >Generated World</h2>
          
          <div >
            <div>
              <span >Name:</span> {generatedWorld.name}
            </div>
            <div>
              <span >Genre:</span> {generatedWorld.genre}
              {generatedWorld.genre === 'Fantasy' && !generatedWorld.name.includes('Lord') && (
                <span >(❌ Should not be Fantasy!)</span>
              )}
            </div>
            <div>
              <span >Description:</span> {generatedWorld.description}
            </div>
          </div>

          <div >
            <h3 >Attributes ({generatedWorld.attributes.length}):</h3>
            <ul >
              {generatedWorld.attributes.map((attr, i) => (
                <li key={i}>
                  <span >{attr.name}:</span> {attr.description}
                  {attr.name.match(/magic|mana|arcane/i) && (
                    <span >(❌ Fantasy element!)</span>
                  )}
                </li>
              ))}
            </ul>
          </div>

          <div >
            <h3 >Skills ({generatedWorld.skills.length}):</h3>
            <ul >
              {generatedWorld.skills.map((skill, i) => (
                <li key={i}>
                  <span >{skill.name}:</span> {skill.description}
                  {skill.name.match(/magic|spell|sorcery|enchant/i) && (
                    <span >(❌ Fantasy element!)</span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
