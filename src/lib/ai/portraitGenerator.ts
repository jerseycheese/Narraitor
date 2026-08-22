// src/lib/ai/portraitGenerator.ts

import { Character } from '../../types/character.types';
import { AIClient } from './types';
import { truncate, safeTrim } from '@/lib/utils';
import { normalizeText, NORM_NAME, NORM_DESC } from '@/lib/utils/textNormalization';

import Logger from '@/lib/utils/logger';
const logger = new Logger('PortraitGenerator');

interface PortraitGenerationOptions {
  worldGenre?: string;
  isKnownFigure?: boolean;
  knownFigureContext?: string;
  actorName?: string;
  detection?: {
    isKnownFigure: boolean;
    figureType?: string;
    actorName?: string;
    figureName?: string;
  };
}

async function detectKnownFigure(
  aiClient: AIClient,
  characterName: string
): Promise<{
  isKnownFigure: boolean;
  figureType?: string;
  actorName?: string;
  figureName?: string;
}> {
  try {
    const detectPrompt = `Is "${characterName}" a character from any form of media (movie, TV, book, game, etc.) or a real person?

Answer with JSON only: {"isKnownFigure": true/false, "figureType": "fictional/celebrity/historical/other" or null}`;

    const detectResponse = await aiClient.generateContent(detectPrompt);
    const detectText = detectResponse.content;

    let isKnown = false;
    let figureType = null;

    try {
      const detectJson = JSON.parse(detectText.match(/\{[\s\S]*?\}/)?.[0] || '{}');
      isKnown = detectJson.isKnownFigure || false;
      figureType = detectJson.figureType;
    } catch {
      // Failed to parse initial detection, continue with defaults
    }

    let actorName = null;
    let figureName = null;

    if (isKnown && figureType === 'fictional') {
      const actorPrompt = `Who played the character "${characterName}" in the movie or TV show? What is the name of the movie/show?

Answer with JSON only: {"actorName": "actor's full name" or null, "figureName": "movie/show title" or null}`;

      const actorResponse = await aiClient.generateContent(actorPrompt);
      const actorText = actorResponse.content;

      try {
        const actorJson = JSON.parse(actorText.match(/\{[\s\S]*?\}/)?.[0] || '{}');
        actorName = actorJson.actorName;
        figureName = actorJson.figureName;
      } catch {
        // Failed to parse actor lookup, continue with defaults
      }
    }

    return {
      isKnownFigure: isKnown,
      figureType: figureType,
      actorName: actorName,
      figureName: figureName,
    };
  } catch (error) {
    logger.error('Character detection failed:', error);
    return { isKnownFigure: false };
  }
}

function extractKeyTraits(personality: string): string {
  const words = personality.toLowerCase().split(/\s+/);
  const descriptiveWords = words.filter(word =>
    word.length > 3 &&
    !['with', 'and', 'the', 'very', 'quite', 'rather'].includes(word)
  ).slice(0, 3);

  return descriptiveWords.length > 0 ? descriptiveWords.join(' ') + ' expression' : '';
}

async function convertPersonalityToVisualTraits(
  aiClient: AIClient,
  personality: string
): Promise<string> {
  try {
    const prompt = `Convert these personality traits into visible physical expressions and body language: "${personality}"

      Examples:
      - "desperate and anxious" → "wide eyes, tense shoulders, fidgeting hands"
      - "confident leader" → "straight posture, steady gaze, slight smile"
      - "exhausted workaholic" → "dark circles under eyes, disheveled hair, loosened tie"

      Provide only visual cues that a portrait artist could depict. 20 words max. Answer with just the visual description.`;

    const response = await aiClient.generateContent(prompt);
    return normalizeText(response.content, NORM_DESC);
  } catch {
    return extractKeyTraits(personality);
  }
}

