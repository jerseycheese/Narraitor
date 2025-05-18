import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    apiKeyExists: !!process.env.NEXT_PUBLIC_GEMINI_API_KEY,
    apiKeyPrefix: process.env.NEXT_PUBLIC_GEMINI_API_KEY?.substring(0, 10),
    nodeEnv: process.env.NODE_ENV,
  });
}