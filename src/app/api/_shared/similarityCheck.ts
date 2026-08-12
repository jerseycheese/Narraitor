import { NextRequest, NextResponse } from 'next/server';
import { GeminiClient } from '@/lib/ai/geminiClient';
import { getDefaultConfig } from '@/lib/ai/config';
import { resolveApiKey } from '@/lib/ai/resolveApiKey';
import { resolveModel } from '@/lib/ai/resolveModel';
import { extractJsonObject } from '@/lib/ai/parseJSON';
import { reportServerError } from '@/lib/telemetry/reportServerError';

interface SimilarityLogger {
  warn: (...args: unknown[]) => void;
  error: (...args: unknown[]) => void;
}

interface SimilarityRequestBody {
  name1: string;
  name2: string;
  category?: string;
}

interface SimilarityCheckOptions {
  buildPrompt: (body: SimilarityRequestBody) => string;
  logger: SimilarityLogger;
  errorLogMessage: string;
  failureMessage: string;
  /** Literal path of the calling route, for the error report (#1641). */
  route: string;
}

export async function handleSimilarityCheck(
  request: NextRequest,
  {
    buildPrompt,
    logger,
    errorLogMessage,
    failureMessage,
    route,
  }: SimilarityCheckOptions
) {
  try {
    const body = await request.json() as SimilarityRequestBody;
    const { name1, name2 } = body;

    if (!name1 || !name2) {
      return NextResponse.json(
        { error: 'Both name1 and name2 are required' },
        { status: 400 }
      );
    }

    if (name1.trim().toLowerCase() === name2.trim().toLowerCase()) {
      return NextResponse.json({
        similar: true,
        confidence: 1.0,
        rationale: 'Exact match',
      });
    }

    const config = getDefaultConfig(resolveApiKey(request), resolveModel(request));
    const client = new GeminiClient(config);
    const response = await client.generateContent(buildPrompt(body));
    const text = response.content.trim();
    const json = extractJsonObject(text);

    if (json === null) {
      logger.warn('No JSON found in AI response:', text);
      return NextResponse.json({
        similar: false,
        confidence: 0.0,
        rationale: 'Could not parse AI response',
      });
    }

    const parsed = JSON.parse(json);

    return NextResponse.json({
      similar: parsed.similar ?? false,
      confidence: parsed.confidence ?? 0.0,
      rationale: parsed.rationale,
    });
  } catch (error) {
    logger.error(errorLogMessage, error);
    reportServerError(error, { source: 'route', route });

    return NextResponse.json(
      {
        error: failureMessage,
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
