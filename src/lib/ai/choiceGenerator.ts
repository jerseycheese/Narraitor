import { AIClient } from './types';
import { narrativeTemplateManager } from '../promptTemplates/narrativeTemplateManager';
import { useWorldStore } from '@/state/worldStore';
import { Decision, DecisionOption, NarrativeContext, ChoiceAlignment } from '@/types/narrative.types';
import { World } from '@/types/world.types';
import { generateUniqueId } from '@/lib/utils/generateId';
import { DEFAULT_TONE_SETTINGS } from '@/types/tone-settings.types';
import { getDetailedToneInstructions } from './toneSettingsGuidance';

/**
 * Parameters for choice generation
 */
export interface ChoiceGenerationParams {
  worldId: string;
  narrativeContext: NarrativeContext;
  characterIds: string[];
  maxOptions?: number;
  minOptions?: number;
  useAlignedChoices?: boolean;
}

/**
 * ChoiceGenerator class handles generating meaningful player choices
 * based on the current narrative context, character attributes, and world settings.
 */
export class ChoiceGenerator {
  constructor(private aiClient: AIClient) {}
  
  /**
   * Generate player choices based on narrative context
   */
  async generateChoices(params: ChoiceGenerationParams): Promise<Decision> {
    
    try {
      const { worldId, narrativeContext, characterIds, maxOptions = 4, minOptions = 3, useAlignedChoices = false } = params;
      const world = this.getWorld(worldId);
      const template = this.getTemplate(useAlignedChoices ? 'alignedPlayerChoice' : 'playerChoice');
      
      const context = this.buildContext(world, narrativeContext, characterIds);
      const basePrompt = template(context);
      const prompt = this.enhancePromptWithToneSettings(basePrompt, world);

      console.log('🔄 CHOICE GENERATOR: Calling AI client for choice generation...');
      const response = await this.aiClient.generateContent(prompt);
      console.log('🎯 CHOICE GENERATOR: AI response received:', {
        hasContent: !!response.content,
        contentLength: response.content?.length || 0,
        finishReason: response.finishReason
      });
      
      // Debug: Log the actual AI response to see what format it's using
      console.log('🔍 RAW AI RESPONSE:', response.content);
      
      if (!response.content || response.content.trim() === '') {
        console.log('⚠️ CHOICE GENERATOR: Empty response, using fallback choices');
        return this.generateFallbackChoices(worldId, narrativeContext);
      }
      
      const decision = this.parseChoiceResponse(response.content, narrativeContext);
      
      // Ensure we have the minimum number of options
      if (decision.options.length < minOptions) {
        const fallbackDecision = this.generateFallbackChoices(worldId, narrativeContext);
        const neededOptions = minOptions - decision.options.length;
        
        // Add additional options from fallback to meet minimum
        for (let i = 0; i < neededOptions; i++) {
          if (i < fallbackDecision.options.length) {
            decision.options.push(fallbackDecision.options[i]);
          }
        }
      }
      
      // Limit options to maximum if needed
      if (decision.options.length > maxOptions) {
        decision.options = decision.options.slice(0, maxOptions);
      }
      
      console.log('✅ CHOICE GENERATOR: Decision created successfully:', {
        id: decision.id,
        prompt: decision.prompt,
        optionCount: decision.options.length,
        decisionWeight: decision.decisionWeight
      });
      
      return decision;
    } catch (error) {
      console.error('Error generating AI choices:', error);
      return this.generateFallbackChoices(params.worldId, params.narrativeContext);
    }
  }

