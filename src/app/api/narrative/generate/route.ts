// src/app/api/narrative/generate/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getUserFriendlyError } from '@/lib/utils/errorUtils';

import { 
  handleRateLimiting, 
  validateAIRequest, 
  validateAPIKey, 
  createRateLimitHeaders,
  getClientIP,
  makeGeminiRequest,
  getSafetySettingsFromPrompt
} from '../../../../utils/apiHelpers';

interface NarrativeGenerateResponse {
  content: string;
  finishReason?: string;
  promptTokens?: number;
  completionTokens?: number;
  // Standardized error response fields
  error?: string;
  title?: string;
  type?: string;
  retryable?: boolean;
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
    if (!requestData) {
      const validationError = getUserFriendlyError(new Error('400 bad request: prompt is required'));
      return NextResponse.json(
        { 
          error: validationError.message,
          title: validationError.title,
          type: validationError.type,
          retryable: validationError.retryable
        },
        { status: 400 }
      );
    }

    // Validate API key
    const apiKey = validateAPIKey();
    if (!apiKey) {
      const serviceError = getUserFriendlyError(new Error('Service configuration error: API key not configured'));
      return NextResponse.json(
        { 
          error: serviceError.message,
          title: serviceError.title,
          type: serviceError.type,
          retryable: serviceError.retryable
        },
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
          maxOutputTokens: requestData.config?.maxTokens || 1024
        },
        safetySettings: getSafetySettingsFromPrompt(requestData.prompt)
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini API Error:', {
        status: response.status,
        statusText: response.statusText,
        errorText: errorText
      });

      // Create appropriate error based on status code
      const apiError = response.status === 429 
        ? getUserFriendlyError(new Error('429 rate limit exceeded'))
        : response.status === 401 
        ? getUserFriendlyError(new Error('401 unauthorized'))
        : getUserFriendlyError(new Error(`Service error: ${response.status} ${response.statusText}`));
      
      return NextResponse.json(
        { 
          error: apiError.message,
          title: apiError.title,
          type: apiError.type,
          retryable: apiError.retryable,
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

      const responseError = getUserFriendlyError(new Error('Service error: malformed API response'));
      return NextResponse.json(
        { 
          error: responseError.message,
          title: responseError.title,
          type: responseError.type,
          retryable: responseError.retryable,
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

    const responseData: NarrativeGenerateResponse = {
      content,
      finishReason,
      promptTokens,
      completionTokens
    };

    return NextResponse.json(responseData, {
      headers: createRateLimitHeaders(getClientIP(request))
    });

  } catch (error) {
    console.error('Narrative generation error:', error);
    
    const friendlyError = getUserFriendlyError(error instanceof Error ? error : new Error('Unknown error occurred'));
    return NextResponse.json(
      { 
        error: friendlyError.message,
        title: friendlyError.title,
        type: friendlyError.type,
        retryable: friendlyError.retryable,
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