async function enhancePhysicalDiversity(
  aiClient: AIClient,
  description: string,
  characterName: string
): Promise<string> {
  const hasAttractiveDescriptor = description && description.match(/\b(beautiful|handsome|pretty|gorgeous|attractive|stunning|hot|cute)\b/i);

  if (hasAttractiveDescriptor) {
    return description;
  }

  if (description && (
    description.match(/\b(overweight|obese|fat|chubby|stocky|thin|gaunt|skinny|bald|balding|ugly|plain|homely|scarred|weathered|wrinkled|aged)\b/i) ||
    description.match(/\b(crooked|missing|gap|acne|blemish|scar|mole|birthmark)\b/i)
  )) {
    return description;
  }

  try {
    const prompt = `Given this character description: "${description || 'No description provided'}"

      Add specific, non-idealized physical features that make the character look like a real, average person.
      Be VERY SPECIFIC about imperfections. Don't just say "weathered" - say what makes them weathered.

      Choose 2-3 from these categories:
      - Weight: "pot belly", "beer gut", "double chin", "jowls", "skinny arms", "bony shoulders"
      - Face: "uneven eyes", "crooked nose", "thin lips", "weak chin", "heavy brow", "droopy eyelids"
      - Skin: "acne scars on cheeks", "pockmarked skin", "liver spots", "deep wrinkles", "sun damage", "rosacea"
      - Hair: "receding hairline", "bald spot on crown", "thinning at temples", "greasy hair", "unkempt beard"
      - Teeth: "yellowed teeth", "missing molar", "gap between front teeth", "crooked bottom teeth"
      - Other: "slouched posture", "rounded shoulders", "thick glasses", "hearing aid"

      Keep the original description but add specific imperfections. 50 words max total. Answer with just the enhanced description.`;

    const response = await aiClient.generateContent(prompt);
    return normalizeText(response.content, NORM_DESC);
  } catch {
    const hash = characterName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const varieties = [
      'pot belly and double chin',
      'gaunt face with sunken cheeks',
      'heavy jowls and thick neck',
      'bony frame with protruding collarbones',
      'pear-shaped body with narrow shoulders',
      'barrel chest and beer gut',
    ];

    const additionalFeatures = [
      'receding hairline with bald spot',
      'thinning hair at temples',
      'pockmarked cheeks from old acne',
      'deep crow\'s feet and forehead lines',
      'yellowed, crooked teeth',
      'large nose with visible pores',
    ];

    const bodyType = varieties[hash % varieties.length];
    const feature = additionalFeatures[(hash * 3) % additionalFeatures.length];

    return description ? `${description}, ${bodyType}, ${feature}` : `${bodyType}, ${feature}`;
  }
}

/**
 * Build a descriptive prompt for portrait generation following Gemini's guidelines.
 * Structure: Subject, Context, Style
 */
