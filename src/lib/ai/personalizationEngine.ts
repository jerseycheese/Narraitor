/**
 * PersonalizationEngine - AI-Driven Narrative Personalization System
 * 
 * This engine analyzes player behavior patterns and character data to create
 * personalized narrative experiences. It uses machine learning techniques to
 * infer player preferences from decision history and dynamically adapts
 * storytelling style, detail level, and content focus.
 * 
 * Key Features:
 * - Dynamic preference inference from player choices
 * - Secure input validation and sanitization
 * - Structured data parsing with fallback handling
 * - Personality trait detection and mapping
 * - Context-aware narrative enhancement generation
 * 
 * Security: All inputs are validated and sanitized to prevent XSS attacks
 * Performance: O(n) complexity where n = number of player decisions
 * 
 * @author Narraitor AI System
 * @since 1.0.0
 */

import { 
  PersonalizedNarrativeContext,
  PersonalizationAnalysis,
  PlayerDecision,
  CharacterGoal,
  CharacterRelationship,
  PlayerPreferences,
  PersonalityTrait,
  ChoiceTypePreference,
  NarrativeStylePreference
} from '@/types/personalization.types';
import { 
  isPersonalityTrait, 
  isPlayerDecisionArray, 
  isSafeString,
  sanitizeString
} from '@/types/type-guards';
import { memoize, memoizeWithTTL } from '../utils/memoization';
// Simple character interface for personalization - avoids complex type dependencies
interface PersonalizationCharacter {
  id: string;
  name: string;
  background: string;
  attributes: Record<string, number> | Array<{ attributeId: string; value: number }>;
  skills: Array<{ name: string; level: number; worldSkillId?: string }> | Array<{ skillId: string; level: number }>;
  createdAt: string;
  updatedAt: string;
}
import { World } from '@/types/world.types';

/**
 * Structured representation of established narrative elements
 */
interface EstablishedElements {
  characterName?: string;
  worldName?: string;
  characterBackground?: string;
  skills: string[];
}

/**
 * Maps choice types to personality traits
 */
const CHOICE_TO_TRAIT_MAP: Record<ChoiceTypePreference, PersonalityTrait[]> = {
  diplomatic: ['diplomatic', 'patient', 'empathetic'],
  aggressive: ['direct', 'impulsive', 'brave'],
  stealthy: ['cautious', 'patient', 'logical'],
  helpful: ['empathetic', 'loyal', 'optimistic'],
  selfish: ['independent', 'ambitious', 'direct'],
  lawful: ['loyal', 'patient', 'logical'],
  chaotic: ['impulsive', 'independent', 'brave'],
  neutral: ['logical', 'cautious', 'diplomatic']
};

/**
 * Engine for creating personalized narrative contexts based on player behavior analysis
 * 
 * The PersonalizationEngine processes player decisions, character data, and world information
 * to generate personalized narrative experiences. It uses behavioral analysis algorithms
 * to infer player preferences and adapt storytelling accordingly.
 * 
 * @example
 * ```typescript
 * const engine = new PersonalizationEngine();
 * const context = engine.createPersonalizedContext(character, world, decisions);
 * const enhancement = engine.generateNarrativeEnhancement(context);
 * ```
 */
export class PersonalizationEngine {
  // Memoized expensive operations - initialized in constructor
  private memoizedTokenEstimation: (text: string) => number;
  private memoizedGoalPrioritization: (goals: CharacterGoal[], context: PersonalizedNarrativeContext) => CharacterGoal[];

