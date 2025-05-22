import { AIClient } from './types';
import { narrativeTemplateManager } from '../promptTemplates/narrativeTemplateManager';
import { worldStore } from '@/state/worldStore';
import { Decision, DecisionOption, NarrativeContext } from '@/types/narrative.types';
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
      const { worldId, narrativeContext, characterIds, maxOptions = 4, minOptions = 3 } = params;
      const world = this.getWorld(worldId);
      const template = this.getTemplate('playerChoice');
      
      const context = this.buildContext(world, narrativeContext, characterIds);
      const prompt = template(context);

      const response = await this.aiClient.generateContent(prompt);
      
      if (!response.content || response.content.trim() === '') {
        return this.generateFallbackChoices(worldId, narrativeContext);
      }
      
      const decision = this.parseChoiceResponse(response.content);
      
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
  private parseChoiceResponse(content: string): Decision {
    // Create a new decision ID
    const decisionId = generateUniqueId('decision');
    
    try {
      // Extract the decision prompt
      let prompt = '';
      const promptMatch = content.match(/Decision:?\s*([^\n]+)/i);
      if (promptMatch && promptMatch[1]) {
        prompt = promptMatch[1].trim();
      } else {
        // Fallback if no prompt found
        prompt = 'What will you do?';
      }
      
      // Extract options
      const options: DecisionOption[] = [];
      
      // Try to match numbered options (1. Option text)
      const numberedMatches = content.matchAll(/^\s*\d+\.\s*(.+)$/gm);
      for (const match of numberedMatches) {
        if (match[1] && match[1].trim()) {
          options.push({
            id: generateUniqueId('option'),
            text: match[1].trim()
          });
        }
      }
      
      // If no numbered options found, try bullet points
      if (options.length === 0) {
        const bulletMatches = content.matchAll(/^\s*[-*]\s*(.+)$/gm);
        for (const match of bulletMatches) {
          if (match[1] && match[1].trim()) {
            options.push({
              id: generateUniqueId('option'),
              text: match[1].trim()
            });
          }
        }
      }
      
      // Create decision object
      return {
        id: decisionId,
        prompt,
        options: options.length > 0 ? options : this.createDefaultOptions()
      };
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
        text: `Investigate further`
      });
    }
    
    // Add theme-appropriate options
    switch (theme) {
      case 'fantasy':
        options.push(
          { id: generateUniqueId('option'), text: 'Search for clues' },
          { id: generateUniqueId('option'), text: 'Talk to nearby characters' },
          { id: generateUniqueId('option'), text: 'Move to a new location' }
        );
        break;
      case 'sci-fi':
      case 'science fiction':
        options.push(
          { id: generateUniqueId('option'), text: 'Scan the area' },
          { id: generateUniqueId('option'), text: 'Access the terminal' },
          { id: generateUniqueId('option'), text: 'Contact the crew' }
        );
        break;
      case 'horror':
        options.push(
          { id: generateUniqueId('option'), text: 'Hide' },
          { id: generateUniqueId('option'), text: 'Find a weapon' },
          { id: generateUniqueId('option'), text: 'Call for help' }
        );
        break;
      default:
        options.push(
          { id: generateUniqueId('option'), text: 'Look around' },
          { id: generateUniqueId('option'), text: 'Talk to someone' },
          { id: generateUniqueId('option'), text: 'Leave this area' }
        );
    }
    
    return {
      id: generateUniqueId('decision'),
      prompt,
      options
    };
  }

  /**
   * Create default options when no valid options are available
   */
  private createDefaultOptions(): DecisionOption[] {
    return [
      { id: generateUniqueId('option'), text: 'Continue' },
      { id: generateUniqueId('option'), text: 'Look around' },
      { id: generateUniqueId('option'), text: 'Wait' }
    ];
  }

  /**
   * Get world data from the store
   */
  private getWorld(worldId: string): World {
    const { worlds } = worldStore.getState();
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
}