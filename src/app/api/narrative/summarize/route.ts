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
- Provide a JSON response with summary, entryType, and significance
- Summary: 1 sentence maximum, 2 only if absolutely necessary
- Past tense from player's perspective (first or third person: "I did X" or "Someone got shot")
- Focus on key actions, discoveries, or story events only
- Be specific but concise about what happened
- Avoid sensory details (smells, sounds, textures, etc.)
- Avoid generic descriptions

ENTRY TYPES:
- "discovery": Finding items, locations, secrets, information
- "character_event": Conversations, meetings, interactions with people
- "achievement": Completing quests, major accomplishments, victories
- "world_event": Environmental changes, events happening around the character

SIGNIFICANCE LEVELS:
- "minor": Routine events, small conversations, basic exploration
- "major": Important discoveries, key conversations, significant achievements, plot-critical events

EXAMPLES:
{
  "summary": "Found a hidden passage behind the bookshelf.",
  "entryType": "discovery",
  "significance": "major"
}

{
  "summary": "The tavern keeper revealed information about the missing merchant.",
  "entryType": "character_event", 
  "significance": "major"
}

{
  "summary": "Someone got shot during the confrontation.",
  "entryType": "world_event",
  "significance": "major"
}

{
  "summary": "Bought supplies from the general store.",
  "entryType": "discovery",
  "significance": "minor"
}

Response (JSON only):`;

    const response = await geminiClient.generateContent(prompt);
    
    if (!response.content) {
      return NextResponse.json(
        { error: 'Failed to generate summary' },
        { status: 500 }
      );
    }

    // Try to parse the JSON response
    try {
      let jsonContent = response.content.trim();
      
      // Remove any markdown code blocks if present
      if (jsonContent.includes('```json')) {
        jsonContent = jsonContent.replace(/```json\s*/, '').replace(/\s*```/, '');
      } else if (jsonContent.includes('```')) {
        jsonContent = jsonContent.replace(/```\s*/, '').replace(/\s*```/, '');
      }
      
      const parsed = JSON.parse(jsonContent);
      
      // Validate the response structure
      if (!parsed.summary || !parsed.entryType || !parsed.significance) {
        throw new Error('Invalid response structure');
      }
      
      // Validate entryType
      const validTypes = ['discovery', 'character_event', 'achievement', 'world_event'];
      if (!validTypes.includes(parsed.entryType)) {
        parsed.entryType = 'character_event'; // Default fallback
      }
      
      // Validate significance
      const validSignificance = ['minor', 'major'];
      if (!validSignificance.includes(parsed.significance)) {
        parsed.significance = 'minor'; // Default fallback
      }
      
      // Clean up the summary
      let summary = parsed.summary.trim();
      summary = summary.replace(/^Summary:\s*/i, '');
      if (!summary.match(/[.!?]$/)) {
        summary += '.';
      }
      
      return NextResponse.json({
        summary,
        entryType: parsed.entryType,
        significance: parsed.significance
      });
      
    } catch (parseError) {
      console.warn('Failed to parse AI JSON response, falling back to text-only:', parseError);
      
      // Fallback to text-only response
      let summary = response.content.trim();
      summary = summary.replace(/^Summary:\s*/i, '');
      if (!summary.match(/[.!?]$/)) {
        summary += '.';
      }
      
      return NextResponse.json({
        summary,
        entryType: 'character_event',
        significance: 'minor'
      });
    }

  } catch (error) {
    console.error('Error generating journal summary:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}