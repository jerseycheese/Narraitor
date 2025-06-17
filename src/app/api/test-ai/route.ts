import { NextRequest, NextResponse } from 'next/server';
import { analyzeWorldDescription } from '@/lib/ai/worldAnalyzer';

export async function POST(request: NextRequest) {
  try {
    console.log('test-ai API: Starting test');
    
    const testDescription = "A magical fantasy world filled with ancient forests, mystical creatures, and powerful wizards who guard ancient secrets.";
    
    console.log('test-ai API: Testing with description:', testDescription);
    
    const result = await analyzeWorldDescription(testDescription);
    
    console.log('test-ai API: Analysis result:', {
      attributeCount: result.attributes.length,
      skillCount: result.skills.length,
      firstAttribute: result.attributes[0]?.name
    });
    
    return NextResponse.json({
      success: true,
      result,
      message: 'AI analysis test completed successfully'
    });
    
  } catch (error) {
    console.error('test-ai API: Error during test:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      details: error
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Use POST to test AI analysis',
    testDescription: 'Send POST request to test the AI world analyzer'
  });
}