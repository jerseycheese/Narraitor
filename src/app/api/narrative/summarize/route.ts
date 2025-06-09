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
- 1-2 sentences maximum
- Past tense from player's perspective ("I did X" not "You did X")
- Focus on key actions, discoveries, or story events
- Be specific about what happened
- Avoid generic descriptions

EXAMPLES:
Good: "I discovered a hidden passage behind the bookshelf that led to an underground chamber."
Good: "I convinced the tavern keeper to give me information about the missing merchant."
Bad: "I explored the area and found something interesting."
Bad: "An event occurred at the location."

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