  /**
   * Parse the AI response into a structured Decision object
   */
  private parseChoiceResponse(content: string, narrativeContext: NarrativeContext): Decision {
    // Create a new decision ID
    const decisionId = generateUniqueId('decision');
    
    try {
      // Clean the content by removing the decision weight line to prevent it from appearing in UI
      const cleanedContent = content.replace(/Decision Weight:?\s*\[?[^\]\n]+\]?\s*\n?/i, '');
      
      // Extract the decision weight before cleaning
      let decisionWeight: 'minor' | 'major' | 'critical' = 'minor';
      const weightMatch = content.match(/Decision Weight:?\s*\[?([^\]\n]+)\]?/i);
      
      
      if (weightMatch && weightMatch[1]) {
        const weightText = weightMatch[1].trim().toLowerCase();
        if (weightText === 'major') {
          decisionWeight = 'major';
        } else if (weightText === 'critical') {
          decisionWeight = 'critical';
        }
      } else {
        // If AI didn't provide weight, make a reasonable guess based on story progress
        const segmentCount = narrativeContext.previousSegments?.length || 0;
        
        // Realistic decision weight distribution
        const randomValue = Math.random();
        if (segmentCount > 12) {
          // Late story - higher chance of critical decisions
          if (randomValue > 0.85) {
            decisionWeight = 'critical';
          } else if (randomValue > 0.6) {
            decisionWeight = 'major';
          }
        } else if (segmentCount > 8) {
          // Mid-late story - some major decisions
          if (randomValue > 0.9) {
            decisionWeight = 'critical';
          } else if (randomValue > 0.75) {
            decisionWeight = 'major';
          }
        } else if (segmentCount > 4) {
          // Mid story - occasional major decisions
          if (randomValue > 0.85) {
            decisionWeight = 'major';
          }
        }
        // Early story (segmentCount <= 4) stays as 'minor' by default
      }
      
      
      // Extract the AI-generated context summary
      let contextSummary = '';
      const contextMatch = cleanedContent.match(/Context Summary:?\s*([^\n]+)/i);
      if (contextMatch && contextMatch[1]) {
        contextSummary = contextMatch[1].trim();
      }
      
      // Extract the decision prompt from cleaned content
      let prompt = '';
      // Look for "Decision:" at the start of a line, followed by the prompt
      const promptMatch = cleanedContent.match(/^Decision:?\s*(.+)$/im);
      if (promptMatch && promptMatch[1]) {
        prompt = promptMatch[1].trim();
        
        // If prompt is empty or too short, use fallback
        if (!prompt || prompt.length < 3) {
          prompt = 'What will you do?';
        }
      } else {
        // Fallback if no prompt found
        prompt = 'What will you do?';
      }
      
      // Extract options with hints and requirements from cleaned content
      const options: DecisionOption[] = [];
      
      // Parse the new format with optional Hint and Requirements lines
      // Split into lines and process options with their associated hints/requirements
      const lines = cleanedContent.split('\n');
      let currentOption: any = null;
      
