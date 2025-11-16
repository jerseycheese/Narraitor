import { AIClient } from './types';
import { narrativeTemplateManager } from '../promptTemplates/narrativeTemplateManager';
import { useWorldStore } from '@/state/worldStore';
import { Decision, DecisionOption, NarrativeContext, ChoiceAlignment } from '@/types/narrative.types';
import { World } from '@/types/world.types';
import { EntityID } from '@/types/common.types';
import { generateUniqueId } from '@/lib/utils/generateId';
import { DEFAULT_TONE_SETTINGS } from '@/types/tone-settings.types';
import { getDetailedToneInstructions } from './toneSettingsGuidance';
import { getLoreContextForPrompt } from './loreContextHelper';
import { truncate, safeTrim, getTimestamp } from '@/lib/utils';
import { normalizeText, NORM_NAME, NORM_DESC } from '@/lib/utils/textNormalization';
import { useInventoryStore } from '@/state/inventoryStore';
import { buildInventoryContext } from '@/lib/promptContext/inventoryContextBuilder';
import { playerDecisionTracker } from './playerDecisionTracker';
import { formatDecisions } from './simpleDecisionFormatter';
import type { SimpleNarrativeContext } from './simpleDecisionRelevance';

/**
 * Parameters for choice generation
 */
export interface ChoiceGenerationParams {
  worldId: string;
  narrativeContext: NarrativeContext;
  characterIds: string[];
  sessionId?: EntityID;
  maxOptions?: number;
  minOptions?: number;
  useAlignedChoices?: boolean;
  includeDecisionHistory?: boolean;
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
      const { worldId, narrativeContext, characterIds, sessionId, maxOptions = 4, minOptions = 3, useAlignedChoices = false, includeDecisionHistory = true } = params;
      
      console.log('🔄 Generating choices - Step 1: Getting world', { worldId });
      const world = this.getWorld(worldId);
      
      console.log('🔄 Generating choices - Step 2: Getting template', { useAlignedChoices });
      const template = this.getTemplate(useAlignedChoices ? 'alignedPlayerChoice' : 'playerChoice');
      
      console.log('🔄 Generating choices - Step 3: Building context');
      const context = this.buildContext(world, narrativeContext, characterIds);
      
      console.log('🔄 Generating choices - Step 4: Generating base prompt');
      const basePrompt = template(context);

      console.log('🔄 Generating choices - Step 4b: Enhancing with inventory context');
      const inventoryAwarePrompt = this.enhancePromptWithInventory(basePrompt, characterIds);
      
      console.log('🔄 Generating choices - Step 5: Enhancing with lore');
      const loreEnhancedPrompt = this.enhancePromptWithLore(inventoryAwarePrompt, worldId);
      
      console.log('🔄 Generating choices - Step 6: Enhancing with tone settings');
      const toneEnhancedPrompt = this.enhancePromptWithToneSettings(loreEnhancedPrompt, world);

      console.log('🔄 Generating choices - Step 7: Enhancing with decision history');
      const prompt = includeDecisionHistory && sessionId
        ? this.enhancePromptWithDecisionHistory(toneEnhancedPrompt, worldId, sessionId, narrativeContext)
        : toneEnhancedPrompt;

