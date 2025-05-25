// src/app/api/generate-portrait/route.ts

import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { prompt } = await request.json();
    
    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    
    if (!apiKey || apiKey === 'MOCK_API_KEY') {
      return NextResponse.json(
        { error: 'API key not configured' },
        { status: 500 }
      );
    }
    
    // Call Google's Gemini API from the server
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-preview-image-generation:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [
              { text: prompt }
            ]
          }],
          generationConfig: {
            responseModalities: ["TEXT", "IMAGE"]
          }
        })
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini API Error:', {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        errorText: errorText
      });
      
      return NextResponse.json(
        { 
          error: `Gemini API failed: ${response.status} ${response.statusText}`,
          details: errorText,
          apiEndpoint: `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-preview-image-generation:generateContent`
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    
    // Look for image in the response
    if (!data.candidates || !data.candidates[0] || !data.candidates[0].content || !data.candidates[0].content.parts) {
      console.error('API Response structure issue:', {
        hasCandidates: !!data.candidates,
        candidatesLength: data.candidates?.length,
        hasFirstCandidate: !!data.candidates?.[0],
        hasContent: !!data.candidates?.[0]?.content,
        hasParts: !!data.candidates?.[0]?.content?.parts,
        fullResponse: JSON.stringify(data, null, 2)
      });
      
      return NextResponse.json(
        { 
          error: 'No content in API response',
          details: 'Missing candidates, content, or parts in response'
        },
        { status: 500 }
      );
    }

    // Find the image part in the response
    type ContentPart = { text?: string; inlineData?: { mimeType?: string; data?: string } };
    const parts = data.candidates[0].content.parts as ContentPart[];
    const imagePart = parts.find((part) => 
      part.inlineData && 
      part.inlineData.mimeType && 
      part.inlineData.mimeType.startsWith('image/')
    );
    
    if (!imagePart) {
      console.error('No image part found in response:', {
        partsCount: parts.length,
        partTypes: parts.map((p) => {
          if ('text' in p) return 'text';
          if ('inlineData' in p && p.inlineData) return `inlineData(${p.inlineData.mimeType || 'no-mime'})`;
          return 'unknown';
        }),
        parts: parts
      });
      
      return NextResponse.json(
        { 
          error: 'No image found in API response',
          details: `Found ${parts.length} parts but no image data`
        },
        { status: 500 }
      );
    }

    // Return the image data (we already checked that inlineData exists above)
    const mimeType = imagePart.inlineData!.mimeType;
    const base64Data = imagePart.inlineData!.data;
    
    return NextResponse.json({
      image: `data:${mimeType};base64,${base64Data}`,
      prompt: prompt
    });

  } catch (error) {
    console.error('Portrait generation error:', error);
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}