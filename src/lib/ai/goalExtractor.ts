// src/lib/ai/goalExtractor.ts

import { AIClient } from './types';
import { createDefaultGeminiClient } from './defaultGeminiClient';
import { extractFencedJson } from './parseJSON';
import {
  NarrativeGoal,
  GoalExtractionRequest,
  GoalExtractionResult,
  GoalType,
  GoalPriority,
  GoalStatus,
} from '../../types/goal.types';
import { capitalize, formatDateTime } from '@/lib/utils';
import {
  buildWorldThreadPromptSection,
  parseWorldThreadExtraction,
} from './worldThreadExtraction';
import { buildWorldCostPromptSection, parseWorldCostExtraction } from './worldCostExtraction';

// Created on first use, not at import time — the class singleton used to
// construct a client as a module side effect.
let defaultClient: AIClient | null = null;
const getClient = (): AIClient => (defaultClient ??= createDefaultGeminiClient());

/**
 * Extract goals from narrative content using AI
 */
export async function extractGoalsFromNarrative(
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
    const prompt = buildGoalExtractionPrompt(request);

    // Call AI service
    const response = await getClient().generateContent(prompt);

    if (!response.content) {
      return {
        newGoals: [],
        updatedGoals: [],
        completedGoals: [],
        confidence: 0,
      };
    }

    // Parse AI response
    return parseGoalExtractionResponse(response.content, request);
  } catch {
    return {
      newGoals: [],
      updatedGoals: [],
      completedGoals: [],
      confidence: 0,
    };
  }
}

function buildGoalExtractionPrompt(request: GoalExtractionRequest): string {
  const existingGoalsText =
    request.existingGoals && request.existingGoals.length > 0
      ? `\n\nEXISTING GOALS:\n${request.existingGoals.map((g) => `- ${g.title}: ${g.description}`).join('\n')}`
      : '';

  // Both are empty strings when no ledger rides along, so the prompt stays
  // byte-identical for callers that never heard of the world clock.
  const worldThreadSection = request.worldThreads
    ? `\n\n${buildWorldThreadPromptSection(request.worldThreads)}`
    : '';
  const worldThreadSkeleton = request.worldThreads
    ? `,
  "worldThreads": {
    "opened": [{ "kind": "consequence|actor|deadline", "summary": "...", "dueByTurn": 12 }],
    "advanced": [{ "id": "thread-id", "note": "..." }],
    "resolved": [{ "id": "thread-id", "resolution": "...", "outcome": "resolved|dropped" }]
  }`
    : '';

  // Same shape as the ledger: both empty unless the request carries the input.
  const worldCostSection = request.worldCost
    ? `\n\n${buildWorldCostPromptSection(request.worldCost)}`
    : '';
  const worldCostSkeleton = request.worldCost
    ? `,
  "worldCost": {
    "imposed": [{ "kind": "condition|item", "detail": "...", "threadId": "thread-id or null" }],
    "cleared": ["condition text"],
    "fatal": false
  }`
    : '';

  return `You are a goal extraction system. Analyze the following narrative content and extract goals, update existing goals, or mark goals as completed.

NARRATIVE CONTENT:
${request.content}${existingGoalsText}

Extract goals following these rules:
1. NEW GOALS: Identify explicit goals (clearly stated objectives) and implicit goals (implied by actions/context)
2. GOAL UPDATES: If existing goals are mentioned, update their progress or status
3. COMPLETED GOALS: Mark goals as completed if they are clearly achieved or abandoned
4. PRIORITY LEVELS: critical (urgent/life-threatening), high (important objectives), medium (standard goals), low (optional/minor)
5. GOAL TYPES: immediate (right now), quest (specific objectives), exploration (discovering), social (relationships), mystery (solving puzzles), survival (staying alive)${worldThreadSection}${worldCostSection}

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
        "lastMentionedAt": "${formatDateTime(new Date())}",
        "completionMethod": "achieved|abandoned|superseded"
      }
    }
  ],
  "completedGoals": ["goal-id-1", "goal-id-2"],
  "confidence": 0.8${worldThreadSkeleton}${worldCostSkeleton}
}
\`\`\``;
}

function parseGoalExtractionResponse(
  content: string,
  request: GoalExtractionRequest
): GoalExtractionResult {
  try {
    // Extract JSON from the fenced block; fall back when absent.
    const jsonStr = extractFencedJson(content);
    if (jsonStr === null) {
      return createFallbackExtractionResult(request);
    }

    const parsed = JSON.parse(jsonStr);

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
        .map((g: Record<string, unknown>) => validateAndCleanGoal(g));
    }

    // Process updated goals
    if (Array.isArray(parsed.updatedGoals)) {
      result.updatedGoals = parsed.updatedGoals
        .filter((u: Record<string, unknown>) => u.goalId && u.updates)
        .map((u: Record<string, unknown>) => ({
          goalId: u.goalId,
          updates: validateGoalUpdates(
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

    if (request.worldThreads) {
      result.worldThreads = parseWorldThreadExtraction(parsed.worldThreads);
    }

    if (request.worldCost) {
      result.worldCost = parseWorldCostExtraction(parsed.worldCost);
    }

    return result;
  } catch {
    return createFallbackExtractionResult(request);
  }
}

/**
 * Create fallback extraction result using pattern matching
 */
function createFallbackExtractionResult(
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
    const goalTitle = extractGoalFromPattern(
      request.content,
      /(?:need to|must|should)\s+([^.!?]+)/i
    );
    if (goalTitle) {
      result.newGoals.push(createBasicGoal(goalTitle, request));
      result.confidence = 0.7;
    }
  }

  if (
    content.includes('investigate') ||
    content.includes('find') ||
    content.includes('search')
  ) {
    const goalTitle = extractGoalFromPattern(
      request.content,
      /(investigate|find|search)\s+([^.!?]+)/i
    );
    if (goalTitle) {
      result.newGoals.push(
        createBasicGoal(`${goalTitle}`, request, 'exploration')
      );
      result.confidence = 0.7;
    }
  }

  return result;
}

function extractGoalFromPattern(
  content: string,
  pattern: RegExp
): string | null {
  const match = content.match(pattern);
  return match ? match[1]?.trim() || match[2]?.trim() : null;
}

function createBasicGoal(
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

function validateAndCleanGoal(
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

function validateGoalUpdates(
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
