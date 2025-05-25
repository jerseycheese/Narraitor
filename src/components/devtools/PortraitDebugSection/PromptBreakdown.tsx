// src/components/devtools/PortraitDebugSection/PromptBreakdown.tsx

import React from 'react';
import { Character } from '../../../types/character.types';
import { World } from '../../../types/world.types';

interface PromptBreakdownProps {
  characterData: Partial<Character> | null | undefined;
  worldConfig: Partial<World> | null | undefined;
  prompt: string;
}

export function PromptBreakdown({ characterData, worldConfig, prompt }: PromptBreakdownProps) {
  // Analyze the prompt construction logic
  // Note: Known figure detection is now automatic based on the character name
  // The AI will determine if it's a known figure and adjust the style accordingly
  
  // Try to determine the prompt type based on its content
  const isPhotorealisticPrompt = prompt.includes('portrait photograph') || prompt.includes('photorealistic');
  const isFantasyPrompt = prompt.includes('fantasy portrait') || prompt.includes('digital painting');
  
  // Extract personality traits logic
  const extractKeyTraits = (personality: string): string => {
    if (!personality) return '';
    const words = personality.toLowerCase().split(/\s+/);
    const descriptiveWords = words.filter(word => 
      word.length > 3 && 
      !['with', 'and', 'the', 'very', 'quite', 'rather'].includes(word)
    ).slice(0, 3);
    
    return descriptiveWords.length > 0 ? descriptiveWords.join(' ') + ' character' : '';
  };
  
  // Extract profession from history
  const extractProfession = (history: string): string | null => {
    if (!history) return null;
    const professionMatch = history.match(
      /\b(warrior|mage|wizard|rogue|thief|cleric|priest|ranger|bard|druid|paladin|sorcerer|fighter|monk)\b/i
    );
    return professionMatch ? professionMatch[0].toLowerCase() : null;
  };
  
  
  const personalityTraits = extractKeyTraits(characterData?.background?.personality || '');
  const profession = extractProfession(characterData?.background?.history || '');
  const physicalDescription = characterData?.background?.physicalDescription || '';
  
  // Break down the prompt into its components
  const promptParts = prompt.split(', ');
  
  return (
    <div className="space-y-4">
      {/* Logic Flow Diagram */}
      <div className="bg-slate-800 p-4 rounded border border-slate-700">
        <h4 className="font-medium mb-3 text-slate-200">Prompt Construction Logic Flow</h4>
        
        <div className="space-y-3 text-sm">
          {/* Decision Tree */}
          <div className="border-l-2 border-blue-500 pl-4">
            <div className="font-medium text-blue-400">1. Automatic Character Detection</div>
            <div className="text-slate-300 ml-4">
              <div className="text-slate-400">AI analyzes &quot;{characterData?.name || 'Unknown'}&quot;</div>
              {isPhotorealisticPrompt ? (
                <div className="ml-4 text-green-400">→ Detected as known figure (photorealistic approach)</div>
              ) : isFantasyPrompt ? (
                <div className="ml-4 text-purple-400">→ Detected as original character (fantasy art approach)</div>
              ) : (
                <div className="ml-4 text-gray-400">→ Detection pending...</div>
              )}
            </div>
          </div>
          
          <div className="border-l-2 border-green-500 pl-4">
            <div className="font-medium text-green-400">2. Opening Statement</div>
            <div className="text-slate-300 ml-4">
              {isPhotorealisticPrompt ? 
                '&quot;A portrait photograph of&quot;' : 
                '&quot;A fantasy portrait of&quot;'
              }
            </div>
          </div>
          
          <div className="border-l-2 border-yellow-500 pl-4">
            <div className="font-medium text-yellow-400">3. Subject Details</div>
            <div className="text-slate-300 ml-4">
              <div>Name: &quot;{characterData?.name || 'Unknown'}&quot;</div>
              {physicalDescription && (
                <div>Physical: &quot;{physicalDescription}&quot;</div>
              )}
              {isFantasyPrompt && personalityTraits && (
                <div>Traits: &quot;{personalityTraits}&quot;</div>
              )}
              {isFantasyPrompt && profession && (
                <div>Class: &quot;{profession} class&quot;</div>
              )}
            </div>
          </div>
          
          <div className="border-l-2 border-purple-500 pl-4">
            <div className="font-medium text-purple-400">4. Context/Background</div>
            <div className="text-slate-300 ml-4">
              {isPhotorealisticPrompt ? (
                <>
                  <div>• professional headshot</div>
                  <div>• studio lighting</div>
                </>
              ) : (
                <>
                  <div>• {worldConfig?.theme || 'mystical'} setting</div>
                  <div>• dramatic lighting</div>
                </>
              )}
            </div>
          </div>
          
          <div className="border-l-2 border-pink-500 pl-4">
            <div className="font-medium text-pink-400">5. Style Elements</div>
            <div className="text-slate-300 ml-4">
              {isPhotorealisticPrompt ? (
                <>
                  <div>• 85mm lens</div>
                  <div>• shallow depth of field</div>
                  <div>• photorealistic</div>
                  <div>• professional photography</div>
                </>
              ) : (
                <>
                  <div>• digital painting</div>
                  <div>• concept art style</div>
                  <div>• highly detailed</div>
                  <div>• artstation quality</div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Prompt Breakdown */}
      <div className="bg-slate-800 p-4 rounded border border-slate-700">
        <h4 className="font-medium mb-3 text-slate-200">Prompt Component Breakdown</h4>
        <div className="space-y-2">
          {promptParts.map((part, index) => {
            const trimmedPart = part.trim();
            let category = 'other';
            let color = 'text-slate-400';
            
            // Categorize each part
            if (index === 0) {
              category = 'opening';
              color = 'text-blue-400';
            } else if (trimmedPart === characterData?.name) {
              category = 'name';
              color = 'text-green-400';
            } else if (trimmedPart.includes('the ') && isPhotorealisticPrompt) {
              category = 'context';
              color = 'text-yellow-400';
            } else if (trimmedPart.includes('character') || trimmedPart.includes('class')) {
              category = 'description';
              color = 'text-orange-400';
            } else if (trimmedPart.includes('lighting') || trimmedPart.includes('headshot') || trimmedPart.includes('setting') || trimmedPart.includes('background')) {
              category = 'environment';
              color = 'text-purple-400';
            } else if (trimmedPart.includes('lens') || trimmedPart.includes('photorealistic') || trimmedPart.includes('painting') || trimmedPart.includes('style') || trimmedPart.includes('quality')) {
              category = 'style';
              color = 'text-pink-400';
            }
            
            return (
              <div key={index} className="flex items-center gap-2">
                <span className={`text-xs px-2 py-1 rounded ${color} bg-slate-900 font-mono`}>
                  {category}
                </span>
                <span className="text-slate-300">{trimmedPart}</span>
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Data Analysis */}
      <div className="bg-slate-800 p-4 rounded border border-slate-700">
        <h4 className="font-medium mb-3 text-slate-200">Input Data Analysis</h4>
        <div className="space-y-2 text-sm">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-slate-400">Character Name:</span>
              <span className="ml-2 text-slate-200">{characterData?.name || 'Not set'}</span>
            </div>
            <div>
              <span className="text-slate-400">Portrait Type:</span>
              <span className="ml-2 text-slate-200">
                {isPhotorealisticPrompt ? 'Photorealistic' : isFantasyPrompt ? 'Fantasy Art' : 'Auto-detected'}
              </span>
            </div>
            <div>
              <span className="text-slate-400">Physical Description:</span>
              <span className="ml-2 text-slate-200">{physicalDescription ? `${physicalDescription.length} chars` : 'None'}</span>
            </div>
            <div>
              <span className="text-slate-400">Personality Length:</span>
              <span className="ml-2 text-slate-200">{characterData?.background?.personality?.length || 0} chars</span>
            </div>
            <div>
              <span className="text-slate-400">Extracted Traits:</span>
              <span className="ml-2 text-slate-200">{personalityTraits || 'None'}</span>
            </div>
            <div>
              <span className="text-slate-400">History Contains Class:</span>
              <span className="ml-2 text-slate-200">{profession || 'No'}</span>
            </div>
            <div>
              <span className="text-slate-400">World Theme:</span>
              <span className="ml-2 text-slate-200">{worldConfig?.theme || 'Not set'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}