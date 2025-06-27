// src/app/api/narrative/choices/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { 
  handleRateLimiting, 
  validateAIRequest, 
  validateAPIKey, 
  createRateLimitHeaders,
  getClientIP,
  makeGeminiRequest,
  getSafetySettingsFromPrompt
} from '../../../../utils/apiHelpers';
import { getUserFriendlyError } from '../../../../lib/utils/errorUtils';

interface ChoiceGenerateResponse {
  content: string;
  finishReason?: string;
  promptTokens?: number;
  completionTokens?: number;
  error?: string;
  details?: string;
  code?: string;
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
    if (!requestData) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      );
    }


    // Validate API key
    const apiKey = validateAPIKey();
    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key not configured' },
        { status: 500 }
      );
    }
    
    // Call Google's Gemini API from the server using secure header authentication
    const response = await makeGeminiRequest(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent`,
      apiKey,
      {
        contents: [{
          parts: [{ text: requestData.prompt }]
        }],
        generationConfig: {
          temperature: requestData.config?.temperature || 0.7,
          topP: 1.0,
          topK: 40,
          maxOutputTokens: requestData.config?.maxTokens || 2048
        },
        safetySettings: getSafetySettingsFromPrompt(requestData.prompt)
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      const apiError = new Error(`Gemini API failed: ${response.status} ${response.statusText}`);
      
      console.error('Gemini API Error:', {
        status: response.status,
        statusText: response.statusText,
        errorText: errorText
      });
      
      const userFriendlyError = getUserFriendlyError(apiError);
      
      return NextResponse.json(
        { 
          error: userFriendlyError.message,
          title: userFriendlyError.title,
          retryable: userFriendlyError.retryable,
          actionLabel: userFriendlyError.actionLabel,
          details: errorText
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    
    // Extract content from response
    if (!data.candidates || !data.candidates[0] || !data.candidates[0].content || !data.candidates[0].content.parts) {
      console.error('API Response structure issue:', {
        hasCandidates: !!data.candidates,
        candidatesLength: data.candidates?.length,
        hasFirstCandidate: !!data.candidates?.[0],
        hasContent: !!data.candidates?.[0]?.content,
        hasParts: !!data.candidates?.[0]?.content?.parts
      });
      
      return NextResponse.json(
        { 
          error: 'No content in API response',
          details: 'Missing candidates, content, or parts in response'
        },
        { status: 500 }
      );
    }

    const content = data.candidates[0].content.parts[0]?.text || '';
    const finishReason = data.candidates[0].finishReason || 'STOP';
    
    
    // Extract token usage if available
    const promptTokens = data.usageMetadata?.promptTokenCount || undefined;
    const completionTokens = data.usageMetadata?.candidatesTokenCount || undefined;

    const responseData: ChoiceGenerateResponse = {
      content,
      finishReason,
      promptTokens,
      completionTokens
    };

    return NextResponse.json(responseData, {
      headers: createRateLimitHeaders(getClientIP(request))
    });

  } catch (error) {
    console.error('Choice generation error:', error);
    
    const errorObj = error instanceof Error ? error : new Error('Unknown error occurred');
    const userFriendlyError = getUserFriendlyError(errorObj);
    
    return NextResponse.json(
      { 
        error: userFriendlyError.message,
        title: userFriendlyError.title,
        retryable: userFriendlyError.retryable,
        actionLabel: userFriendlyError.actionLabel,
        details: errorObj.message
      },
      { status: 500 }
    );
  }
}
