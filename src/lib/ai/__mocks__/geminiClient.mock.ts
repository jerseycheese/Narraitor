// src/lib/ai/__mocks__/geminiClient.mock.ts

import { createMockResponse } from './mockUtils';
import { getTimestamp } from '@/lib/utils/timestamp';

/**
 * Mock Gemini client for testing
 * Detects goal extraction prompts and returns appropriate JSON responses
 */
export class MockGeminiClient {
  generateContent = typeof jest !== 'undefined'
    ? jest.fn().mockImplementation(async (prompt: string) => {
        return createMockResponse({ content: this.getMockContent(prompt) });
      })
    : async (prompt: string) => createMockResponse({ content: this.getMockContent(prompt) });

  private getMockContent(prompt: string): string {
    // Detect goal extraction prompts
    if (prompt.includes('goal extraction') || prompt.includes('Extract goals')) {
      return this.handleGoalExtraction(prompt);
    }

    // Detect goal completion prompts
    if (prompt.includes('Has this goal been completed') || prompt.includes('COMPLETED" or "NOT_COMPLETED')) {
      return this.handleGoalCompletion(prompt);
    }

    // Default response for other prompts
    return 'Generated test content';
  }

  private handleGoalExtraction(prompt: string): string {
    const content = prompt.toLowerCase();
    const worldThreads = this.buildWorldThreadsBlock(prompt);

    // Extract IDs from the prompt
    const sessionIdMatch = prompt.match(/"sessionId":\s*"([^"]+)"/);
    const characterIdMatch = prompt.match(/"characterId":\s*"([^"]+)"/);
    const segmentIdMatch = prompt.match(/"originSegmentId":\s*"([^"]+)"/);
    const worldIdMatch = prompt.match(/"worldId":\s*"([^"]+)"/);

    const sessionId = sessionIdMatch ? sessionIdMatch[1] : 'session-123';
    const characterId = characterIdMatch ? characterIdMatch[1] : 'char-789';
    const segmentId = segmentIdMatch ? segmentIdMatch[1] : 'segment-456';
    const worldId = worldIdMatch ? worldIdMatch[1] : 'world-101';

    // Handle goal update scenario
    if (content.includes('peer into the hole') && content.includes('light flickering')) {
      return `\`\`\`json
{
  "newGoals": [],
  "updatedGoals": [
    {
      "goalId": "goal-456",
      "updates": {
        "mentionCount": 2,
        "progressNotes": ["light flickering"],
        "lastMentionedAt": "${getTimestamp()}"
      }
    }
  ],
  "completedGoals": [],
  "confidence": 0.85${worldThreads}
}
\`\`\``;
    }

    // Handle completion scenario
    if (content.includes('insert the key') && content.includes('door creaks open')) {
      return `\`\`\`json
{
  "newGoals": [],
  "updatedGoals": [
    {
      "goalId": "goal-123",
      "updates": {
        "completionMethod": "achieved"
      }
    }
  ],
  "completedGoals": ["goal-123"],
  "confidence": 0.9${worldThreads}
}
\`\`\``;
    }

    // Handle hole in wall scenario
    if (content.includes('hole in the wall') && content.includes('investigate')) {
      return `\`\`\`json
{
  "newGoals": [
    {
      "sessionId": "${sessionId}",
      "characterId": "${characterId}",
      "worldId": "${worldId}",
      "title": "investigate the mysterious hole",
      "description": "Found a hole in the wall that needs investigation",
      "type": "exploration",
      "priority": "medium",
      "status": "active",
      "mentionCount": 1,
      "keywords": ["hole", "wall", "investigate"],
      "contextSummary": "Player needs to investigate the mysterious hole",
      "involvedCharacters": ["${characterId}"],
      "originSegmentId": "${segmentId}"
    }
  ],
  "updatedGoals": [],
  "completedGoals": [],
  "confidence": 0.8${worldThreads}
}
\`\`\``;
    }

    // Handle rusty key scenario
    if (content.includes('rusty key') && content.includes('examine')) {
      return `\`\`\`json
{
  "newGoals": [
    {
      "sessionId": "${sessionId}",
      "characterId": "${characterId}",
      "worldId": "${worldId}",
      "title": "Find what the key unlocks",
      "description": "Discovered a rusty key with strange markings",
      "type": "quest",
      "priority": "medium",
      "status": "active",
      "mentionCount": 1,
      "keywords": ["key", "unlock", "door"],
      "contextSummary": "Player found mysterious key and needs to find what it unlocks",
      "involvedCharacters": ["${characterId}"],
      "originSegmentId": "${segmentId}"
    }
  ],
  "updatedGoals": [],
  "completedGoals": [],
  "confidence": 0.75${worldThreads}
}
\`\`\``;
    }

    // Handle multiple goals scenario
    if (content.includes('three tasks') && content.includes('artifact') && content.includes('daughter')) {
      return `\`\`\`json
{
  "newGoals": [
    {
      "sessionId": "${sessionId}",
      "characterId": "${characterId}",
      "worldId": "${worldId}",
      "title": "Find the stolen artifact",
      "description": "Merchant asked to recover stolen artifact",
      "type": "quest",
      "priority": "medium",
      "status": "active",
      "mentionCount": 1,
      "keywords": ["artifact", "stolen", "find"],
      "contextSummary": "Merchant wants player to find stolen artifact",
      "involvedCharacters": ["${characterId}"],
      "originSegmentId": "${segmentId}"
    },
    {
      "sessionId": "${sessionId}",
      "characterId": "${characterId}",
      "worldId": "${worldId}",
      "title": "Rescue the merchant's daughter",
      "description": "Save daughter from bandits",
      "type": "quest",
      "priority": "medium",
      "status": "active",
      "mentionCount": 1,
      "keywords": ["daughter", "rescue", "bandits"],
      "contextSummary": "Merchant wants player to rescue his daughter from bandits",
      "involvedCharacters": ["${characterId}"],
      "originSegmentId": "${segmentId}"
    },
    {
      "sessionId": "${sessionId}",
      "characterId": "${characterId}",
      "worldId": "${worldId}",
      "title": "Deliver message to neighboring village",
      "description": "Carry message to nearby village",
      "type": "quest",
      "priority": "medium",
      "status": "active",
      "mentionCount": 1,
      "keywords": ["message", "deliver", "village"],
      "contextSummary": "Merchant wants player to deliver message to neighboring village",
      "involvedCharacters": ["${characterId}"],
      "originSegmentId": "${segmentId}"
    }
  ],
  "updatedGoals": [],
  "completedGoals": [],
  "confidence": 0.9${worldThreads}
}
\`\`\``;
    }

    // Handle urgency scenario
    if (content.includes('building is on fire') && content.includes('find sarah')) {
      return `\`\`\`json
{
  "newGoals": [
    {
      "sessionId": "${sessionId}",
      "characterId": "${characterId}",
      "worldId": "${worldId}",
      "title": "Find Sarah before smoke gets too thick",
      "description": "Building is on fire, must find Sarah immediately",
      "type": "survival",
      "priority": "critical",
      "status": "active",
      "mentionCount": 1,
      "keywords": ["sarah", "fire", "find", "smoke"],
      "contextSummary": "URGENT: Building on fire, must find Sarah immediately",
      "involvedCharacters": ["${characterId}"],
      "originSegmentId": "${segmentId}"
    },
    {
      "sessionId": "${sessionId}",
      "characterId": "${characterId}",
      "worldId": "${worldId}",
      "title": "Return book to library",
      "description": "Need to return book to library today",
      "type": "quest",
      "priority": "low",
      "status": "active",
      "mentionCount": 1,
      "keywords": ["book", "library", "return"],
      "contextSummary": "Player needs to return book to library",
      "involvedCharacters": ["${characterId}"],
      "originSegmentId": "${segmentId}"
    }
  ],
  "updatedGoals": [],
  "completedGoals": [],
  "confidence": 0.85${worldThreads}
}
\`\`\``;
    }

    // Default empty response for unrecognized content
    return `\`\`\`json
{
  "newGoals": [],
  "updatedGoals": [],
  "completedGoals": [],
  "confidence": 0${worldThreads}
}
\`\`\``;
  }

  // The world clock rides along on goal extraction; when the prompt carries
  // the ledger heading, echo a plausible block back so callers can see it
  // round-trip. Returned as a trailing JSON member (leading comma included) so
  // every branch above can splice it in after "confidence".
  private buildWorldThreadsBlock(prompt: string): string {
    if (!prompt.includes('WORLD CLOCK LEDGER')) return '';

    const opened = prompt.includes('SEEDING')
      ? '[{ "kind": "deadline", "summary": "The council vote is in six weeks", "dueByTurn": 30 }]'
      : '[]';
    const threadIdMatch = prompt.match(/\[(thread-[\w-]+)\]/);
    const advanced = threadIdMatch
      ? `[{ "id": "${threadIdMatch[1]}", "note": "The pressure tightened while the player was elsewhere" }]`
      : '[]';

    return `,
  "worldThreads": { "opened": ${opened}, "advanced": ${advanced}, "resolved": [] }`;
  }

  private handleGoalCompletion(prompt: string): string {
    const content = prompt.toLowerCase();

    // Check for completion indicators
    if (content.includes('chest opens') || content.includes('satisfying click')) {
      return 'COMPLETED';
    }

    if (content.includes('tavern burns down') || content.includes('electrical fault')) {
      return 'COMPLETED';
    }

    if (content.includes('practice') && content.includes('fire spell') && content.includes('flame')) {
      return 'NOT_COMPLETED';
    }

    // Default to not completed
    return 'NOT_COMPLETED';
  }
}
