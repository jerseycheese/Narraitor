// src/app/api/narrative/generate/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { globalRateLimiter, RateLimiter } from '@/utils/rateLimiter';

interface NarrativeGenerateRequest {
  prompt: string;
  config?: {
    maxTokens?: number;
    temperature?: number;
  };
}

interface NarrativeGenerateResponse {
  content: string;
  finishReason?: string;
  promptTokens?: number;
  completionTokens?: number;
  error?: string;
}

/**
 * Get client IP address from request headers
 */
function getClientIP(request: NextRequest): string {
  // Check various headers that might contain the real IP
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    request.headers.get('cf-connecting-ip') ||
    request.ip ||
    'unknown'
  );
}

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const clientIP = getClientIP(request);
    const rateLimitResult = globalRateLimiter.checkLimit(clientIP);
    
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { 
          error: RateLimiter.getErrorMessage(rateLimitResult.resetTime),
          code: 'RATE_LIMIT_EXCEEDED'
        },
        { 
          status: 429,
          headers: {
            'X-RateLimit-Limit': '50',
            'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
            'X-RateLimit-Reset': Math.ceil(rateLimitResult.resetTime / 1000).toString()
          }
        }
      );
    }

    const { prompt, config }: NarrativeGenerateRequest = await request.json();
    
    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY;
    
    if (!apiKey || apiKey === 'MOCK_API_KEY') {
      return NextResponse.json(
        { error: 'API key not configured' },
        { status: 500 }
      );
    }
    
    // Call Google's Gemini API from the server
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: prompt }]
          }],
          generationConfig: {
            temperature: config?.temperature || 0.7,
            topP: 1.0,
            topK: 40,
            maxOutputTokens: config?.maxTokens || 2048
          },
          safetySettings: [
            { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
            { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
            { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
            { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' }
          ]
        })
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini API Error:', {
        status: response.status,
        statusText: response.statusText,
        errorText: errorText
      });
      
      return NextResponse.json(
        { 
          error: `Gemini API failed: ${response.status} ${response.statusText}`,
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

    const responseData: NarrativeGenerateResponse = {
      content,
      finishReason,
      promptTokens,
      completionTokens
    };

    return NextResponse.json(responseData, {
      headers: {
        'X-RateLimit-Limit': '50',
        'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
        'X-RateLimit-Reset': Math.ceil(rateLimitResult.resetTime / 1000).toString()
      }
    });

  } catch (error) {
    console.error('Narrative generation error:', error);
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}