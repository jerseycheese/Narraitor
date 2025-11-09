// src/app/api/narrative/generate/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { createAPIErrorResponse } from '@/lib/utils/errorUtils';

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
      return createAPIErrorResponse(
        new Error('400 bad request: prompt is required'),
        400
      );
    }

    // Validate API key
    const apiKey = validateAPIKey();
    if (!apiKey) {
      return createAPIErrorResponse(
        new Error('Service configuration error: API key not configured'),
        500
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
        ? new Error('429 rate limit exceeded')
        : response.status === 401
        ? new Error('401 unauthorized')
        : new Error(`Service error: ${response.status} ${response.statusText}`);

      return createAPIErrorResponse(apiError, response.status, errorText);
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

      return createAPIErrorResponse(
        new Error('Service error: malformed API response'),
        500,
        'Missing candidates, content, or parts in response'
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

    return createAPIErrorResponse(
      error instanceof Error ? error : new Error('Unknown error occurred'),
      500,
      error instanceof Error ? error.message : 'Unknown error'
    );
  }
}
