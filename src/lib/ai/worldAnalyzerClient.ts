// Client-side world analyzer that calls the secure API endpoint
import Logger from '@/lib/utils/logger';
import { WorldAnalysisResult } from './worldAnalyzer';

const logger = new Logger('WorldAnalyzerClient');

export async function analyzeWorldDescriptionClient(description: string): Promise<WorldAnalysisResult> {
  logger.debug('analyzeWorldDescriptionClient called with:', description.substring(0, 50) + '...');
  
  try {
    const response = await fetch('/api/ai/analyze-world', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ description }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      logger.error('API request failed:', errorData);
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    const analysis = await response.json() as WorldAnalysisResult;
    logger.debug('Analysis received from API:', analysis);
    
    // Validate that we got actual AI-generated content
    if (analysis.attributes && analysis.attributes.length > 3) {
      logger.debug('AI analysis successful - returning generated suggestions');
      return analysis;
    }
    
    // If we got a minimal response, it might be the default fallback
    logger.warn('Received minimal analysis response, may be fallback data');
    return analysis;
  } catch (error) {
    logger.error('Error in analyzeWorldDescriptionClient:', error);
    
    // Re-throw the error instead of masking it with defaults
    // This allows the WorldCreationWizard to handle the retry logic properly
    throw error;
  }
}