export async function buildPortraitPrompt(
  aiClient: AIClient,
  character: Character,
  options: PortraitGenerationOptions = {}
): Promise<string> {
  // If no detection options provided, run AI detection
  if (!options.detection && !options.isKnownFigure) {
    const detection = await detectKnownFigure(aiClient, character.name);

    options = {
      ...options,
      isKnownFigure: detection.isKnownFigure,
      knownFigureContext: detection.figureType || options.knownFigureContext,
      actorName: detection.actorName || options.actorName,
      detection,
    };
  }

  const subject: string[] = [];
  const context: string[] = [];
  const style: string[] = [];

  const isFantasy = options.worldGenre &&
    ['fantasy', 'medieval', 'magic', 'mystical', 'epic'].some(term =>
      options.worldGenre?.toLowerCase().includes(term)
    );

  const physicalDesc = character.background?.physicalDescription || '';

  const clothingMatch = physicalDesc.match(/wearing\s+([^,\.]+)/i);
  const specificClothing = clothingMatch ? safeTrim(clothingMatch[1]) : null;

  const distinctiveFeatures: string[] = [];
  if (physicalDesc.match(/missing teeth/i)) distinctiveFeatures.push('missing teeth');
  if (physicalDesc.match(/deformed|misshapen/i)) distinctiveFeatures.push('facial deformity');
  if (physicalDesc.match(/one eye higher/i)) distinctiveFeatures.push('asymmetrical eyes');
  if (physicalDesc.match(/scar/i)) distinctiveFeatures.push('visible scars');
  if (physicalDesc.match(/bald/i)) distinctiveFeatures.push('bald head');

  const hasSpecificDetails = specificClothing || distinctiveFeatures.length > 0;

  if (options.isKnownFigure) {
    if (options.knownFigureContext === 'fictional' || options.knownFigureContext === 'videogame' || options.knownFigureContext === 'anime') {
      if (options.actorName) {
        subject.push(`((${options.actorName})) as ${character.name}`);

        if (options.detection?.figureName) {
          subject.push(`from ${options.detection?.figureName}`);
        }

        if (character.background?.physicalDescription) {
          const cleanedDesc = normalizeText(character.background.physicalDescription, NORM_DESC);
          context.push(cleanedDesc);
        }

        if (specificClothing) {
          context.push(`wearing ${specificClothing}`);
        }
        if (distinctiveFeatures.length > 0) {
          context.push(`showing ${distinctiveFeatures.join(', ')}`);
        }
      } else {
        subject.push(`Character portrait of ${character.name}`);
        if (options.knownFigureContext === 'videogame') {
          if (options.detection?.figureName) {
            subject.push(`from ${options.detection?.figureName}`);
          } else if (character?.background?.history) {
            let gameName = null;

            const patterns = [
              /from\s+([^.]+)/i,
              /in\s+([^.]+)/i,
              /of\s+([^.]+)/i,
              /([A-Z][a-zA-Z0-9\s:]+(?:\d+)?)/i,
            ];

            for (const pattern of patterns) {
              const match = character.background?.history?.match(pattern);
              if (match && match[1]) {
                gameName = safeTrim(match[1]);
                break;
              }
            }

            if (gameName) {
              subject.push(`from ${gameName}`);
            } else {
              subject.push(`from the video game`);
            }
          } else {
            subject.push(`from the video game`);
          }
        }

        if (character.background?.physicalDescription) {
          const cleanedDesc = normalizeText(character.background.physicalDescription, NORM_DESC).toLowerCase();
          context.push(cleanedDesc);
        }

        context.push(`authentic game character appearance`);
        context.push(`recognizable character design`);
        context.push(`official character look`);

        if (hasSpecificDetails && character?.background?.physicalDescription) {
          if (specificClothing) {
            context.push(`wearing ${specificClothing}`);
          }
          if (distinctiveFeatures.length > 0) {
            context.push(`with ${distinctiveFeatures.join(', ')}`);
          }
        }

        if (options.worldGenre) {
          context.push(`${options.worldGenre} style atmosphere`);
        }
      }

      if (character.background?.personality) {
        const visualTraits = await convertPersonalityToVisualTraits(aiClient, character.background.personality);
        if (visualTraits) {
          context.push(visualTraits);
        }
      }
    } else {
      subject.push(`Photorealistic portrait of ${character.name}`);
      if (options.knownFigureContext) {
        subject.push(`the ${options.knownFigureContext}`);
      }

      if (character.background?.physicalDescription) {
        const cleanedDesc = normalizeText(character.background.physicalDescription, NORM_DESC).toLowerCase();
        context.push(cleanedDesc);
      }

      if (options.knownFigureContext === 'comedian') {
        context.push(`comedy club or casual setting`);
      } else if (options.knownFigureContext === 'videogame') {
        context.push(`game world environment`);
      } else if (options.knownFigureContext === 'fictional' && character.background?.history) {
        if (character.background.history.toLowerCase().includes('vacation')) {
          context.push(`vacation resort setting`);
        } else if (character.background.history.toLowerCase().includes('film')) {
          context.push(`movie scene environment`);
        } else {
          context.push(`appropriate scene setting`);
        }
      } else {
        context.push(`appropriate environment for character`);
      }
      context.push(`ambient lighting`);
      context.push(`contextual background`);

      if (options.worldGenre) {
        context.push(`${options.worldGenre} style atmosphere`);
      }
    }

    style.push(`headshot portrait photograph`);
  } else {
    if (isFantasy) {
      subject.push(`Fantasy character portrait of ${character.name}`);

      let physicalDesc = character.background?.physicalDescription || '';

      if (!options.isKnownFigure || !options.actorName) {
        physicalDesc = await enhancePhysicalDiversity(aiClient, physicalDesc, character.name);
      }

      if (physicalDesc) {
        const cleanedDesc = normalizeText(physicalDesc, NORM_NAME);
        if (cleanedDesc) {
          subject.push(`a ${cleanedDesc}`);
        }
      }

      if (character.background?.history) {
        const professionMatch = character.background.history.match(
          /\b(warrior|mage|wizard|rogue|thief|cleric|priest|ranger|bard|druid|paladin|sorcerer|fighter|monk|archer|knight|barbarian|necromancer)\b/i
        );
        if (professionMatch) {
          subject.push(`${professionMatch[0].toLowerCase()} character`);
        }
      }

      if (character.background?.personality) {
        const visualTraits = await convertPersonalityToVisualTraits(aiClient, character.background.personality);
        if (visualTraits) {
          context.push(visualTraits);
        }
      }

      context.push(`${options.worldGenre} world setting`);
      if (character.background?.history && character.background.history.toLowerCase().includes('battle')) {
        context.push(`battle-worn appearance`);
      }
    } else {
      subject.push(`Character portrait of ${character.name}`);

      let physicalDesc = character.background?.physicalDescription || '';

      if (!options.isKnownFigure || !options.actorName) {
        physicalDesc = await enhancePhysicalDiversity(aiClient, physicalDesc, character.name);
      }

      if (physicalDesc) {
        const cleanedDesc = normalizeText(physicalDesc, NORM_NAME);
        if (cleanedDesc) {
          subject.push(`${cleanedDesc}`);
        }
      }

      if (character.background?.personality) {
        const visualTraits = await convertPersonalityToVisualTraits(aiClient, character.background.personality);
        if (visualTraits) {
          context.push(visualTraits);
        }
      }

      if (options.worldGenre) {
        const genreLC = options.worldGenre?.toLowerCase();
        if (genreLC === 'modern' || genreLC === 'contemporary') {
          // skip generic "modern setting" — physical desc carries context
        } else {
          context.push(`${options.worldGenre} world environment`);
        }
      }
    }

    if (isFantasy) {
      style.push(`fantasy art headshot portrait`);
      style.push(`face close-up digital painting`);
    } else {
      style.push(`headshot portrait`);
    }

    if (!options.isKnownFigure || !options.actorName) {
      style.push(`realistic average person`);
      style.push(`NOT a model or actor`);
      style.push(`photorealistic imperfections visible`);

      const imperfections = [];
      const physicalDescAll = subject.join(' ') + ' ' + context.join(' ');

      if (physicalDescAll.match(/\b(pot belly|beer gut|double chin|jowls|overweight|heavy|barrel chest)\b/i)) {
        imperfections.push('visible weight');
      }

      if (physicalDescAll.match(/\b(bald|balding|receding|thinning hair|bald spot)\b/i)) {
        imperfections.push('realistic hair loss');
      }

      if (physicalDescAll.match(/\b(acne|pockmark|scar|wrinkle|liver spot|sun damage|weathered)\b/i)) {
        imperfections.push('skin imperfections clearly visible');
      }

      if (physicalDescAll.match(/\b(crooked|uneven|droopy|weak chin|heavy brow|gaunt|sunken)\b/i)) {
        imperfections.push('asymmetrical or non-ideal facial features');
      }

      if (imperfections.length > 0) {
        style.push(imperfections.join(', '));
      }
    }
  }

  const promptParts: string[] = [];

  if (subject.length > 0) {
    let subjectText = subject.join(', ');

    if (options.actorName) {
      subjectText = `${options.actorName}, ${subjectText}`;
    }

    promptParts.push(subjectText);
  }

  if (options.actorName) {
    promptParts.push('professional headshot photography');
    promptParts.push('face close-up high resolution');
    promptParts.push('accurate facial likeness');
  } else if (!options.isKnownFigure) {
    const physicalDescAll = subject.join(' ') + ' ' + context.join(' ');
    const hasAttractiveDescriptor = physicalDescAll.match(/\b(beautiful|handsome|pretty|gorgeous|attractive|stunning)\b/i);

    if (!hasAttractiveDescriptor) {
      promptParts.push('35mm headshot portrait');
      promptParts.push('documentary photography');
      promptParts.push('candid face close-up with visible skin texture and imperfections');
    } else {
      promptParts.push('35mm headshot portrait');
    }
  }

  if (context.length > 0) {
    promptParts.push(context.join(', '));
  }

  if (isFantasy) {
    promptParts.push('fantasy art headshot portrait, face close-up digital painting');
  } else {
    promptParts.push('photorealistic headshot portrait');
  }

  if (!options.isKnownFigure || !options.actorName) {
    const physicalDescAll = subject.join(' ') + ' ' + context.join(' ');
    const hasAttractiveDescriptor = physicalDescAll.match(/\b(beautiful|handsome|pretty|gorgeous|attractive|stunning)\b/i);

    if (!hasAttractiveDescriptor && style.some(s => s.includes('imperfections'))) {
      promptParts.push('showing realistic flaws and asymmetry');
    }
  }

  const fullPrompt = promptParts.join(', ');

  return truncate(fullPrompt, 1900);
}