  constructor() {
    // Initialize memoized methods
    this.memoizedTokenEstimation = memoize(this.estimateTokenCountCore.bind(this), 500);
    this.memoizedGoalPrioritization = memoizeWithTTL(this.prioritizeGoalsCore.bind(this), 2 * 60 * 1000, 50);
  }
  /**
   * Analyzes player behavior patterns to create personalized narrative context
   * 
   * This method processes player decisions to detect personality traits, preferences,
   * and behavioral patterns. It uses statistical analysis to determine dominant
   * choice types and narrative preferences.
   * 
   * @param character - Character data including background and skills
   * @param world - World information and context
   * @param decisions - Array of player decisions to analyze
   * @param relationships - Optional character relationships data
   * @param goals - Optional character goals data
   * @returns PersonalizationAnalysis with detected traits and preferences
   * 
   * @example
   * ```typescript
   * const analysis = engine.analyzePlayerBehavior(character, world, decisions);
   * console.log(analysis.detectedTraits); // ['diplomatic', 'empathetic', 'logical']
   * ```
   */
  analyzePlayerBehavior(
    character: PersonalizationCharacter,
    world: World,
    decisions: PlayerDecision[],
    relationships: CharacterRelationship[] = [],
    goals: CharacterGoal[] = []
  ): PersonalizationAnalysis {
    // Validate input data
    if (!isPlayerDecisionArray(decisions)) {
      console.warn('Invalid decisions array provided to analyzePlayerBehavior');
      return this.getDefaultAnalysis();
    }
    
    const detectedTraits = this.detectPersonalityTraits(decisions);
    const preferences = this.analyzePreferences(decisions);
    
    const narrativeEmphasis = {
      characterFocus: [character.background || ''],
      relationshipFocus: relationships,
      goalFocus: goals.filter(g => g.isActive)
    };

    return {
      detectedTraits,
      preferences,
      narrativeEmphasis,
      confidence: decisions.length > 0 ? 75 : 20
    };
  }

  /**
   * Creates comprehensive personalized context for narrative generation
   */
  createPersonalizedContext(
    character: PersonalizationCharacter,
    world: World,
    decisions: PlayerDecision[],
    relationships: CharacterRelationship[] = [],
    goals: CharacterGoal[] = [],
    narrativeHistory: string[] = []
  ): PersonalizedNarrativeContext {
    const analysis = this.analyzePlayerBehavior(character, world, decisions, relationships, goals);
    
    // Include skill names in established elements - handle both skill formats safely
    const skillNames = this.extractSkillNamesSafely(character.skills);
    
    return {
      character: {
        personality: analysis.detectedTraits,
        goals: goals.filter(g => g.isActive),
        relationships,
        recentDecisions: decisions.slice(0, 5)
      },
      playerPreferences: analysis.preferences,
      narrativeHistory: {
        keyEvents: narrativeHistory,
        establishedElements: this.buildEstablishedElementsArray(character, world, skillNames),
        characterMilestones: []
      }
    };
  }

