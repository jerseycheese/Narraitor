import { LANGUAGE_COMPLEXITY_GUIDANCE } from '@/lib/ai/toneSettingsGuidance';

interface ComplexityMetrics {
  averageSentenceLength: number;
  longWordRatio: number;
  totalSentences: number;
  totalWords: number;
}

const LONG_WORD_LENGTH = 12;

function tokenizeSentences(text: string): string[] {
  return text
    .split(/[.!?]+\s+/)
    .map((sentence) => sentence.trim())
    .filter((sentence) => sentence.length > 0);
}

function tokenizeWords(sentence: string): string[] {
  return sentence
    .split(/[^A-Za-z0-9'-]+/)
    .map((word) => word.trim())
    .filter((word) => word.length > 0);
}

export function calculateComplexityMetrics(text: string): ComplexityMetrics {
  const sentences = tokenizeSentences(text);
  const totalSentences = sentences.length || 1;
  let totalWords = 0;
  let longWords = 0;

  sentences.forEach((sentence) => {
    const words = tokenizeWords(sentence);
    totalWords += words.length;
    words.forEach((word) => {
      if (word.length >= LONG_WORD_LENGTH) {
        longWords += 1;
      }
    });
  });

  const averageSentenceLength = totalWords / totalSentences || 0;
  const longWordRatio = totalWords === 0 ? 0 : longWords / totalWords;

  return {
    averageSentenceLength,
    longWordRatio,
    totalSentences,
    totalWords,
  };
}

export type LanguageComplexityLevel = 'simple' | 'moderate' | 'advanced' | 'literary';

export interface ComplexityEvaluation {
  passes: boolean;
  level: LanguageComplexityLevel;
  metrics: ComplexityMetrics;
  reasons?: string[];
}

const COMPLEXITY_THRESHOLDS: Record<LanguageComplexityLevel, {
  maxAverageSentence?: number;
  maxLongWordRatio?: number;
}> = {
  simple: {
    maxAverageSentence: 14,
    maxLongWordRatio: 0.05,
  },
  moderate: {
    maxAverageSentence: 20,
    maxLongWordRatio: 0.1,
  },
  advanced: {
    maxAverageSentence: 28,
    maxLongWordRatio: 0.18,
  },
  literary: {},
};

export function evaluateLanguageComplexity(
  text: string,
  level: LanguageComplexityLevel,
): ComplexityEvaluation {
  const metrics = calculateComplexityMetrics(text);
  const thresholds = COMPLEXITY_THRESHOLDS[level];
  const reasons: string[] = [];

  if (thresholds.maxAverageSentence !== undefined && metrics.averageSentenceLength > thresholds.maxAverageSentence) {
    reasons.push(
      `Average sentence length ${metrics.averageSentenceLength.toFixed(1)} exceeds ${thresholds.maxAverageSentence}.`,
    );
  }

  if (thresholds.maxLongWordRatio !== undefined && metrics.longWordRatio > thresholds.maxLongWordRatio) {
    reasons.push(
      `Long word ratio ${(metrics.longWordRatio * 100).toFixed(1)}% exceeds ${(thresholds.maxLongWordRatio * 100).toFixed(0)}%.`,
    );
  }

  return {
    passes: reasons.length === 0,
    level,
    metrics,
    reasons: reasons.length > 0 ? reasons : undefined,
  };
}

export function buildLanguageComplexityReminder(level: LanguageComplexityLevel): string {
  return `LANGUAGE COMPLEXITY GUIDANCE (${level.toUpperCase()}):\n${LANGUAGE_COMPLEXITY_GUIDANCE[level]}`;
}