      for (const line of lines) {
        const trimmed = line.trim();
        
        // Check for numbered option (e.g., "1. Do something")
        const optionMatch = trimmed.match(/^(\d+)\.\s*(.+)$/);
        if (optionMatch) {
          // Save previous option if exists
          if (currentOption) {
            options.push(this.finalizeOption(currentOption));
          }
          
          // Start new option
          const optionText = optionMatch[2].trim();
          
          // Check for alignment tag in option text
          const alignmentMatch = optionText.match(/^\[([^\]]+)\]\s*(.+)$/);
          let alignment: ChoiceAlignment = 'neutral';
          let text = optionText;
          
          if (alignmentMatch) {
            const alignmentText = alignmentMatch[1].trim().toLowerCase();
            if (alignmentText === 'lawful') {
              alignment = 'lawful';
            } else if (alignmentText === 'chaos' || alignmentText === 'chaotic') {
              alignment = 'chaotic';
            }
            text = alignmentMatch[2].trim();
          }
          
          currentOption = {
            id: generateUniqueId('option'),
            text: text,
            alignment: alignment,
            hint: null,
            requirements: []
          };
        }
        // Check for Hint line
        else if (trimmed.match(/^Hint:\s*(.+)$/i)) {
          const hintMatch = trimmed.match(/^Hint:\s*(.+)$/i);
          if (currentOption && hintMatch) {
            currentOption.hint = hintMatch[1].trim();
          }
        }
        // Check for Requirements line
        else if (trimmed.match(/^Requirements?:\s*(.+)$/i)) {
          const reqMatch = trimmed.match(/^Requirements?:\s*(.+)$/i);
          if (currentOption && reqMatch) {
            const reqText = reqMatch[1].trim();
            // Parse requirement format: "SkillName X+"
            const skillMatch = reqText.match(/^(\w+)\s+(\d+)\+?$/);
            if (skillMatch) {
              const skillName = skillMatch[1];
              const level = parseInt(skillMatch[2]);
              currentOption.requirements.push({
                type: 'skill',
                targetId: skillName.toLowerCase(),
                operator: 'gte',
                value: level
              });
            }
          }
        }
      }
      
      // Don't forget the last option
      if (currentOption) {
        options.push(this.finalizeOption(currentOption));
      }
      
      // Debug: Log what we parsed
      console.log('🔍 PARSED OPTIONS:', options.map(opt => ({
        text: opt.text,
        hasHint: !!opt.hint,
        hasRequirements: !!(opt.requirements && opt.requirements.length > 0),
        alignment: opt.alignment
      })));
      
      // Create decision object with enhanced context (decisionWeight already extracted above)
      const decision = {
        id: decisionId,
        prompt,
        options: options.length > 0 ? options : this.createDefaultOptions(),
        decisionWeight,
        contextSummary: contextSummary || this.createFallbackContextSummary(narrativeContext)
      };
      
      
      return decision;
    } catch (error) {
      console.error('Error parsing choice response:', error);
      
      // Return a default decision if parsing fails
      return {
        id: decisionId,
        prompt: 'What will you do?',
        options: this.createDefaultOptions()
      };
    }
  }

  /**
   * Generate fallback choices when AI generation fails
   */
  private generateFallbackChoices(worldId: string, narrativeContext: NarrativeContext): Decision {
    const world = this.getWorld(worldId);
    const location = narrativeContext?.currentLocation || 'here';
    
    // Create a contextual decision prompt
    const prompt = `What will you do in ${location}?`;
    
    // Create generic options based on world theme/genre
    const options: DecisionOption[] = [];
    const theme = (world?.theme || 'fantasy').toLowerCase();
    
    if (narrativeContext?.currentSituation) {
      // Add a contextual option based on the current situation
      options.push({
        id: generateUniqueId('option'),
        text: `Investigate further`,
        alignment: 'neutral'
      });
    }
    
    // Add theme-appropriate options
    switch (theme) {
      case 'fantasy':
        options.push(
          { id: generateUniqueId('option'), text: 'Search for clues', alignment: 'neutral' },
          { id: generateUniqueId('option'), text: 'Talk to nearby characters', alignment: 'lawful' },
          { id: generateUniqueId('option'), text: 'Cast a random spell at the sky', alignment: 'chaotic' }
        );
        break;
      case 'sci-fi':
      case 'science fiction':
        options.push(
          { id: generateUniqueId('option'), text: 'Scan the area', alignment: 'neutral' },
          { id: generateUniqueId('option'), text: 'Access the terminal', alignment: 'lawful' },
          { id: generateUniqueId('option'), text: 'Reroute power to the coffee machine', alignment: 'chaotic' }
        );
        break;
      case 'horror':
        options.push(
          { id: generateUniqueId('option'), text: 'Hide', alignment: 'neutral' },
          { id: generateUniqueId('option'), text: 'Call for help', alignment: 'lawful' },
          { id: generateUniqueId('option'), text: 'Start laughing maniacally', alignment: 'chaotic' }
        );
        break;
      default:
        options.push(
          { id: generateUniqueId('option'), text: 'Look around', alignment: 'neutral' },
          { id: generateUniqueId('option'), text: 'Talk to someone', alignment: 'lawful' },
          { id: generateUniqueId('option'), text: 'Do something completely unexpected', alignment: 'chaotic' }
        );
    }
    
    return {
      id: generateUniqueId('decision'),
      prompt,
      options,
      decisionWeight: 'minor', // Fallback choices are typically minor
      contextSummary: this.createFallbackContextSummary(narrativeContext)
    };
  }

  /**
   * Create default options when no valid options are available
   */
  private createDefaultOptions(): DecisionOption[] {
    return [
      { id: generateUniqueId('option'), text: 'Continue', alignment: 'neutral' },
      { id: generateUniqueId('option'), text: 'Look around', alignment: 'neutral' },
      { id: generateUniqueId('option'), text: 'Wait', alignment: 'neutral' }
    ];
  }

  /**
   * Get world data from the store
   */
  private getWorld(worldId: string): World {
    const { worlds } = useWorldStore.getState();
    const world = worlds[worldId];
    
    console.log('🌍 CHOICE GENERATOR: Looking for world:', {
      worldId,
      availableWorlds: Object.keys(worlds),
      foundWorld: !!world
    });
    
    if (!world) {
      console.error('🔄 CHOICE GENERATOR: World not found:', worldId);
      throw new Error(`World not found: ${worldId}`);
    }
    
    return world;
  }

  /**
   * Get the appropriate template for generating choices
   */
  private getTemplate(templateType: string) {
    const templateKey = `narrative/${templateType}`;
    
    try {
      const template = narrativeTemplateManager.getTemplate(templateKey);
      return template;
    } catch (error) {
      console.error('🔄 CHOICE GENERATOR: Template not found:', templateKey, error);
      throw error;
    }
  }

  /**
   * Build context for the prompt template
   */
  private buildContext(world: World, narrativeContext: NarrativeContext, characterIds: string[]) {
    return {
      worldName: world.name,
      worldDescription: world.description,
      genre: world.theme,
      narrativeContext,
      characterIds,
      worldSkills: world.skills?.map(skill => ({
        id: skill.id,
        name: skill.name,
        description: skill.description
      })) || []
    };
  }

  /**
   * Enhances a prompt with detailed tone settings for consistent choice generation
   */
  private enhancePromptWithToneSettings(prompt: string, world: World): string {
    const toneSettings = world.toneSettings || DEFAULT_TONE_SETTINGS;
    
    console.log('🎮 TONE SETTINGS DEBUG [ChoiceGenerator]:', {
      worldId: world.id,
      worldName: world.name,
      toneSettings: {
        contentRating: toneSettings.contentRating,
        narrativeStyle: toneSettings.narrativeStyle,
        languageComplexity: toneSettings.languageComplexity,
        customInstructions: toneSettings.customInstructions || '(none)',
        usingDefaults: !world.toneSettings
      }
    });
    
    const detailedInstructions = getDetailedToneInstructions(
      toneSettings.contentRating,
      toneSettings.narrativeStyle,
      toneSettings.languageComplexity,
      toneSettings.customInstructions
    );

    // Add specific guidance for choice generation
    const choiceSpecificGuidance = `

CHOICE GENERATION FOCUS:
- ALL player choice options must strictly follow the content rating guidelines
- Choice descriptions should match the specified narrative style
- Use the specified language complexity in all choice text
- Ensure choices are appropriate and align with the tone settings
- Present options that respect the content boundaries while maintaining agency`;

    console.log('🎯 CHOICE TONE INSTRUCTIONS APPLIED:', {
      instructionLength: detailedInstructions.length + choiceSpecificGuidance.length,
      containsContentGuidelines: detailedInstructions.includes(`${toneSettings.contentRating.toUpperCase()}-RATED CONTENT GUIDELINES`),
      containsStyleGuidance: detailedInstructions.includes(`${toneSettings.narrativeStyle.toUpperCase()} NARRATIVE STYLE`),
      containsComplexityGuidance: detailedInstructions.includes(`${toneSettings.languageComplexity.toUpperCase()} LANGUAGE COMPLEXITY`),
      hasChoiceSpecificGuidance: true
    });

    return prompt + detailedInstructions + choiceSpecificGuidance;
  }


  /**
   * Create a fallback context summary when AI doesn't provide one
   */
  private createFallbackContextSummary(narrativeContext: NarrativeContext): string {
    const location = narrativeContext.currentLocation || 'an unknown location';
    return `A decision point at ${location}.`;
  }

  /**
   * Finalize an option by cleaning up the structure and adding requirements
   */
  private finalizeOption(option: any): DecisionOption {
    const finalOption: DecisionOption = {
      id: option.id,
      text: option.text,
      alignment: option.alignment || 'neutral'
    };

    // Add hint if present
    if (option.hint && option.hint.trim()) {
      finalOption.hint = option.hint.trim();
    }

    // Add requirements if present
    if (option.requirements && option.requirements.length > 0) {
      finalOption.requirements = option.requirements;
    }

    return finalOption;
  }
}