      const response = await this.aiClient.generateContent(prompt);
      
      
      if (!response?.content || safeTrim(response?.content ?? '') === '') {
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
      
      
      return decision;
    } catch (error) {
      const errorDetails = {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        worldId: params.worldId,
        hasNarrativeContext: !!params.narrativeContext,
        characterIds: params.characterIds,
        maxOptions: params.maxOptions,
        minOptions: params.minOptions
      };
      console.error('❌ CHOICE GENERATOR ERROR:', errorDetails);
      console.error('Full error object:', error);
      
      // Add an alert to make the error visible to the user for debugging
      if (typeof window !== 'undefined') {
      }
      
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
        const weightText = safeTrim(weightMatch[1]).toLowerCase();
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
      
      
      // Extract the AI-generated context summary from original content (before cleaning)
      let contextSummary = '';
      const contextMatch = content.match(/Context Summary:?\s*([^\n]+)/i);
      if (contextMatch && contextMatch[1]) {
        contextSummary = safeTrim(contextMatch[1]);
      }
      
      // Extract the decision prompt from cleaned content
      let prompt = '';
      // Look for "Decision:" at the start of a line, followed by the prompt
      const promptMatch = cleanedContent.match(/^Decision:?\s*(.+)$/im);
      if (promptMatch && promptMatch[1]) {
        prompt = safeTrim(promptMatch[1]);
        
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
      let currentOption: Partial<DecisionOption & { hint: string | undefined; requirements: { type: string; targetId: string; operator: string; value: number }[] }> | null = null;
      
      for (const line of lines) {
        const trimmed = safeTrim(line);
        
        // Check for numbered option (e.g., "1. Do something")
        const optionMatch = trimmed.match(/^(\d+)\.\s*(.+)$/);
        if (optionMatch) {
          // Save previous option if exists
          if (currentOption) {
            options.push(this.finalizeOption(currentOption));
          }
          
          // Start new option
          const optionText = safeTrim(optionMatch[2]);
          
          // Check for alignment tag in option text
          const alignmentMatch = optionText.match(/^\[([^\]]+)\]\s*(.+)$/);
          let alignment: ChoiceAlignment = 'neutral';
          let text = optionText;
          
          if (alignmentMatch) {
            const alignmentText = safeTrim(alignmentMatch[1]).toLowerCase();
            if (alignmentText === 'lawful') {
              alignment = 'lawful';
            } else if (alignmentText === 'chaos' || alignmentText === 'chaotic') {
              alignment = 'chaotic';
            }
            text = safeTrim(alignmentMatch[2]);
          }
          
          currentOption = {
            id: generateUniqueId('option'),
            text: text,
            alignment: alignment,
            hint: undefined,
            requirements: []
          };
        }
        // Check for Hint line
        else if (trimmed.match(/^Hint:\s*(.+)$/i)) {
          const hintMatch = trimmed.match(/^Hint:\s*(.+)$/i);
          if (currentOption && hintMatch) {
            currentOption.hint = safeTrim(hintMatch[1]);
          }
        }
        // Check for Requirements line
        else if (trimmed.match(/^Requirements?:\s*(.+)$/i)) {
          const reqMatch = trimmed.match(/^Requirements?:\s*(.+)$/i);
          if (currentOption && reqMatch) {
            const reqText = safeTrim(reqMatch[1]);
            // Parse requirement format: "SkillName X+"
            const skillMatch = reqText.match(/^(\w+)\s+(\d+)\+?$/);
            if (skillMatch) {
              const skillName = skillMatch[1];
              const level = parseInt(skillMatch[2]);
              currentOption.requirements?.push({
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
    
    // Create generic options based on world genre
    const options: DecisionOption[] = [];
    const genre = (world?.genre || 'fantasy').toLowerCase();
    
    if (narrativeContext?.currentSituation) {
      // Add a contextual option based on the current situation
      options.push({
        id: generateUniqueId('option'),
        text: `Investigate further`,
        alignment: 'neutral'
      });
    }
    
    // Add genre-appropriate options
    switch (genre) {
      case 'fantasy':
        options.push(
          { 
            id: generateUniqueId('option'), 
            text: 'Search for clues', 
            alignment: 'neutral',
            hint: 'Look around carefully for important details'
          },
          { 
            id: generateUniqueId('option'), 
            text: 'Talk to nearby characters', 
            alignment: 'lawful',
            hint: 'Gather information through conversation',
            requirements: [{
              type: 'skill',
              targetId: 'persuasion',
              operator: 'gte',
              value: 3
            }]
          },
          { 
            id: generateUniqueId('option'), 
            text: 'Cast a spell to illuminate the area', 
            alignment: 'neutral',
            hint: 'Use magic to reveal hidden things',
            requirements: [{
              type: 'skill',
              targetId: 'magic',
              operator: 'gte',
              value: 4
            }]
          }
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
    
    
    if (!world) {
      console.error('World not found:', worldId);
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
      console.error('Template not found:', templateKey, error);
      throw error;
    }
  }

  /**
   * Build context for the prompt template
   */
  private buildContext(world: World, narrativeContext: NarrativeContext, characterIds: string[]) {
    const context = {
      worldName: world.name,
      worldDescription: world.description,
      genre: world.genre,
      narrativeContext,
      characterIds,
      worldSkills: world.skills?.map(skill => ({
        id: skill.id,
        name: skill.name,
        description: skill.description
      })) || []
    };


    return context;
  }

  /**
   * Enhances a prompt with lore context for the given world
   */
  private enhancePromptWithLore(prompt: string, worldId: string): string {
    const loreContext = getLoreContextForPrompt(worldId);
    return prompt + loreContext;
  }

  /**
   * Enhances a prompt with detailed tone settings for consistent choice generation
   */
  private enhancePromptWithToneSettings(prompt: string, world: World): string {
    const toneSettings = world.toneSettings || DEFAULT_TONE_SETTINGS;
    
    
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


    return prompt + detailedInstructions + choiceSpecificGuidance;
  }

  private enhancePromptWithInventory(prompt: string, characterIds: string[]): string {
    try {
      if (!characterIds || characterIds.length === 0) {
        return prompt;
      }

      const characterId = characterIds[0];
      const { getCharacterItems } = useInventoryStore.getState();
      const items = getCharacterItems(characterId);

      if (!items || items.length === 0) {
        return prompt;
      }

      const { context: inventorySection } = buildInventoryContext(items);

      if (!inventorySection) {
        return prompt;
      }

      const guidance = `

PLAYER INVENTORY CONTEXT:
${inventorySection}

CHOICE DESIGN RULES:
- The player ALREADY possesses the items listed above.
- Do NOT create options that suggest picking up or rediscovering these items.
- You may reference these items as tools or resources, but focus choices on new actions that move the narrative forward.`;

      return `${prompt}${guidance}`;
    } catch {
      return prompt;
    }
  }


  /**
   * Create a meaningful context summary from the narrative context
   */
  private createFallbackContextSummary(narrativeContext: NarrativeContext): string {
    const location = narrativeContext.currentLocation || 'an unknown location';
    
    // Try to get the most recent narrative content for context
    const recentSegments = narrativeContext.recentSegments || narrativeContext.previousSegments || [];
    if (recentSegments.length > 0) {
      const latestSegment = recentSegments[recentSegments.length - 1];
      if (latestSegment && latestSegment.content) {
        // Extract the first sentence or up to 100 characters for context
        const firstSentence = latestSegment.content.split('.')[0];
        const contextText = firstSentence.length > 100 
          ? truncate(firstSentence, 100)
          : firstSentence + '.';
        
        return contextText;
      }
    }
    
    // Check if there's a current situation context
    if (narrativeContext.currentSituation) {
      return narrativeContext.currentSituation;
    }
    
    // Fallback to location-based context
    return `You find yourself at ${location}, considering your next move.`;
  }

  /**
   * Finalize an option by cleaning up the structure and adding requirements
   */
  private finalizeOption(option: Partial<DecisionOption & { hint: string | undefined; requirements: { type: string; targetId: string; operator: string; value: number }[] }>): DecisionOption {
    // Normalize option text for consistent formatting
    const normalizedText = normalizeText(option.text || 'Unknown option', NORM_NAME);

    const finalOption: DecisionOption = {
      id: option.id || generateUniqueId('option'),
      text: normalizedText,
      alignment: option.alignment || 'neutral'
    };

    // Add hint if present
    if (option.hint && safeTrim(option.hint)) {
      finalOption.hint = normalizeText(safeTrim(option.hint), NORM_DESC);
    }

    // Add requirements if present
    if (option.requirements && option.requirements.length > 0) {
      finalOption.requirements = option.requirements;
    }

    return finalOption;
  }

  /**
   * Enhances a prompt with past decision history to generate personalized choices
   * Uses simple recency-based filtering
   */
  private enhancePromptWithDecisionHistory(
    prompt: string,
    worldId: EntityID,
    sessionId: EntityID,
    narrativeContext: NarrativeContext
  ): string {
    try {
      // Simple context - just need worldId and sessionId for filtering
      const currentContext: SimpleNarrativeContext = { worldId, sessionId };

      // Get most recent decisions (max 15)
      let decisions = playerDecisionTracker.getRelevantDecisions(
        currentContext,
        15,
        { worldId, sessionId }
      );

      // Fallback to world-level decisions if no session-specific decisions exist
      if (decisions.length === 0) {
        decisions = playerDecisionTracker.getRelevantDecisions(
          currentContext,
          15,
          { worldId }
        );
      }

      // If no decisions at all, return prompt unchanged
      if (decisions.length === 0) {
        return prompt;
      }

      // Format decisions (all use same detailed format)
      const decisionHistory = formatDecisions(decisions);

      // Add decision history context with instructions for choice generation
      const decisionGuidance = `

## Past Decision History
${decisionHistory}

CHOICE GENERATION INSTRUCTIONS:
- Generate choices that reflect the player's established decision-making patterns
- Create natural callbacks to relevant past decisions when appropriate
- Align options with the character's demonstrated personality
- Acknowledge consequences of previous choices where relevant
- Ensure choices feel consistent with the player's history`;

      return `${prompt}${decisionGuidance}`;
    } catch (error) {
      console.error('Error enhancing prompt with decision history:', error);
      return prompt;
    }
  }
}
