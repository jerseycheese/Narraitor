import { NextRequest, NextResponse } from 'next/server';
import { createDefaultGeminiClient } from '@/lib/ai/defaultGeminiClient';

export async function POST(request: NextRequest) {
  try {
    const { content, type, location, instructions } = await request.json();

    if (!content) {
      return NextResponse.json(
        { error: 'Content is required' },
        { status: 400 }
      );
    }

    const geminiClient = createDefaultGeminiClient();
    
    const prompt = `${instructions}

NARRATIVE CONTENT TO SUMMARIZE:
${content}

CONTEXT:
- Type: ${type}
- Location: ${location || 'Unknown'}

REQUIREMENTS:
- 1 sentence maximum, 2 only if absolutely necessary
- Past tense from player's perspective (first or third person: "I did X" or "Someone got shot")
- Focus on key actions, discoveries, or story events only
- Be specific but concise about what happened
- Avoid sensory details (smells, sounds, textures, etc.)
- Avoid generic descriptions

EXAMPLES:
Good: "Found a hidden passage behind the bookshelf."
Good: "The tavern keeper revealed information about the missing merchant."
Good: "Someone got shot during the confrontation."
Bad: "I explored the dimly lit area, hearing strange echoes, and discovered something interesting that smelled musty."
Bad: "An event occurred at the location with various atmospheric details."

Summary:`;

    const response = await geminiClient.generateContent(prompt);
    
    if (!response.content) {
      return NextResponse.json(
        { error: 'Failed to generate summary' },
        { status: 500 }
      );
    }

    // Clean up the summary
    let summary = response.content.trim();
    
    // Remove any "Summary:" prefix if the AI included it
    summary = summary.replace(/^Summary:\s*/i, '');
    
    // Ensure it ends with proper punctuation
    if (!summary.match(/[.!?]$/)) {
      summary += '.';
    }

    return NextResponse.json({ summary });

  } catch (error) {
    console.error('Error generating journal summary:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}