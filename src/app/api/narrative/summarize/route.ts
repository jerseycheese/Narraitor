import { NextRequest, NextResponse } from 'next/server';
import { createDefaultGeminiClient } from '@/lib/ai/defaultGeminiClient';

export async function POST(request: NextRequest) {
  try {
    const { content, type, location, instructions, decisionWeight } = await request.json();

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
- Narrative Segment Type: ${type} (scene/dialogue/action/transition/ending)
- Location: ${location || 'Unknown'}
- Decision Weight: ${decisionWeight || 'Unknown'} (minor=routine choice, major=important choice, critical=game-changing choice)

REQUIREMENTS:
- Provide a JSON response with summary, entryType, and significance
- Summary: 1 sentence maximum, 2 only if absolutely necessary
- Past tense from player's perspective (first or third person: "I did X" or "Someone got shot")
- Focus on key actions, discoveries, or story events only
- Be specific but concise about what happened
- Avoid sensory details (smells, sounds, textures, etc.)
- Avoid generic descriptions

ENTRY TYPES (established taxonomy - choose based on narrative segment type and content):
- "character_event": Personal actions, conversations, interactions, decisions by the player character (maps to: dialogue, action segments where player acts)
- "world_event": Environmental changes, other people's actions, events the character witnesses but doesn't directly cause (maps to: scene, action segments where others act)
- "discovery": Finding items, locations, secrets, learning information (maps to: scene segments with new locations/items)
- "achievement": Completing objectives, major accomplishments, victories, resolving situations (maps to: ending segments, major quest completions)
- "relationship_change": Changes in relationships with other characters (maps to: dialogue segments with relationship impact)

SIGNIFICANCE LEVELS (must align with decision weight):
- "minor": Routine tasks, small mistakes, basic interactions (corresponds to minor decision weight)
- "major": Plot developments, conflicts, discoveries, important events (corresponds to major decision weight)  
- "critical": Life-changing decisions, story climax, major consequences, pivotal moments (corresponds to critical decision weight)

EXAMPLES:
{
  "summary": "Chose to sacrifice myself to save the village.",
  "entryType": "character_event",
  "significance": "critical"
}

{
  "summary": "Discovered the truth about my father's death.",
  "entryType": "discovery", 
  "significance": "critical"
}

{
  "summary": "Found a hidden passage behind the bookshelf.",
  "entryType": "discovery",
  "significance": "major"
}

{
  "summary": "Confronted the manager about working conditions.",
  "entryType": "character_event", 
  "significance": "major"
}

{
  "summary": "Gained Sam's respect through excellent cooking.",
  "entryType": "relationship_change",
  "significance": "major"
}

{
  "summary": "The kitchen caught fire during rush hour.",
  "entryType": "world_event",
  "significance": "major"
}

{
  "summary": "Completed the dinner rush successfully.",
  "entryType": "achievement",
  "significance": "major"
}

{
  "summary": "Filled the fryer with oil as ordered.",
  "entryType": "character_event",
  "significance": "minor"
}

{
  "summary": "Sam criticized the cooking technique.",
  "entryType": "world_event",
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
      const validTypes = ['discovery', 'character_event', 'achievement', 'world_event', 'relationship_change'];
      if (!validTypes.includes(parsed.entryType)) {
        parsed.entryType = 'character_event'; // Default fallback
      }
      
      // Validate significance
      const validSignificance = ['minor', 'major', 'critical'];
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
      
      // Use decision weight as significance fallback instead of hardcoding 'minor'
      let fallbackSignificance: 'minor' | 'major' | 'critical' = 'minor';
      if (decisionWeight === 'critical') {
        fallbackSignificance = 'critical';
      } else if (decisionWeight === 'major') {
        fallbackSignificance = 'major';
      }
      
      return NextResponse.json({
        summary,
        entryType: 'character_event',
        significance: fallbackSignificance
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