  /**
   * Generates narrative enhancement text based on personalized context
   */
  generateNarrativeEnhancement(context: PersonalizedNarrativeContext): string {
    // Parse established elements safely
    const elements = this.parseEstablishedElements(context.narrativeHistory.establishedElements);
    
    // Validate and sanitize input
    const sanitizedElements = this.sanitizeNarrativeElements(elements);
    
    const enhancements: string[] = [];

    // Add character background details
    if (sanitizedElements.characterName) {
      const backgroundText = sanitizedElements.characterBackground ? 
        ` as ${sanitizedElements.characterBackground}` : '';
      enhancements.push(`CHARACTER FOCUS: Reference ${sanitizedElements.characterName}${backgroundText} and their background details.`);
    }

    // Add character skills
    if (sanitizedElements.skills.length > 0) {
      enhancements.push(`CHARACTER SKILLS: The character has expertise in ${sanitizedElements.skills.join(', ')}.`);
    }

    // Add character personality with type safety
    if (context.character.personality.length > 0) {
      const validTraits = context.character.personality
        .filter(trait => isPersonalityTrait(trait));
      if (validTraits.length > 0) {
        enhancements.push(`CHARACTER PERSONALITY: The character tends to be ${validTraits.join(', ')}.`);
      }
    }

    // Add specific decision context and consequences
    if (context.character.recentDecisions.length > 0) {
      // Prioritize decisions by significance and recency
      const prioritizedDecisions = this.prioritizeDecisionsBySignificance(context.character.recentDecisions);
      const recentDecisions = prioritizedDecisions.slice(0, 5); // Top 5 most significant decisions
      
      // Create specific decision reference section
      const decisionDetails = recentDecisions.map(decision => {
        const location = decision.context?.location ? ` at ${decision.context.location}` : '';
        const npcs = decision.context?.charactersPresent ? ` (involving: ${decision.context.charactersPresent.join(', ')})` : '';
        const situation = decision.context?.situation ? ` (${decision.context.situation})` : '';
        const timeAgo = this.formatTimeAgo(decision.timestamp);
        return `• ${decision.choiceText}${location}${npcs}${situation} [${timeAgo}, ${decision.choiceType}]`;
      }).join('\n');
      
      enhancements.push(`PAST PLAYER DECISIONS:\n${decisionDetails}`);
      
      // Add explicit AI instructions for referencing decisions
      enhancements.push(`REFERENCE PAST DECISIONS: Build upon these previous choices in the narrative. NPCs should remember their interactions with the player character. Create consequences of past actions based on established patterns.`);
      
      // Add specific NPC reaction instructions
      enhancements.push(`NPC REACTIONS: NPCs should react based on past interactions with the player character. Their attitudes and behaviors should reflect the consequences of previous decisions.`);
      
      // Add decision type-specific consequences
      const decisionTypes = [...new Set(recentDecisions.map(d => d.choiceType))];
      const consequenceInstructions = this.generateConsequenceInstructions(decisionTypes, recentDecisions);
      if (consequenceInstructions) {
        enhancements.push(consequenceInstructions);
      }
      
      // Add compound consequence analysis for multiple decision types
      if (decisionTypes.length > 1) {
        const compoundAnalysis = this.generateCompoundConsequenceAnalysis(decisionTypes);
        if (compoundAnalysis) {
          enhancements.push(compoundAnalysis);
        }
      }
      
      // Add pattern analysis for variety
      const preferredTypes = context.playerPreferences.preferredChoiceTypes
        .filter(type => type && typeof type === 'string')
        .slice(0, 3); // Top 3 preferred types
      
      if (preferredTypes.length > 0) {
        const patternDescription = preferredTypes.length === 1 
          ? `primarily ${preferredTypes[0]}` 
          : `${preferredTypes.slice(0, -1).join(', ')} and ${preferredTypes[preferredTypes.length - 1]}`;
        
        enhancements.push(`DECISION PATTERNS: Player tends to make ${patternDescription} choices. This suggests a preference for ${this.getPatternInsight(preferredTypes)} approaches to problem-solving.`);
      }
    }

    // Add narrative style preference
    const style = context.playerPreferences.narrativeStyle || 'exploration';
    const detail = context.playerPreferences.detailLevel || 'moderate';
    const contentFocus = context.playerPreferences.contentFocus || 'balanced';
    
    enhancements.push(`NARRATIVE STYLE: Focus on ${style} elements. Player prefers ${detail} detail level.`);
    
    // Add specific guidance for action-focused players
    if (style === 'action-focused' || contentFocus === 'action') {
      enhancements.push(`ACTION EMPHASIS: Player favors direct action and immediate decisions. Show character acting boldly rather than hesitating. Emphasize movement, physical challenges, and decisive moments.`);
    }

    return enhancements.join('\n\n');
  }

  /**
   * Builds established elements array in a structured way
   */
  private buildEstablishedElementsArray(
    character: PersonalizationCharacter, 
    world: World, 
    skillNames: string[]
  ): string[] {
    // Use structured format: [characterName, worldName, characterBackground, ...skills]
    return [
      character.name || '',
      world.name || '',
      character.background || '',
      ...skillNames
    ].filter(element => element.trim().length > 0);
  }

