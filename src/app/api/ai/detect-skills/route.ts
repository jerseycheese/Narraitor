// src/app/api/ai/detect-skills/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { 
  handleRateLimiting, 
  validateAIRequest, 
  validateAPIKey, 
  makeGeminiRequest,
} from '../../../../utils/apiHelpers';

interface SkillDetectionRequest {
  text: string;
  availableSkills: Array<{
    id: string;
    name: string;
    description?: string;
  }>;
}

interface DetectedSkill {
  skillId: string;
  skillName: string;
  confidence: number;
  reasoning: string;
  suggestedDifficulty: number;
}

interface SkillDetectionResponse {
  detectedSkills: DetectedSkill[];
  error?: string;
  details?: string;
}

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const rateLimitResponse = handleRateLimiting(request);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    // Validate request
    const requestData = await validateAIRequest(request);
    if (!requestData || typeof requestData !== 'object' || !('text' in requestData) || !('availableSkills' in requestData)) {
      return NextResponse.json(
        { error: 'Text and availableSkills are required' },
        { status: 400 }
      );
    }

    const { text, availableSkills } = requestData as SkillDetectionRequest;

    // Validate API key
    const apiKey = validateAPIKey();
    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key not configured' },
        { status: 500 }
      );
    }

    // Create the skill detection prompt
    const skillsList = availableSkills
      .map(skill => `- ${skill.name} (${skill.id}): ${skill.description || 'General skill'}`)
      .join('\n');

    const prompt = `Analyze the following player action and determine which skills from the available list should be used, if any.

Player Action: "${text}"

Available Skills:
${skillsList}

Instructions:
1. Identify which skills are directly relevant to performing this action
2. Only suggest skills that are clearly needed for the action described
3. For each relevant skill, provide:
   - The skill ID from the list
   - Your confidence level (0.1 to 1.0)
   - Brief reasoning for why this skill is relevant
   - Suggested difficulty level (1-10, where 1 is trivial and 10 is extremely difficult)
4. If no skills are relevant, return an empty array
5. Respond with valid JSON only

Example response format:
{
  "detectedSkills": [
    {
      "skillId": "intimidation",
      "skillName": "Intimidation",
      "confidence": 0.9,
      "reasoning": "The action involves threatening or intimidating someone",
      "suggestedDifficulty": 4
    }
  ]
}`;

    // Make the AI request
    const response = await makeGeminiRequest(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent`,
      apiKey,
      {
        contents: [{
          parts: [{ text: prompt }]
        }],
        generationConfig: {
          temperature: 0.3, // Lower temperature for more consistent analysis
          topP: 1.0,
          topK: 40,
          maxOutputTokens: 1024
        }
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        { 
          error: `AI API failed: ${response.status} ${response.statusText}`,
          details: errorText
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    
    // Extract content from response
    if (!data.candidates || !data.candidates[0] || !data.candidates[0].content || !data.candidates[0].content.parts) {
      return NextResponse.json(
        { 
          error: 'No content in AI response',
          details: 'Missing candidates, content, or parts in response'
        },
        { status: 500 }
      );
    }

    const content = data.candidates[0].content.parts[0]?.text || '';

    try {
      // Parse the AI response as JSON
      const aiResult = JSON.parse(content);
      
      // Validate the response structure
      if (!aiResult.detectedSkills || !Array.isArray(aiResult.detectedSkills)) {
        throw new Error('Invalid response format from AI');
      }

      // Validate each detected skill
      const validatedSkills = aiResult.detectedSkills
        .filter((skill: unknown) => {
          const s = skill as Record<string, unknown>;
          return s.skillId && 
                 s.skillName && 
                 typeof s.confidence === 'number' &&
                 s.confidence >= 0.1 && 
                 s.confidence <= 1.0 &&
                 typeof s.suggestedDifficulty === 'number' &&
                 s.suggestedDifficulty >= 1 &&
                 s.suggestedDifficulty <= 10;
        })
        .map((skill: unknown) => {
          const s = skill as Record<string, unknown>;
          return {
            skillId: s.skillId as string,
            skillName: s.skillName as string,
            confidence: Math.round((s.confidence as number) * 100) / 100, // Round to 2 decimal places
            reasoning: (s.reasoning as string) || '',
            suggestedDifficulty: Math.round(s.suggestedDifficulty as number)
          };
        });

      const result: SkillDetectionResponse = {
        detectedSkills: validatedSkills
      };

      return NextResponse.json(result);

    } catch (parseError) {
      return NextResponse.json(
        { 
          error: 'Failed to parse AI response',
          details: parseError instanceof Error ? parseError.message : 'Parse error'
        },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Skill detection error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}