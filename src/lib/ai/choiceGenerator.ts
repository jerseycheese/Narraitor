import { AIClient } from './types';
import { narrativeTemplateManager } from '../promptTemplates/narrativeTemplateManager';
import { useWorldStore } from '@/state/worldStore';
import { Decision, DecisionOption, NarrativeContext, ChoiceAlignment } from '@/types/narrative.types';
import { World } from '@/types/world.types';
import { generateUniqueId } from '@/lib/utils/generateId';

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
      const prompt = template(context);

      const response = await this.aiClient.generateContent(prompt);
      
      if (!response.content || response.content.trim() === '') {
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
        
        // For debugging - force more variety in decision weights
        const randomValue = Math.random();
        if (segmentCount >= 2) {
          // After the first couple segments, start mixing weights for testing
          if (randomValue > 0.7) {
            decisionWeight = 'major';
          } else if (randomValue > 0.9) {
            decisionWeight = 'critical';
          }
        } else if (segmentCount > 8) {
          // Later in story - more likely to be major decisions
          decisionWeight = Math.random() > 0.5 ? 'major' : 'minor';
        } else if (segmentCount > 3) {
          // Mid story - mix of minor and major
          decisionWeight = Math.random() > 0.7 ? 'major' : 'minor';
        }
      }
      
      
      // Extract the AI-generated context summary
      let contextSummary = '';
      const contextMatch = cleanedContent.match(/Context Summary:?\s*([^\n]+)/i);
      if (contextMatch && contextMatch[1]) {
        contextSummary = contextMatch[1].trim();
      }
      
      // Extract the decision prompt from cleaned content
      let prompt = '';
      // First try to capture everything after "Decision:" until "Options:" or end
      const promptMatch = cleanedContent.match(/Decision:?\s*([\s\S]+?)(?=\n\s*Options:|$)/i);
      if (promptMatch && promptMatch[1]) {
        prompt = promptMatch[1].trim();
      } else {
        // Try alternative patterns
        const altMatch1 = cleanedContent.match(/Decision:?\s*([\s\S]+?)(?=\n\s*\d+\.|$)/i);
        if (altMatch1 && altMatch1[1]) {
          prompt = altMatch1[1].trim();
        } else {
          const simpleMatch = cleanedContent.match(/Decision:?\s*([^\n]+)/i);
          if (simpleMatch && simpleMatch[1]) {
            prompt = simpleMatch[1].trim();
          } else {
            // Fallback if no prompt found
            prompt = 'What will you do?';
          }
        }
      }
      
      // Extract options with alignment tags from cleaned content
      const options: DecisionOption[] = [];
      
      // First, try to match all numbered options and parse alignment if present
      const numberedMatches = cleanedContent.matchAll(/^\s*\d+\.\s*(.+)$/gm);
      for (const match of numberedMatches) {
        if (match[1] && match[1].trim()) {
          const fullText = match[1].trim();
          
          // Check if this option has an alignment tag
          // Supported alignment tags: [LAWFUL], [NEUTRAL], [CHAOTIC]
          const alignmentMatch = fullText.match(/^\[([^\]]+)\]\s*(.+)$/);
          
          if (alignmentMatch) {
            // Has alignment tag
            const alignmentText = alignmentMatch[1].trim().toLowerCase();
            let alignment: ChoiceAlignment = 'neutral';
            
            if (alignmentText === 'lawful') {
              alignment = 'lawful';
            } else if (alignmentText === 'chaos' || alignmentText === 'chaotic') {
              alignment = 'chaotic';
            }
            
            options.push({
              id: generateUniqueId('option'),
              text: alignmentMatch[2].trim(),
              alignment
            });
          } else {
            // No alignment tag, default to neutral
            options.push({
              id: generateUniqueId('option'),
              text: fullText,
              alignment: 'neutral'
            });
          }
        }
      }
      
      // If no numbered options found, try bullet points
      if (options.length === 0) {
        const bulletMatches = cleanedContent.matchAll(/^\s*[-*]\s*(.+)$/gm);
        for (const match of bulletMatches) {
          if (match[1] && match[1].trim()) {
            options.push({
              id: generateUniqueId('option'),
              text: match[1].trim(),
              alignment: 'neutral'
            });
          }
        }
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
      characterIds
    };
  }


  /**
   * Create a fallback context summary when AI doesn't provide one
   */
  private createFallbackContextSummary(narrativeContext: NarrativeContext): string {
    const location = narrativeContext.currentLocation || 'an unknown location';
    return `A decision point at ${location}.`;
  }
}
