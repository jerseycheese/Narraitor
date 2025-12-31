import { NextResponse } from 'next/server';

export async function GET() {
  // Restrict debug endpoint to development only
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: 'Debug endpoint not available in production' },
      { status: 404 }
    );
  }

  return NextResponse.json({
    apiKeyExists: !!process.env.GEMINI_API_KEY,
    apiKeyPrefix: process.env.GEMINI_API_KEY?.substring(0, 10),
    nodeEnv: process.env.NODE_ENV,
    security: 'server-side-only'
  });
}
