// src/components/devtools/PortraitDebugSection/PromptBreakdown.tsx

import React from 'react';
import { Character } from '@/types/character.types';
import { World } from '@/types/world.types';

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
  const promptParts = prompt.split(',');
  
  return (
    <div >
      {/* Logic Flow Diagram */}
      <div >
        <h4 >Prompt Construction Logic Flow</h4>
        
        <div >
          {/* Decision Tree */}
          <div >
            <div >1. Automatic Character Detection</div>
            <div >
              <div >AI analyzes &quot;{characterData?.name || 'Unknown'}&quot;</div>
              {isPhotorealisticPrompt ? (
                <div >→ Detected as known figure (photorealistic approach)</div>
              ) : isFantasyPrompt ? (
                <div >→ Detected as original character (fantasy art approach)</div>
              ) : (
                <div >→ Detection pending...</div>
              )}
            </div>
          </div>
          
          <div >
            <div >2. Opening Statement</div>
            <div >
              {isPhotorealisticPrompt ? 
                '&quot;A portrait photograph of&quot;' : 
                '&quot;A fantasy portrait of&quot;'
              }
            </div>
          </div>
          
          <div >
            <div >3. Subject Details</div>
            <div >
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
          
          <div >
            <div >4. Context/Background</div>
            <div >
              {isPhotorealisticPrompt ? (
                <>
                  <div>• professional headshot</div>
                  <div>• studio lighting</div>
                </>
              ) : (
                <>
                  <div>• {worldConfig?.genre || 'mystical'} setting</div>
                  <div>• dramatic lighting</div>
                </>
              )}
            </div>
          </div>
          
          <div >
            <div >5. Style Elements</div>
            <div >
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
      <div >
        <h4 >Prompt Component Breakdown</h4>
        <div >
          {promptParts.map((part, index) => {
            const trimmedPart = part.trim();
            let category = 'other';
            let color = '';
            
            // Categorize each part
            if (index === 0) {
              category = 'opening';
              color = '';
            } else if (trimmedPart === characterData?.name) {
              category = 'name';
              color = '';
            } else if (trimmedPart.includes('the') && isPhotorealisticPrompt) {
              category = 'context';
              color = '';
            } else if (trimmedPart.includes('character') || trimmedPart.includes('class')) {
              category = 'description';
              color = '';
            } else if (trimmedPart.includes('lighting') || trimmedPart.includes('headshot') || trimmedPart.includes('setting') || trimmedPart.includes('background')) {
              category = 'environment';
              color = '';
            } else if (trimmedPart.includes('lens') || trimmedPart.includes('photorealistic') || trimmedPart.includes('painting') || trimmedPart.includes('style') || trimmedPart.includes('quality')) {
              category = 'style';
              color = '';
            }
            
            return (
              <div key={index} >
                <span className={`${color}`}>
                  {category}
                </span>
                <span >{trimmedPart}</span>
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Data Analysis */}
      <div >
        <h4 >Input Data Analysis</h4>
        <div >
          <div >
            <div>
              <span >Character Name:</span>
              <span >{characterData?.name || 'Not set'}</span>
            </div>
            <div>
              <span >Portrait Type:</span>
              <span >
                {isPhotorealisticPrompt ? 'Photorealistic' : isFantasyPrompt ? 'Fantasy Art' : 'Auto-detected'}
              </span>
            </div>
            <div>
              <span >Physical Description:</span>
              <span >{physicalDescription ? `${physicalDescription.length}chars` : 'None'}</span>
            </div>
            <div>
              <span >Personality Length:</span>
              <span >{characterData?.background?.personality?.length || 0} chars</span>
            </div>
            <div>
              <span >Extracted Traits:</span>
              <span >{personalityTraits || 'None'}</span>
            </div>
            <div>
              <span >History Contains Class:</span>
              <span >{profession || 'No'}</span>
            </div>
            <div>
              <span >World Genre:</span>
              <span >{worldConfig?.genre || 'Not set'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
