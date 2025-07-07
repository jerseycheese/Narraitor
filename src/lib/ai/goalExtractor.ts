// src/lib/ai/goalExtractor.ts

import { AIClient } from './types';
import { createDefaultGeminiClient } from './defaultGeminiClient';
import {
  NarrativeGoal,
  GoalExtractionRequest,
  GoalExtractionResult,
  GoalContext,
  GoalType,
  GoalPriority,
  GoalStatus,
} from '../../types/goal.types';
import { capitalize } from '@/lib/utils';

export class GoalExtractor {
  private geminiClient: AIClient;

  constructor(geminiClient?: AIClient) {
    this.geminiClient = geminiClient || createDefaultGeminiClient();
  }

  /**
   * Extract goals from narrative content using AI
   */
  async extractGoalsFromNarrative(
    request: GoalExtractionRequest
  ): Promise<GoalExtractionResult> {
    try {
      // Handle empty content
      if (!request.content?.trim()) {
        return {
          newGoals: [],
          updatedGoals: [],
          completedGoals: [],
          confidence: 0,
        };
      }

      // Build prompt for goal extraction
      const prompt = this.buildGoalExtractionPrompt(request);

      // Call AI service
      const response = await this.geminiClient.generateContent(prompt);

      if (!response.content) {
        return {
          newGoals: [],
          updatedGoals: [],
          completedGoals: [],
          confidence: 0,
        };
      }

      // Parse AI response
      return this.parseGoalExtractionResponse(response.content, request);
    } catch {
      return {
        newGoals: [],
        updatedGoals: [],
        completedGoals: [],
        confidence: 0,
      };
    }
  }

  /**
   * Detect if a goal has been completed based on narrative content
   */
  async detectGoalCompletion(
    goal: NarrativeGoal,
    narrativeContent: string
  ): Promise<boolean> {
    try {
      // Validate inputs
      if (!goal?.title || !narrativeContent?.trim()) {
        return false;
      }

      const prompt = this.buildCompletionDetectionPrompt(
        goal,
        narrativeContent
      );
      const response = await this.geminiClient.generateContent(prompt);

      if (!response.content) {
        return false;
      }

      // Parse completion response
      return this.parseCompletionResponse(response.content);
    } catch {
      return false;
    }
  }

  /**
   * Build goal context for AI prompts with token management
   */
  buildGoalContext(goals: NarrativeGoal[], maxTokens: number): GoalContext {
    if (!goals || goals.length === 0) {
      return {
        activeGoals: [],
        recentGoals: [],
        criticalGoals: [],
        contextText: '',
        tokenCount: 0,
      };
    }

    // Filter and sort goals by priority and recency
    const activeGoals = goals.filter((g) => g.status === 'active');
    const criticalGoals = activeGoals.filter((g) => g.priority === 'critical');
    const recentGoals = activeGoals
      .filter((g) => g.lastMentionedAt)
      .sort((a, b) => {
        const aTime = new Date(a.lastMentionedAt!).getTime();
        const bTime = new Date(b.lastMentionedAt!).getTime();
        return bTime - aTime;
      })
      .slice(0, 5);

    // Build context text prioritizing critical goals
    let contextText = '';
    let tokenCount = 0;
    const prioritizedGoals = [...criticalGoals];

    // Add high priority goals not already included
    const highPriorityGoals = activeGoals.filter(
      (g) =>
        g.priority === 'high' && !criticalGoals.some((cg) => cg.id === g.id)
    );
    prioritizedGoals.push(...highPriorityGoals);

    // Add medium priority goals if we have token budget
    const mediumPriorityGoals = activeGoals.filter(
      (g) =>
        g.priority === 'medium' &&
        !prioritizedGoals.some((pg) => pg.id === g.id)
    );
    prioritizedGoals.push(...mediumPriorityGoals);

    // Build context text within token limits
    for (const goal of prioritizedGoals) {
      const goalText = this.formatGoalForContext(goal);
      const goalTokens = this.estimateTokens(goalText);

      if (tokenCount + goalTokens <= maxTokens) {
        contextText += goalText;
        tokenCount += goalTokens;
      } else {
        break;
      }
    }

    return {
      activeGoals,
      recentGoals,
      criticalGoals,
      contextText,
      tokenCount,
    };
  }

