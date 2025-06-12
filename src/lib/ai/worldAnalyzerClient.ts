// Client-side world analyzer that calls the secure API endpoint
import Logger from '@/lib/utils/logger';
import { WorldAnalysisResult } from './worldAnalyzer';

const logger = new Logger('WorldAnalyzerClient');

export async function analyzeWorldDescriptionClient(description: string): Promise<WorldAnalysisResult> {
  logger.debug('analyzeWorldDescriptionClient called with:', description.substring(0, 50) + '...');
  
  try {
    const response = await fetch('/api/ai/analyze-world', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ description }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    const analysis = await response.json() as WorldAnalysisResult;
    logger.debug('Analysis received from API:', analysis);
    
    return analysis;
  } catch (error) {
    logger.error('Error in analyzeWorldDescriptionClient:', error);
    
    // Return default suggestions as fallback
    return {
      attributes: [
        { name: 'Strength', description: 'Physical power and endurance', minValue: 1, maxValue: 10, baseValue: 5, category: 'Physical', accepted: false },
        { name: 'Intelligence', description: 'Mental acuity and reasoning', minValue: 1, maxValue: 10, baseValue: 7, category: 'Mental', accepted: false },
        { name: 'Agility', description: 'Speed and dexterity', minValue: 1, maxValue: 10, baseValue: 6, category: 'Physical', accepted: false },
        { name: 'Charisma', description: 'Social influence and charm', minValue: 1, maxValue: 10, baseValue: 4, category: 'Social', accepted: false },
        { name: 'Dexterity', description: 'Hand-eye coordination and precision', minValue: 1, maxValue: 10, baseValue: 5, category: 'Physical', accepted: false },
        { name: 'Constitution', description: 'Health and stamina', minValue: 1, maxValue: 10, baseValue: 6, category: 'Physical', accepted: false },
      ],
      skills: [
        { name: 'Combat', description: 'Ability to fight effectively', difficulty: 'medium', category: 'Combat', linkedAttributeName: 'Strength', accepted: false, baseValue: 5, minValue: 1, maxValue: 10 },
        { name: 'Stealth', description: 'Moving unseen and unheard', difficulty: 'hard', category: 'Physical', linkedAttributeName: 'Agility', accepted: false, baseValue: 5, minValue: 1, maxValue: 10 },
        { name: 'Perception', description: 'Noticing details and dangers', difficulty: 'easy', category: 'Mental', linkedAttributeName: 'Intelligence', accepted: false, baseValue: 5, minValue: 1, maxValue: 10 },
        { name: 'Persuasion', description: 'Convincing others to agree', difficulty: 'medium', category: 'Social', linkedAttributeName: 'Charisma', accepted: false, baseValue: 5, minValue: 1, maxValue: 10 },
        { name: 'Investigation', description: 'Finding clues and solving mysteries', difficulty: 'medium', category: 'Mental', linkedAttributeName: 'Intelligence', accepted: false, baseValue: 5, minValue: 1, maxValue: 10 },
        { name: 'Athletics', description: 'Running, jumping, and climbing', difficulty: 'easy', category: 'Physical', linkedAttributeName: 'Strength', accepted: false, baseValue: 5, minValue: 1, maxValue: 10 },
        { name: 'Medicine', description: 'Healing wounds and treating ailments', difficulty: 'hard', category: 'Mental', linkedAttributeName: 'Intelligence', accepted: false, baseValue: 5, minValue: 1, maxValue: 10 },
        { name: 'Survival', description: 'Finding food and shelter in the wild', difficulty: 'medium', category: 'Physical', linkedAttributeName: 'Constitution', accepted: false, baseValue: 5, minValue: 1, maxValue: 10 },
        { name: 'Arcana', description: 'Understanding magical theory and practice', difficulty: 'hard', category: 'Mental', linkedAttributeName: 'Intelligence', accepted: false, baseValue: 5, minValue: 1, maxValue: 10 },
        { name: 'Deception', description: 'Lying and misleading others', difficulty: 'medium', category: 'Social', linkedAttributeName: 'Charisma', accepted: false, baseValue: 5, minValue: 1, maxValue: 10 },
        { name: 'Intimidation', description: 'Frightening or coercing others', difficulty: 'medium', category: 'Social', linkedAttributeName: 'Strength', accepted: false, baseValue: 5, minValue: 1, maxValue: 10 },
        { name: 'Performance', description: 'Entertainment and artistic expression', difficulty: 'easy', category: 'Social', linkedAttributeName: 'Charisma', accepted: false, baseValue: 5, minValue: 1, maxValue: 10 },
      ],
    };
  }
}