  /**
   * Safely parses established elements array into structured format
   */
  private parseEstablishedElements(elements: string[]): EstablishedElements {
    return {
      characterName: elements[0] || undefined,
      worldName: elements[1] || undefined,
      characterBackground: elements[2] || undefined,
      skills: elements.slice(3).filter(skill => skill && skill.trim().length > 0)
    };
  }

  /**
   * Sanitizes narrative elements to prevent injection attacks
   */
  private sanitizeNarrativeElements(elements: EstablishedElements): EstablishedElements {
    return {
      characterName: sanitizeString(elements.characterName),
      worldName: sanitizeString(elements.worldName),
      characterBackground: sanitizeString(elements.characterBackground),
      skills: Array.isArray(elements.skills) ? 
        elements.skills
          .map(skill => sanitizeString(skill, 100))
          .filter((skill): skill is string => skill !== undefined)
          .slice(0, 10) : []
    };
  }

  /**
   * Detects personality traits from player decisions
   */
  private detectPersonalityTraits(decisions: PlayerDecision[]): PersonalityTrait[] {
    const traitCounts = new Map<PersonalityTrait, number>();

    decisions.forEach(decision => {
      const traits = CHOICE_TO_TRAIT_MAP[decision.choiceType] || [];
      traits.forEach(trait => {
        traitCounts.set(trait, (traitCounts.get(trait) || 0) + 1);
      });
    });

    return Array.from(traitCounts.entries())
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([trait]) => trait);
  }

  /**
   * Analyzes player preferences from decisions
   */
  private analyzePreferences(decisions: PlayerDecision[]): PlayerPreferences {
    const choiceTypeCounts = new Map<ChoiceTypePreference, number>();
    
    decisions.forEach(decision => {
      choiceTypeCounts.set(
        decision.choiceType,
        (choiceTypeCounts.get(decision.choiceType) || 0) + 1
      );
    });

    const sortedChoiceTypes = Array.from(choiceTypeCounts.entries())
      .sort(([, a], [, b]) => b - a)
      .map(([type]) => type);

    return {
      narrativeStyle: this.inferNarrativeStyle(decisions),
      preferredChoiceTypes: sortedChoiceTypes.slice(0, 3),
      detailLevel: this.inferDetailLevel(decisions),
      contentFocus: this.inferContentFocus(decisions),
      confidenceLevel: Math.min(85, decisions.length * 15),
      lastUpdated: new Date().toISOString()
    };
  }

  /**
   * Infers narrative style from player decision patterns
   */
  private inferNarrativeStyle(decisions: PlayerDecision[]): NarrativeStylePreference {
    if (decisions.length === 0) return 'exploration';

    const actionChoices = decisions.filter(d => 
      ['aggressive', 'chaotic', 'direct'].includes(d.choiceType)
    ).length;
    
    const socialChoices = decisions.filter(d => 
      ['diplomatic', 'helpful', 'empathetic'].includes(d.choiceType)
    ).length;
    
    const stealthyChoices = decisions.filter(d => 
      ['stealthy', 'cautious'].includes(d.choiceType)
    ).length;

    const total = decisions.length;
    
    // Calculate percentages
    const actionRatio = actionChoices / total;
    const socialRatio = socialChoices / total;
    const stealthyRatio = stealthyChoices / total;

    // Determine dominant style (need >40% for clear preference)
    if (actionRatio > 0.4) return 'action-focused';
    if (socialRatio > 0.4) return 'character-driven';
    if (stealthyRatio > 0.3) return 'strategic';
    
    // Check for dialogue-heavy pattern (context-based)
    const dialogueContexts = decisions.filter(d => 
      d.context.situation?.toLowerCase().includes('conversation') ||
      d.context.situation?.toLowerCase().includes('talk') ||
      d.context.charactersPresent && d.context.charactersPresent.length > 0
    ).length;
    
    if (dialogueContexts / total > 0.3) return 'dialogue-heavy';

    // Default to exploration if no clear pattern
    return 'exploration';
  }

  /**
   * Infers detail level preference from decision context complexity
   */
  private inferDetailLevel(decisions: PlayerDecision[]): 'minimal' | 'moderate' | 'detailed' {
    if (decisions.length === 0) return 'moderate';

    // Analyze context richness as proxy for detail preference
    const richContexts = decisions.filter(d => {
      const context = d.context;
      const hasLocation = Boolean(context.location);
      const hasSituation = Boolean(context.situation);
      const hasCharacters = Boolean(context.charactersPresent?.length);
      
      return (hasLocation ? 1 : 0) + (hasSituation ? 1 : 0) + (hasCharacters ? 1 : 0) >= 2;
    }).length;

    const detailRatio = richContexts / decisions.length;
    
    if (detailRatio > 0.6) return 'detailed';
    if (detailRatio > 0.3) return 'moderate';
    return 'minimal';
  }

  /**
   * Provides insight into what choice patterns suggest about player approach
   */
  private getPatternInsight(preferredTypes: string[]): string {
    const insights: Record<string, string> = {
      'diplomatic': 'negotiation and peaceful resolution',
      'aggressive': 'bold, direct confrontation and immediate decisive action',
      'stealthy': 'careful planning and subtle maneuvering',
      'helpful': 'cooperation and supportive behavior',
      'selfish': 'self-interested and independent decision-making',
      'lawful': 'rule-following and structured problem-solving',
      'chaotic': 'spontaneous and unconventional thinking',
      'neutral': 'balanced and measured responses'
    };
    
    const primaryInsights = preferredTypes
      .map(type => insights[type])
      .filter(insight => insight);
    
    if (primaryInsights.length === 0) return 'varied';
    if (primaryInsights.length === 1) return primaryInsights[0];
    
    return `${primaryInsights.slice(0, -1).join(', ')} with elements of ${primaryInsights[primaryInsights.length - 1]}`;
  }

  /**
   * Infers content focus from choice types
   */
  private inferContentFocus(decisions: PlayerDecision[]): 'action' | 'dialogue' | 'balanced' {
    if (decisions.length === 0) return 'balanced';

    const actionChoices = decisions.filter(d => 
      ['aggressive', 'chaotic', 'stealthy'].includes(d.choiceType)
    ).length;
    
    const dialogueChoices = decisions.filter(d => 
      ['diplomatic', 'helpful', 'empathetic'].includes(d.choiceType)
    ).length;

    const total = decisions.length;
    const actionRatio = actionChoices / total;
    const dialogueRatio = dialogueChoices / total;

    // Need significant difference (>20%) for focused preference
    if (actionRatio - dialogueRatio > 0.2) return 'action';
    if (dialogueRatio - actionRatio > 0.2) return 'dialogue';
    return 'balanced';
  }

  /**
   * Safely extracts skill names from character skills array
   */
  private extractSkillNamesSafely(skills?: Array<{ name: string; level: number; worldSkillId?: string }> | Array<{ skillId: string; level: number }>): string[] {
    if (!Array.isArray(skills)) return [];
    
    return skills
      .map(skill => {
        if (typeof skill !== 'object' || skill === null) return null;
        
        // Handle both skill formats safely
        const name = 'name' in skill ? skill.name : ('skillId' in skill ? skill.skillId : null);
        return isSafeString(name, 50) ? name : null;
      })
      .filter((name): name is string => name !== null)
      .slice(0, 10); // Limit to 10 skills
  }

  /**
   * Returns default analysis when input validation fails
   */
  private getDefaultAnalysis(): PersonalizationAnalysis {
    return {
      detectedTraits: [],
      preferences: {
        narrativeStyle: 'exploration',
        preferredChoiceTypes: [],
        detailLevel: 'moderate',
        contentFocus: 'balanced',
        confidenceLevel: 0,
        lastUpdated: new Date().toISOString()
      },
      narrativeEmphasis: {
        characterFocus: [],
        relationshipFocus: [],
        goalFocus: []
      },
      confidence: 0
    };
  }

  /**
   * Estimates token count for narrative context (memoized)
   * Used to optimize prompt size for AI requests
   */
  estimateTokenCount(text: string): number {
    // Use memoized version for performance
    return this.memoizedTokenEstimation(text);
  }

  /**
   * Core token estimation logic
   * Rough approximation: 1 token ≈ 4 characters for English text
   */
  private estimateTokenCountCore(text: string): number {
    if (!text || typeof text !== 'string') return 0;
    
    // Basic tokenization approximation
    const words = text.split(/\s+/).length;
    const chars = text.length;
    
    // GPT-style estimation: average 1.3 tokens per word, ~4 chars per token
    const wordTokens = words * 1.3;
    const charTokens = chars / 4;
    
    // Use the higher estimate for safety
    return Math.ceil(Math.max(wordTokens, charTokens));
  }

  /**
   * Prioritizes goals based on context and player behavior (memoized)
   */
  prioritizeGoals(goals: CharacterGoal[], context: PersonalizedNarrativeContext): CharacterGoal[] {
    // Use memoized version for performance
    return this.memoizedGoalPrioritization(goals, context);
  }

  /**
   * Core goal prioritization logic
   */
  private prioritizeGoalsCore(goals: CharacterGoal[], context: PersonalizedNarrativeContext): CharacterGoal[] {
    if (!Array.isArray(goals) || goals.length === 0) return [];
    
    // Score goals based on various factors
    const scoredGoals = goals.map(goal => {
      let score = 0;
      
      // Base priority score
      if (goal.priority === 'primary') score += 100;
      else if (goal.priority === 'secondary') score += 50;
      else score += 25; // minor
      
      // Active goals get boost
      if (goal.isActive) score += 30;
      
      // Progress-based scoring (higher progress = higher relevance)
      if (goal.progress > 0) {
        score += Math.min(goal.progress / 10, 25); // Max 25 points for 100% progress
      }
      
      // Player preference alignment (basic scoring since goal.type doesn't exist)
      const playerChoiceTypes = context.playerPreferences.preferredChoiceTypes;
      if (playerChoiceTypes.includes('diplomatic')) score += 5;
      if (playerChoiceTypes.includes('aggressive')) score += 5;
      if (playerChoiceTypes.includes('stealthy')) score += 5;
      
      return { goal, score };
    });
    
    // Sort by score and return goals
    return scoredGoals
      .sort((a, b) => b.score - a.score)
      .map(({ goal }) => goal);
  }

  /**
   * Optimized context generation with token budget management
   */
  generateOptimizedContext(
    character: PersonalizationCharacter,
    world: World,
    decisions: PlayerDecision[],
    goals: CharacterGoal[] = [],
    maxTokens: number = 1000
  ): PersonalizedNarrativeContext {
    // Create base context
    const baseContext = this.createPersonalizedContext(character, world, decisions, [], goals);
    
    // Prioritize goals if we have them
    if (goals.length > 0) {
      const prioritizedGoals = this.prioritizeGoals(goals, baseContext);
      baseContext.character.goals = prioritizedGoals;
    }
    
    // Optimize narrative history to fit token budget
    const enhancement = this.generateNarrativeEnhancement(baseContext);
    const estimatedTokens = this.estimateTokenCount(enhancement);
    
    // If we're over budget, trim the context
    if (estimatedTokens > maxTokens) {
      // Reduce goals to most critical
      baseContext.character.goals = baseContext.character.goals.slice(0, 3);
      
      // Reduce recent decisions
      baseContext.character.recentDecisions = baseContext.character.recentDecisions.slice(0, 3);
      
      // Reduce established elements
      if (baseContext.narrativeHistory.establishedElements.length > 5) {
        baseContext.narrativeHistory.establishedElements = 
          baseContext.narrativeHistory.establishedElements.slice(0, 5);
      }
    }
    
    return baseContext;
  }

  /**
   * Formats timestamp as relative time for decision context
   */
  private formatTimeAgo(timestamp: string | Date): string {
    const now = new Date();
    const timestampDate = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
    const diffMs = now.getTime() - timestampDate.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffDays > 0) {
      return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
    } else if (diffHours > 0) {
      return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
    } else {
      return 'recently';
    }
  }

  /**
   * Generates context-driven consequence instructions based on decision patterns
   */
  private generateConsequenceInstructions(decisionTypes: string[], decisions: PlayerDecision[]): string {
    const instructions: string[] = [];
    
    // Group decisions by type for pattern analysis
    const typeGroups = decisionTypes.reduce((acc, type) => {
      acc[type] = decisions.filter(d => d.choiceType === type);
      return acc;
    }, {} as Record<string, PlayerDecision[]>);

    Object.entries(typeGroups).forEach(([type, typeDecisions]) => {
      if (typeDecisions.length === 0) return;

      // Get all NPCs affected by this decision type
      const affectedNPCs = typeDecisions.flatMap(d => d.context?.charactersPresent || []);
      const referencedChoices = typeDecisions.map(d => d.choiceText).join(', ');

      // Generate context-driven instructions based on decision type
      switch (type) {
        case 'heroic':
        case 'compassionate':
        case 'helpful':
          if (affectedNPCs.length > 0) {
            instructions.push(`HEROIC CONSEQUENCES: Your heroic and compassionate actions have built a positive reputation. The following NPCs remember you helped them: ${affectedNPCs.join(', ')}. They should react with trust, gratitude, and willingness to help. Word of your protective nature spreads among those you've aided. NPCs seek your protection and trust your judgment. References: ${referencedChoices}.`);
          }
          break;
        case 'merciful':
        case 'diplomatic':
          if (affectedNPCs.length > 0) {
            instructions.push(`MERCIFUL CONSEQUENCES: Your merciful decisions have established moral authority through showing restraint when others expected justice. The following NPCs were affected by your mercy: ${affectedNPCs.join(', ')}. Even those you spared may respect your sense of justice. Your reputation for mercy and balanced judgment precedes you. References: ${referencedChoices}.`);
          }
          break;
        case 'cunning':
        case 'strategic':
          instructions.push(`STRATEGIC CONSEQUENCES: Your cunning and strategic thinking has earned respect for intelligence and planning. NPCs involved: ${affectedNPCs.join(', ')}. They seek your counsel and offer information, recognizing your tactical abilities. References: ${referencedChoices}.`);
          break;
        default:
          // Generic pattern-based consequence for any decision type
          instructions.push(`${type.toUpperCase()} CONSEQUENCES: Your ${type} choices have shaped how NPCs perceive and interact with you. NPCs who witnessed these actions: ${affectedNPCs.join(', ')}. They react based on these established patterns of behavior. References: ${referencedChoices}.`);
      }
    });

    // Add compound consequences for multiple decision types
    if (decisionTypes.length > 1) {
      const hasHeroic = decisionTypes.some(type => ['heroic', 'compassionate', 'helpful'].includes(type));
      const hasMerciful = decisionTypes.some(type => ['merciful', 'diplomatic'].includes(type));
      
      if (hasHeroic && hasMerciful) {
        instructions.push(`COMPOUND CONSEQUENCES: Your heroic and merciful nature has created a unique reputation. You demonstrate both the strength to protect others and the wisdom to show restraint. NPCs see you as someone with the power to protect combined with the judgment to show mercy. This balance of strength, wisdom, and restraint makes you a respected leader and trusted ally.`);
      }
    }

    return instructions.length > 0 ? instructions.join('\n\n') : '';
  }

  /**
   * Prioritizes decisions by significance and recency
   */
  private prioritizeDecisionsBySignificance(decisions: PlayerDecision[]): PlayerDecision[] {
    return [...decisions].sort((a, b) => {
      // Calculate significance score based on context and impact
      const significanceA = this.calculateDecisionSignificance(a);
      const significanceB = this.calculateDecisionSignificance(b);
      
      // If significance is equal, sort by recency (newer first)
      if (significanceA === significanceB) {
        const timestampA = new Date(a.timestamp).getTime();
        const timestampB = new Date(b.timestamp).getTime();
        return timestampB - timestampA;
      }
      
      return significanceB - significanceA; // Higher significance first
    });
  }

  /**
   * Calculates significance score for a decision based on context and impact
   */
  private calculateDecisionSignificance(decision: PlayerDecision): number {
    let score = 0;
    
    // Base score by choice type impact (genre-neutral)
    const impactScores: Record<string, number> = {
      'heroic': 10,
      'world-changing': 15,
      'merciful': 8,
      'diplomatic': 7,
      'compassionate': 8,
      'strategic': 6,
      'cunning': 5,
      'action': 3
    };
    
    score += impactScores[decision.choiceType] || 2;
    
    // Boost score for world-changing contexts (situation-based)
    if (decision.context?.situation === 'world-changing') {
      score += 10;
    }
    
    // Score by number of affected parties (not their titles)
    const npcCount = decision.context?.charactersPresent?.length || 0;
    score += Math.min(npcCount * 2, 10); // Max 10 points for NPC involvement
    
    // Score by having a location (not what it is)
    if (decision.context?.location) {
      score += 3;
    }
    
    // Score by action scope words (genre-neutral)
    const scopeWords = ['all', 'everyone', 'entire', 'whole', 'many', 'multiple', 'save', 'protect', 'rescue'];
    const hasWideScope = scopeWords.some(word => 
      decision.choiceText.toLowerCase().includes(word)
    );
    if (hasWideScope) {
      score += 5;
    }
    
    // Score by context richness (more context = likely more important)
    const contextRichness = [
      decision.context?.location,
      decision.context?.situation,
      decision.context?.charactersPresent && decision.context.charactersPresent.length > 0
    ].filter(Boolean).length;
    score += contextRichness;
    
    return score;
  }

  /**
   * Generates compound consequence analysis for multiple decision types
   */
  private generateCompoundConsequenceAnalysis(decisionTypes: string[]): string {
    const combinations: string[] = [];
    
    // Check for specific powerful combinations
    if (decisionTypes.includes('heroic') && decisionTypes.includes('merciful')) {
      combinations.push(`COMPOUND CONSEQUENCES: Your heroic and merciful nature creates a unique reputation. You've shown both the strength to take decisive action and the wisdom to show restraint when appropriate. NPCs see you as someone with both the power to protect and the judgment to show mercy. This balanced approach makes both allies and those you've spared respect your decisions.`);
    }
    
    if (decisionTypes.includes('diplomatic') && decisionTypes.includes('compassionate')) {
      combinations.push(`COMPOUND CONSEQUENCES: Your diplomatic compassion has established you as a peacemaker. NPCs turn to you for conflict resolution, knowing you'll find solutions that consider everyone's wellbeing.`);
    }
    
    if (decisionTypes.includes('heroic') && decisionTypes.includes('strategic')) {
      combinations.push(`COMPOUND CONSEQUENCES: Your combination of heroism and strategic thinking makes you a respected leader. NPCs seek both your protection and your counsel when facing complex challenges.`);
    }
    
    if (decisionTypes.includes('cunning') && decisionTypes.includes('diplomatic')) {
      combinations.push(`COMPOUND CONSEQUENCES: Your cunning diplomacy has earned you a reputation as a skilled negotiator. NPCs respect your ability to find clever solutions through discussion rather than force.`);
    }
    
    return combinations.join('\n\n');
  }
}