  /**
   * Build prompt for goal extraction
   */
  private buildGoalExtractionPrompt(request: GoalExtractionRequest): string {
    const existingGoalsText =
      request.existingGoals && request.existingGoals.length > 0
        ? `\n\nEXISTING GOALS:\n${request.existingGoals.map((g) => `- ${g.title}: ${g.description}`).join('\n')}`
        : '';

    return `You are a goal extraction system. Analyze the following narrative content and extract goals, update existing goals, or mark goals as completed.

NARRATIVE CONTENT:
${request.content}${existingGoalsText}

Extract goals following these rules:
1. NEW GOALS: Identify explicit goals (clearly stated objectives) and implicit goals (implied by actions/context)
2. GOAL UPDATES: If existing goals are mentioned, update their progress or status
3. COMPLETED GOALS: Mark goals as completed if they are clearly achieved or abandoned
4. PRIORITY LEVELS: critical (urgent/life-threatening), high (important objectives), medium (standard goals), low (optional/minor)
5. GOAL TYPES: immediate (right now), quest (specific objectives), exploration (discovering), social (relationships), mystery (solving puzzles), survival (staying alive)

Respond with JSON in this exact format:
\`\`\`json
{
  "newGoals": [
    {
      "sessionId": "${request.sessionId}",
      "characterId": "${request.characterId || ''}",
      "worldId": "${request.worldId || ''}",
      "title": "Goal title",
      "description": "Goal description",
      "type": "quest|exploration|social|mystery|survival|immediate",
      "priority": "critical|high|medium|low",
      "status": "active",
      "mentionCount": 1,
      "keywords": ["keyword1", "keyword2"],
      "contextSummary": "Brief context for AI",
      "involvedCharacters": ["characterId"],
      "originSegmentId": "${request.segmentId}"
    }
  ],
  "updatedGoals": [
    {
      "goalId": "existing-goal-id",
      "updates": {
        "mentionCount": 2,
        "progressNotes": ["progress note"],
        "lastMentionedAt": "${new Date().toISOString()}",
        "completionMethod": "achieved|abandoned|superseded"
      }
    }
  ],
  "completedGoals": ["goal-id-1", "goal-id-2"],
  "confidence": 0.8
}
\`\`\``;
  }

  /**
   * Build prompt for completion detection
   */
  private buildCompletionDetectionPrompt(
    goal: NarrativeGoal,
    narrativeContent: string
  ): string {
    return `Analyze if this goal has been completed based on the narrative content.

GOAL: ${goal.title}
DESCRIPTION: ${goal.description}
TYPE: ${goal.type}
KEYWORDS: ${goal.keywords?.join(', ') || 'none'}

NARRATIVE CONTENT:
${narrativeContent}

Has this goal been completed? Consider:
- Explicit completion (goal clearly achieved)
- Implicit completion (goal no longer relevant/possible)
- Abandonment (goal given up or circumstances changed)

Respond with only: "COMPLETED" or "NOT_COMPLETED"`;
  }

