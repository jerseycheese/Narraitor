// src/lib/ai/portraitGenerator.ts

import { Character, CharacterPortrait } from '../../types/character.types';
import { AIClient } from './types';

interface PortraitGenerationOptions {
  worldTheme?: string;
  isKnownFigure?: boolean;
  knownFigureContext?: string; // e.g., "historical figure", "fictional character", "celebrity"
  actorName?: string; // For fictional characters played by specific actors
  detection?: {
    isKnownFigure: boolean;
    figureType?: string;
    actorName?: string;
    figureName?: string;
  };
}

export class PortraitGenerator {
  constructor(private aiClient: AIClient) {}

  /**
   * Detect if a character name is a known figure and if they're played by a specific actor
   * This will be determined by the AI based on the name
   */
  private async detectKnownFigure(characterName: string): Promise<{ 
    isKnownFigure: boolean; 
    figureType?: string;
    actorName?: string;
    figureName?: string;
  }> {
    console.log('🚀 DETECTION CALLED for:', characterName);
    try {
      // First, check if this is a known character
      const detectPrompt = `Is "${characterName}" a character from any form of media (movie, TV, book, game, etc.) or a real person?

Answer with JSON only: {"isKnownFigure": true/false, "figureType": "fictional/celebrity/historical/other" or null}`;

      console.log('🔍 Making initial detection request...');
      const detectResponse = await this.aiClient.generateContent(detectPrompt);
      const detectText = detectResponse.content;
      
      console.log('🔍 Initial detection response:', detectText);
      
      // Parse initial detection
      let isKnown = false;
      let figureType = null;
      
      try {
        const detectJson = JSON.parse(detectText.match(/\{[\s\S]*?\}/)?.[0] || '{}');
        isKnown = detectJson.isKnownFigure || false;
        figureType = detectJson.figureType;
      } catch {
        console.log('🔍 Failed to parse initial detection');
      }
      
      // If it's a known fictional character, ask specifically who played them
      let actorName = null;
      let figureName = null;
      
      if (isKnown && figureType === 'fictional') {
        const actorPrompt = `Who played the character "${characterName}" in the movie or TV show? What is the name of the movie/show?

Answer with JSON only: {"actorName": "actor's full name" or null, "figureName": "movie/show title" or null}`;
        
        const actorResponse = await this.aiClient.generateContent(actorPrompt);
        const actorText = actorResponse.content;
        
        console.log('🔍 Actor lookup response:', actorText);
        
        try {
          const actorJson = JSON.parse(actorText.match(/\{[\s\S]*?\}/)?.[0] || '{}');
          actorName = actorJson.actorName;
          figureName = actorJson.figureName;
        } catch {
          console.log('🔍 Failed to parse actor lookup');
        }
      }
      
      const result = {
        isKnownFigure: isKnown,
        figureType: figureType,
        actorName: actorName,
        figureName: figureName
      };
      
      console.log('🔍 Final detection result:', result);
      
      // Debug logging
      if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_DEBUG_LOGGING === 'true') {
        console.log('Detection result for', characterName, ':', result);
      }
      
      return result;
    } catch (error) {
      // If detection fails, assume not a known figure
      console.error('🔍 Detection error:', error);
      return { isKnownFigure: false };
    }
  }

  /**
   * Generate a portrait for a character
   */
  async generatePortrait(
    character: Character,
    options: PortraitGenerationOptions = {}
  ): Promise<CharacterPortrait> {
    if (!this.aiClient.generateImage) {
      throw new Error('AI client does not support image generation');
    }

    try {
      // Automatically detect if this is a known figure
      const detection = await this.detectKnownFigure(character.name);
      
      // If it's a known figure with missing background info, enhance the character data
      if (detection.isKnownFigure && (
        !character.background.physicalDescription || 
        !character.background.personality || 
        !character.background.history
      )) {
        character = await this.enhanceKnownCharacter(character, detection);
      }
      
      // Log detection results for debugging
      if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_DEBUG_LOGGING === 'true') {
        console.log('Portrait Detection Results:', {
          characterName: character.name,
          detection,
          providedOptions: options
        });
      }
      
      // Store detection result for test page
      if (typeof window !== 'undefined') {
        const windowWithDetection = window as Window & { lastDetectionResult?: typeof detection };
        windowWithDetection.lastDetectionResult = detection;
      }
      
      // Merge detected info with any provided options
      const mergedOptions = {
        ...options,
        isKnownFigure: detection.isKnownFigure,
        knownFigureContext: detection.figureType || options.knownFigureContext,
        actorName: detection.actorName || options.actorName,
        detection
      };
      
      const prompt = await this.buildPortraitPrompt(character, mergedOptions);
      
      // Log the generated prompt for debugging
      if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_DEBUG_LOGGING === 'true') {
        console.log('Generated Portrait Prompt:', prompt);
      }
      
      const response = await this.aiClient.generateImage(prompt);

      return {
        type: 'ai-generated',
        url: response.image,
        generatedAt: new Date().toISOString(),
        prompt: response.prompt
      };
    } catch (error) {
      throw new Error(
        `Failed to generate character portrait: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Build a descriptive prompt for portrait generation following Gemini's guidelines
   * Structure: Subject, Context, Style
   */
  async buildPortraitPrompt(
    character: Character,
    options: PortraitGenerationOptions = {}
  ): Promise<string> {
    console.log('🎨 BUILD PROMPT CALLED for:', character.name);
    
    // If no detection options provided, run AI detection
    if (!options.detection && !options.isKnownFigure) {
      console.log('🔍 No detection options provided, running AI detection...');
      const detection = await this.detectKnownFigure(character.name);
      console.log('🔍 Detection result:', detection);
      
      // Merge detection results into options
      options = {
        ...options,
        isKnownFigure: detection.isKnownFigure,
        knownFigureContext: detection.figureType || options.knownFigureContext,
        actorName: detection.actorName || options.actorName,
        detection
      };
    }
    
    const subject: string[] = [];
    const context: string[] = [];
    const style: string[] = [];
    
    // Determine if this is a fantasy setting (needed for multiple parts of the prompt)
    const isFantasy = options.worldTheme && 
      ['fantasy', 'medieval', 'magic', 'mystical', 'epic'].some(term => 
        options.worldTheme?.toLowerCase().includes(term)
      );
    
    // Extract key visual elements for emphasis
    const physicalDesc = character.background.physicalDescription || '';
    
    // Extract specific clothing items
    const clothingMatch = physicalDesc.match(/wearing\s+([^,\.]+)/i);
    const specificClothing = clothingMatch ? clothingMatch[1].trim() : null;
    
    // Extract distinctive features
    const distinctiveFeatures: string[] = [];
    if (physicalDesc.match(/missing teeth/i)) distinctiveFeatures.push('missing teeth');
    if (physicalDesc.match(/deformed|misshapen/i)) distinctiveFeatures.push('facial deformity');
    if (physicalDesc.match(/one eye higher/i)) distinctiveFeatures.push('asymmetrical eyes');
    if (physicalDesc.match(/scar/i)) distinctiveFeatures.push('visible scars');
    if (physicalDesc.match(/bald/i)) distinctiveFeatures.push('bald head');
    
    // Check if description has very specific details that need emphasis
    const hasSpecificDetails = specificClothing || distinctiveFeatures.length > 0;

    if (options.isKnownFigure) {
      // Known figures - photorealistic approach
      
      if (options.knownFigureContext === 'fictional' || options.knownFigureContext === 'videogame' || options.knownFigureContext === 'anime') {
        // Fictional characters (movies, games, anime, etc.)
        
        if (options.actorName) {
          // Live-action character with specific actor (e.g., Bob Wiley)
          // Put actor name FIRST with heavy emphasis for better recognition
          subject.push(`((${options.actorName})) as ${character.name}`);
          
          if (options.detection?.figureName) {
            subject.push(`from ${options.detection.figureName}`);
          }
          
          if (character.background.physicalDescription) {
            const cleanedDesc = character.background.physicalDescription
              .trim()
              .replace(/\s+/g, ' ')
              .replace(/[,\s]+$/, '');
            context.push(cleanedDesc);
          }
          
          // Add specific costume/clothing details if present
          if (specificClothing) {
            context.push(`wearing ${specificClothing}`);
          }
          if (distinctiveFeatures.length > 0) {
            context.push(`showing ${distinctiveFeatures.join(', ')}`);
          }
        } else {
          // Video game/animated character (e.g., Arthur Morgan)
          subject.push(`Character portrait of ${character.name}`);
          if (options.knownFigureContext === 'videogame') {
            // Use detected figureName if available, otherwise try to extract from history
            if (options.detection?.figureName) {
              subject.push(`from ${options.detection.figureName}`);
            } else if (character.background.history) {
              // More flexible regex patterns to extract game names
              let gameName = null;
              
              // Try multiple patterns to extract game/media titles
              const patterns = [
                /from\s+([^.]+)/i,           // "from [Game Name]"
                /in\s+([^.]+)/i,             // "in [Game Name]"
                /of\s+([^.]+)/i,             // "of [Game Name]"
                /([A-Z][a-zA-Z0-9\s:]+(?:\d+)?)/i // Title Case Names with numbers/colons
              ];
              
              for (const pattern of patterns) {
                const match = character.background.history.match(pattern);
                if (match && match[1]) {
                  gameName = match[1].trim();
                  break;
                }
              }
              
              if (gameName) {
                subject.push(`from ${gameName}`);
              } else {
                // Debug logging to see what history was generated
                if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_DEBUG_LOGGING === 'true') {
                  console.log('Could not extract game name from history:', character.background.history);
                }
                subject.push(`from the video game`);
              }
            } else {
              subject.push(`from the video game`);
            }
          }
          
          if (character.background.physicalDescription) {
            const cleanedDesc = character.background.physicalDescription
              .trim()
              .replace(/\s+/g, ' ')
              .replace(/[,\s]+$/, '')
              .toLowerCase();
            context.push(cleanedDesc);
          }
          
          context.push(`authentic game character appearance`);
          context.push(`recognizable character design`);
          context.push(`official character look`);
          
          // Add specific details if present
          if (hasSpecificDetails && character.background.physicalDescription) {
            if (specificClothing) {
              context.push(`wearing ${specificClothing}`);
            }
            if (distinctiveFeatures.length > 0) {
              context.push(`with ${distinctiveFeatures.join(', ')}`);
            }
          }
          
          // Add world theme styling if provided
          if (options.worldTheme) {
            context.push(`${options.worldTheme} style atmosphere`);
          }
        }
        
        // Add personality converted to visual traits
        if (character.background.personality) {
          const visualTraits = await this.convertPersonalityToVisualTraits(character.background.personality);
          if (visualTraits) {
            context.push(visualTraits);
          }
        }
      } else {
        // Real historical figures or celebrities
        subject.push(`Photorealistic portrait of ${character.name}`);
        if (options.knownFigureContext) {
          subject.push(`the ${options.knownFigureContext}`);
        }
        
        // Add physical description to help ensure accuracy
        if (character.background.physicalDescription) {
          const cleanedDesc = character.background.physicalDescription
            .trim()
            .replace(/\s+/g, ' ')
            .replace(/[,\s]+$/, '')
            .toLowerCase();
          context.push(cleanedDesc);
        }
        
        // CONTEXT: Character-appropriate environment
        if (options.knownFigureContext === 'comedian') {
          context.push(`comedy club or casual setting`);
        } else if (options.knownFigureContext === 'videogame') {
          context.push(`game world environment`);
        } else if (options.knownFigureContext === 'fictional' && character.background.history) {
          // Extract setting context from history
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
        
        // Add world theme styling if provided
        if (options.worldTheme) {
          context.push(`${options.worldTheme} style atmosphere`);
        }
      }
      
      // STYLE: Keep it minimal
      style.push(`portrait photograph`);
      
    } else {
      // Unknown/original characters - context-based approach
      
      if (isFantasy) {
        // SUBJECT: Fantasy character
        subject.push(`Fantasy character portrait of ${character.name}`);
        
        // Add physical description with enhanced diversity
        let physicalDesc = character.background.physicalDescription || '';
        
        // Enhance diversity for original characters
        if (!options.isKnownFigure || !options.actorName) {
          physicalDesc = await this.enhancePhysicalDiversity(physicalDesc, character.name);
        }
        
        if (physicalDesc) {
          const cleanedDesc = physicalDesc
            .trim()
            .replace(/\s+/g, ' ')
            .replace(/[,\s]+$/, '');
          if (cleanedDesc) {
            subject.push(`a ${cleanedDesc}`);
          }
        }
        
        // Extract profession/class from history
        if (character.background.history) {
          const professionMatch = character.background.history.match(
            /\b(warrior|mage|wizard|rogue|thief|cleric|priest|ranger|bard|druid|paladin|sorcerer|fighter|monk|archer|knight|barbarian|necromancer)\b/i
          );
          if (professionMatch) {
            subject.push(`${professionMatch[0].toLowerCase()} character`);
          }
        }
        
        // Add personality-based appearance
        if (character.background.personality) {
          const visualTraits = await this.convertPersonalityToVisualTraits(character.background.personality);
          if (visualTraits) {
            context.push(visualTraits);
          }
        }
        
        // CONTEXT: Fantasy setting
        context.push(`${options.worldTheme} world setting`);
        if (character.background.history && character.background.history.toLowerCase().includes('battle')) {
          context.push(`battle-worn appearance`);
        }
      } else {
        // SUBJECT: Realistic character portrait
        subject.push(`Character portrait of ${character.name}`);
        
        // Add physical description with enhanced diversity for non-actor characters
        let physicalDesc = character.background.physicalDescription || '';
        
        // Enhance diversity for original characters (not known figures without actors)
        if (!options.isKnownFigure || !options.actorName) {
          physicalDesc = await this.enhancePhysicalDiversity(physicalDesc, character.name);
        }
        
        if (physicalDesc) {
          const cleanedDesc = physicalDesc
            .trim()
            .replace(/\s+/g, ' ')
            .replace(/[,\s]+$/, '');
          if (cleanedDesc) {
            subject.push(`${cleanedDesc}`);
          }
        }
        
        // Add personality-based traits
        if (character.background.personality) {
          const visualTraits = await this.convertPersonalityToVisualTraits(character.background.personality);
          if (visualTraits) {
            context.push(visualTraits);
          }
        }
        
        // CONTEXT: World-appropriate setting
        if (options.worldTheme) {
          // Only add theme context if it's meaningful for the portrait
          const themeLC = options.worldTheme.toLowerCase();
          if (themeLC === 'modern' || themeLC === 'contemporary') {
            // Don't add generic "modern setting" - it's not helpful
            // The physical description should provide enough context
          } else {
            context.push(`${options.worldTheme} world environment`);
          }
        }
      }
      
      // STYLE: Based on fantasy vs realistic
      if (isFantasy) {
        style.push(`fantasy art portrait`);
        style.push(`digital painting`);
      } else {
        style.push(`portrait`);
      }
      
      // Add strong emphasis on realistic diversity for non-actor characters
      if (!options.isKnownFigure || !options.actorName) {
        style.push(`realistic average person`);
        style.push(`NOT a model or actor`);
        style.push(`photorealistic imperfections visible`);
        
        // Extract specific imperfections from the description and emphasize them
        const imperfections = [];
        const physicalDesc = subject.join(' ') + ' ' + context.join(' ');
        
        // Weight-related
        if (physicalDesc.match(/\b(pot belly|beer gut|double chin|jowls|overweight|heavy|barrel chest)\b/i)) {
          imperfections.push('visible weight');
        }
        
        // Hair-related
        if (physicalDesc.match(/\b(bald|balding|receding|thinning hair|bald spot)\b/i)) {
          imperfections.push('realistic hair loss');
        }
        
        // Skin-related
        if (physicalDesc.match(/\b(acne|pockmark|scar|wrinkle|liver spot|sun damage|weathered)\b/i)) {
          imperfections.push('skin imperfections clearly visible');
        }
        
        // Face-related
        if (physicalDesc.match(/\b(crooked|uneven|droopy|weak chin|heavy brow|gaunt|sunken)\b/i)) {
          imperfections.push('asymmetrical or non-ideal facial features');
        }
        
        if (imperfections.length > 0) {
          style.push(imperfections.join(', '));
        }
      }
    }

    // Combine all parts following Gemini's best practices: Subject, Context, Style
    const promptParts: string[] = [];
    
    // SUBJECT - Most important, comes first
    if (subject.length > 0) {
      let subjectText = subject.join(', ');
      
      // If there's an actor name, add extra emphasis
      if (options.actorName) {
        subjectText = `${options.actorName}, ${subjectText}`;
      }
      
      promptParts.push(subjectText);
    }
    
    // Handle photography style based on whether we have an actor
    if (options.actorName) {
      // For actor-based portraits, use high-quality photography to capture likeness
      promptParts.push('professional portrait photography');
      promptParts.push('high resolution');
      promptParts.push('accurate facial likeness');
    } else if (!options.isKnownFigure) {
      // For non-actor characters, add photographic specifics for realism
      const physicalDesc = subject.join(' ') + ' ' + context.join(' ');
      const hasAttractiveDescriptor = physicalDesc.match(/\b(beautiful|handsome|pretty|gorgeous|attractive|stunning)\b/i);
      
      if (!hasAttractiveDescriptor) {
        // For average/imperfect characters, use documentary photography style
        promptParts.push('35mm portrait');
        promptParts.push('documentary photography');
        promptParts.push('candid portrait with visible skin texture and imperfections');
      } else {
        // For attractive characters, use standard portrait style
        promptParts.push('35mm portrait');
      }
    }
    
    // CONTEXT - Setting and additional details
    if (context.length > 0) {
      promptParts.push(context.join(', '));
    }
    
    // STYLE - Photography style and technical details
    if (isFantasy) {
      promptParts.push('fantasy art portrait, digital painting');
    } else {
      promptParts.push('photorealistic portrait');
    }
    
    // For non-beautiful characters, emphasize the imperfections
    if (!options.isKnownFigure || !options.actorName) {
      const physicalDesc = subject.join(' ') + ' ' + context.join(' ');
      const hasAttractiveDescriptor = physicalDesc.match(/\b(beautiful|handsome|pretty|gorgeous|attractive|stunning)\b/i);
      
      if (!hasAttractiveDescriptor && style.some(s => s.includes('imperfections'))) {
        promptParts.push('showing realistic flaws and asymmetry');
      }
    }
    
    // Build final prompt
    const fullPrompt = promptParts.join(', ');
    
    // Ensure under token limit
    return this.truncateText(fullPrompt, 1900);
  }

  /**
   * Enhance a known character with generated background information
   */
  private async enhanceKnownCharacter(
    character: Character, 
    detection: { isKnownFigure: boolean; figureType?: string; actorName?: string }
  ): Promise<Character> {
    try {
      const contextHint = detection.figureType === 'videogame' ? 'video game character' :
                         detection.figureType === 'fictional' ? 'fictional character' :
                         detection.figureType === 'comedian' ? 'comedian' :
                         'person';
      
      // Prepare prompts for missing fields
      const enhancements: { physicalDescription?: string; personality?: string; history?: string } = {};
      
      // Generate or enhance physical description
      if (!character.background.physicalDescription || character.background.physicalDescription.trim().length === 0) {
        // No user input - generate from scratch
        const prompt = `Provide an accurate physical description of ${character.name} (the ${contextHint}) in 30-35 words. 
        ${detection.figureType === 'fictional' && detection.actorName ? `As portrayed by ${detection.actorName} in the film/show.` : ''}
        MUST include: age, race/ethnicity, hair length (short/medium/long/shoulder-length/etc), hair style, hair color, facial features, build/body type, and typical clothing. 
        ${!detection.actorName ? 'Include realistic imperfections like weight, balding, scars, or plain features - not everyone is beautiful.' : ''}
        Be accurate to their actual appearance. Answer with just the description, no extra text.`;
        
        const response = await this.aiClient.generateContent(prompt);
        let description = response.content.trim();
        
        // Clean up the description
        // Remove character name if it starts with it (case insensitive)
        const namePattern = new RegExp(`^${character.name}\\s+(is\\s+)?`, 'i');
        description = description.replace(namePattern, '');
        
        // Capitalize first letter
        description = description.charAt(0).toUpperCase() + description.slice(1);
        
        // Fix multiple periods
        enhancements.physicalDescription = description.replace(/\.+$/, '.');
        
        if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_DEBUG_LOGGING === 'true') {
          console.log('Generated physical description for', character.name, ':', enhancements.physicalDescription);
        }
      } else {
        // User provided input - enhance it with AI knowledge
        const prompt = `Enhance this physical description of ${character.name} (the ${contextHint}) with accurate details: "${character.background.physicalDescription}"
        ${detection.figureType === 'fictional' && detection.actorName ? `As portrayed by ${detection.actorName} in the film/show.` : ''}
        Keep the user's description but add missing details like specific hair length/style/color, facial features, or typical clothing if not specified.
        Maximum 40 words. Answer with just the enhanced description, no extra text.`;
        
        const response = await this.aiClient.generateContent(prompt);
        enhancements.physicalDescription = response.content.trim().replace(/\.+$/, '.');
        
        if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_DEBUG_LOGGING === 'true') {
          console.log('Enhanced physical description for', character.name, ':', enhancements.physicalDescription);
        }
      }
      
      // Generate or enhance personality
      if (!character.background.personality || character.background.personality.trim().length === 0) {
        // No user input - generate from scratch
        const prompt = `Describe ${character.name}'s (the ${contextHint}) personality in 15 words or less. 
        Focus on their key character traits. 
        Answer with just the description, no extra text.`;
        
        const response = await this.aiClient.generateContent(prompt);
        enhancements.personality = response.content.trim().replace(/\.+$/, '.');
        
        if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_DEBUG_LOGGING === 'true') {
          console.log('Generated personality for', character.name, ':', enhancements.personality);
        }
      } else {
        // User provided input - enhance it with AI knowledge
        const prompt = `Enhance this personality description of ${character.name} (the ${contextHint}): "${character.background.personality}"
        Keep the user's description but add accurate character traits if missing or expand on provided traits.
        Maximum 20 words. Answer with just the enhanced description, no extra text.`;
        
        const response = await this.aiClient.generateContent(prompt);
        enhancements.personality = response.content.trim().replace(/\.+$/, '.');
        
        if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_DEBUG_LOGGING === 'true') {
          console.log('Enhanced personality for', character.name, ':', enhancements.personality);
        }
      }
      
      // Generate or enhance history
      if (!character.background.history || character.background.history.trim().length === 0) {
        // No user input - generate from scratch
        const prompt = `Provide a one-sentence background for ${character.name} (the ${contextHint}). 
        ${detection.figureType === 'videogame' ? 'MUST include the specific video game title they are from (e.g., "from Red Dead Redemption 2", "from The Legend of Zelda", etc.).' : ''}
        ${detection.figureType === 'fictional' ? 'MUST include the specific movie or TV show title they are from.' : ''}
        Answer with just one sentence, no extra text.`;
        
        const response = await this.aiClient.generateContent(prompt);
        enhancements.history = response.content.trim().replace(/\.+$/, '.');
        
        if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_DEBUG_LOGGING === 'true') {
          console.log('Generated history for', character.name, ':', enhancements.history);
          console.log('Detection type:', detection.figureType);
        }
      } else {
        // User provided input - enhance it with AI knowledge
        const prompt = `Enhance this background for ${character.name} (the ${contextHint}): "${character.background.history}"
        ${detection.figureType === 'videogame' ? 'Add the specific video game title if missing.' : ''}
        ${detection.figureType === 'fictional' ? 'Add the specific movie or TV show title if missing.' : ''}
        Keep the user's content but add missing context or details. One sentence maximum. Answer with just the enhanced background, no extra text.`;
        
        const response = await this.aiClient.generateContent(prompt);
        enhancements.history = response.content.trim().replace(/\.+$/, '.');
        
        if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_DEBUG_LOGGING === 'true') {
          console.log('Enhanced history for', character.name, ':', enhancements.history);
        }
      }
      
      // Return a new character object with the generated enhancements
      return {
        ...character,
        background: {
          ...character.background,
          physicalDescription: character.background.physicalDescription || enhancements.physicalDescription || '',
          personality: character.background.personality || enhancements.personality || '',
          history: character.background.history || enhancements.history || ''
        }
      };
    } catch (error) {
      // If enhancement fails, return original character
      console.error('Failed to enhance character:', error);
      return character;
    }
  }

  /**
   * Convert personality traits to visual expressions using AI
   */
  private async convertPersonalityToVisualTraits(personality: string): Promise<string> {
    try {
      const prompt = `Convert these personality traits into visible physical expressions and body language: "${personality}"
      
      Examples:
      - "desperate and anxious" → "wide eyes, tense shoulders, fidgeting hands"
      - "confident leader" → "straight posture, steady gaze, slight smile"
      - "exhausted workaholic" → "dark circles under eyes, disheveled hair, loosened tie"
      
      Provide only visual cues that a portrait artist could depict. 20 words max. Answer with just the visual description.`;
      
      const response = await this.aiClient.generateContent(prompt);
      return response.content.trim();
    } catch {
      // Fallback to simple extraction
      return this.extractKeyTraits(personality);
    }
  }

  /**
   * Add realistic physical diversity to character descriptions
   */
  private async enhancePhysicalDiversity(description: string, characterName: string): Promise<string> {
    // Check if description explicitly mentions attractiveness
    const hasAttractiveDescriptor = description && description.match(/\b(beautiful|handsome|pretty|gorgeous|attractive|stunning|hot|cute)\b/i);
    
    // If they're explicitly described as attractive, keep it
    if (hasAttractiveDescriptor) {
      return description;
    }
    
    // If description already has realistic/non-idealized features, return as-is
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
      
      const response = await this.aiClient.generateContent(prompt);
      return response.content.trim();
    } catch {
      // Fallback - add very specific variety based on character name hash
      const hash = characterName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
      const varieties = [
        'pot belly and double chin',
        'gaunt face with sunken cheeks',
        'heavy jowls and thick neck',
        'bony frame with protruding collarbones',
        'pear-shaped body with narrow shoulders',
        'barrel chest and beer gut'
      ];
      
      const additionalFeatures = [
        'receding hairline with bald spot',
        'thinning hair at temples',
        'pockmarked cheeks from old acne',
        'deep crow\'s feet and forehead lines',
        'yellowed, crooked teeth',
        'large nose with visible pores'
      ];
      
      const bodyType = varieties[hash % varieties.length];
      const feature = additionalFeatures[(hash * 3) % additionalFeatures.length];
      
      return description ? `${description}, ${bodyType}, ${feature}` : `${bodyType}, ${feature}`;
    }
  }

  /**
   * Extract key personality traits in a concise format (fallback method)
   */
  private extractKeyTraits(personality: string): string {
    // Take first 2-3 descriptive words from personality
    const words = personality.toLowerCase().split(/\s+/);
    const descriptiveWords = words.filter(word => 
      word.length > 3 && 
      !['with', 'and', 'the', 'very', 'quite', 'rather'].includes(word)
    ).slice(0, 3);
    
    return descriptiveWords.length > 0 ? descriptiveWords.join(' ') + ' expression' : '';
  }


  /**
   * Truncate text to specified length
   */
  private truncateText(text: string, maxLength: number): string {
    if (text.length <= maxLength) {
      return text;
    }
    return text.substring(0, maxLength - 3) + '...';
  }
}