  /**
   * Parse goal extraction response from AI
   */
  private parseGoalExtractionResponse(
    content: string,
    request: GoalExtractionRequest
  ): GoalExtractionResult {
    try {
      // Extract JSON from response
      const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/);
      if (!jsonMatch) {
        return this.createFallbackExtractionResult(request);
      }

      const parsed = JSON.parse(jsonMatch[1]);

      // Validate and clean the response
      const result: GoalExtractionResult = {
        newGoals: [],
        updatedGoals: [],
        completedGoals: [],
        confidence: Math.max(0, Math.min(1, parsed.confidence || 0)),
      };

      // Process new goals
      if (Array.isArray(parsed.newGoals)) {
        result.newGoals = parsed.newGoals
          .filter((g: Record<string, unknown>) => g.title && g.description)
          .map((g: Record<string, unknown>) => this.validateAndCleanGoal(g));
      }

      // Process updated goals
      if (Array.isArray(parsed.updatedGoals)) {
        result.updatedGoals = parsed.updatedGoals
          .filter((u: Record<string, unknown>) => u.goalId && u.updates)
          .map((u: Record<string, unknown>) => ({
            goalId: u.goalId,
            updates: this.validateGoalUpdates(
              u.updates as Record<string, unknown>
            ),
          }));
      }

      // Process completed goals
      if (Array.isArray(parsed.completedGoals)) {
        result.completedGoals = parsed.completedGoals.filter(
          (id: unknown) => typeof id === 'string'
        );
      }

      return result;
    } catch {
      return this.createFallbackExtractionResult(request);
    }
  }

  /**
   * Parse completion detection response
   */
  private parseCompletionResponse(content: string): boolean {
    const cleanContent = content.trim().toLowerCase();
    return (
      cleanContent.includes('completed') &&
      !cleanContent.includes('not_completed')
    );
  }

  /**
   * Create fallback extraction result using pattern matching
   */
  private createFallbackExtractionResult(
    request: GoalExtractionRequest
  ): GoalExtractionResult {
    const result: GoalExtractionResult = {
      newGoals: [],
      updatedGoals: [],
      completedGoals: [],
      confidence: 0.5,
    };

    const content = request.content.toLowerCase();

    // Simple pattern matching for common goal patterns
    if (
      content.includes('need to') ||
      content.includes('must') ||
      content.includes('should')
    ) {
      const goalTitle = this.extractGoalFromPattern(
        request.content,
        /(?:need to|must|should)\s+([^.!?]+)/i
      );
      if (goalTitle) {
        result.newGoals.push(this.createBasicGoal(goalTitle, request));
        result.confidence = 0.7;
      }
    }

    if (
      content.includes('investigate') ||
      content.includes('find') ||
      content.includes('search')
    ) {
      const goalTitle = this.extractGoalFromPattern(
        request.content,
        /(investigate|find|search)\s+([^.!?]+)/i
      );
      if (goalTitle) {
        result.newGoals.push(
          this.createBasicGoal(`${goalTitle}`, request, 'exploration')
        );
        result.confidence = 0.7;
      }
    }

    return result;
  }

  /**
   * Extract goal from pattern match
   */
  private extractGoalFromPattern(
    content: string,
    pattern: RegExp
  ): string | null {
    const match = content.match(pattern);
    return match ? match[1]?.trim() || match[2]?.trim() : null;
  }

  /**
   * Create basic goal from extracted text
   */
  private createBasicGoal(
    title: string,
    request: GoalExtractionRequest,
    type: GoalType = 'quest'
  ): Omit<NarrativeGoal, 'id' | 'createdAt' | 'updatedAt'> {
    return {
      sessionId: request.sessionId,
      characterId: request.characterId,
      worldId: request.worldId,
      title: capitalize(title),
      description: `${title} (extracted from narrative)`,
      type,
      priority: 'medium' as GoalPriority,
      status: 'active' as GoalStatus,
      mentionCount: 1,
      keywords: title.split(' ').filter((word) => word.length > 2),
      contextSummary: `Player needs to ${title}`,
      originSegmentId: request.segmentId,
    };
  }

  /**
   * Validate and clean goal data
   */
  private validateAndCleanGoal(
    goal: Record<string, unknown>
  ): Omit<NarrativeGoal, 'id' | 'createdAt' | 'updatedAt'> {
    const validTypes: GoalType[] = [
      'immediate',
      'quest',
      'exploration',
      'social',
      'mystery',
      'survival',
    ];
    const validPriorities: GoalPriority[] = [
      'low',
      'medium',
      'high',
      'critical',
    ];
    const validStatuses: GoalStatus[] = [
      'active',
      'completed',
      'abandoned',
      'blocked',
    ];

    return {
      sessionId: String(goal.sessionId || ''),
      characterId: goal.characterId as string | undefined,
      worldId: goal.worldId as string | undefined,
      title: (goal.title as string)?.trim() || 'Untitled Goal',
      description: (goal.description as string)?.trim() || 'No description',
      type: validTypes.includes(goal.type as GoalType)
        ? (goal.type as GoalType)
        : 'quest',
      priority: validPriorities.includes(goal.priority as GoalPriority)
        ? (goal.priority as GoalPriority)
        : 'medium',
      status: validStatuses.includes(goal.status as GoalStatus)
        ? (goal.status as GoalStatus)
        : 'active',
      mentionCount: Math.max(1, Number(goal.mentionCount) || 1),
      keywords: Array.isArray(goal.keywords)
        ? ((goal.keywords as unknown[]).filter(
            (k: unknown) => typeof k === 'string'
          ) as string[])
        : [],
      contextSummary: (goal.contextSummary as string)?.trim(),
      involvedCharacters: Array.isArray(goal.involvedCharacters)
        ? (goal.involvedCharacters as string[])
        : [],
      originSegmentId: goal.originSegmentId as string | undefined,
    };
  }

  /**
   * Validate goal updates
   */
  private validateGoalUpdates(
    updates: Record<string, unknown>
  ): Partial<NarrativeGoal> {
    const validUpdates: Partial<NarrativeGoal> = {};

    if (typeof updates.mentionCount === 'number') {
      validUpdates.mentionCount = Math.max(0, updates.mentionCount);
    }

    if (Array.isArray(updates.progressNotes)) {
      validUpdates.progressNotes = (updates.progressNotes as unknown[]).filter(
        (note: unknown) => typeof note === 'string'
      ) as string[];
    }

    if (updates.lastMentionedAt) {
      validUpdates.lastMentionedAt = new Date(
        updates.lastMentionedAt as string | number | Date
      );
    }

    if (
      ['achieved', 'abandoned', 'superseded'].includes(
        updates.completionMethod as string
      )
    ) {
      validUpdates.completionMethod = updates.completionMethod as
        | 'achieved'
        | 'abandoned'
        | 'superseded';
    }

    return validUpdates;
  }

  /**
   * Format goal for context string
   */
  private formatGoalForContext(goal: NarrativeGoal): string {
    const priority =
      goal.priority === 'critical'
        ? '[CRITICAL] '
        : goal.priority === 'high'
          ? '[HIGH] '
          : '';
    return `${priority}${goal.title}: ${goal.contextSummary || goal.description}\n`;
  }

  /**
   * Estimate token count for text (rough approximation)
   */
  private estimateTokens(text: string): number {
    return Math.ceil(text.split(/\s+/).length * 1.3);
  }
}

// Export singleton instance
export const goalExtractor = new GoalExtractor();

// Export createGeminiClient function for mocking compatibility
export function createGeminiClient() {
  return createDefaultGeminiClient();
}
