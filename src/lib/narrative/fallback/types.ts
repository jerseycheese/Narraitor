export interface FallbackContent {
  id: string;
  type: 'scene' | 'transition' | 'choice' | 'initial';
  themes: string[]; // Compatible world themes
  tags: string[]; // Context tags for matching
  content: string;
  choices?: FallbackChoice[];
  weight?: number; // Selection probability (default: 1)
  requirements?: ContentRequirements;
}

export interface FallbackChoice {
  text: string;
  outcome: string;
  tags: string[]; // Tags added to context after selection
}

export interface ContentRequirements {
  includeTags?: string[]; // Must have ALL these tags in context
  excludeTags?: string[]; // Must NOT have ANY of these tags
  minSegments?: number; // Minimum segments in session before eligible
  maxSegments?: number; // Maximum segments (for early-game content)
}

export interface FallbackMetadata {
  isAIGenerated: boolean;
  fallbackReason?: 'service_unavailable' | 'timeout' | 'error' | 'rate_limit';
  timestamp: string;
  contentId: string;
  retryAttempts?: number;
}

export interface ContentSelectionCriteria {
  type: string;
  theme: string;
  tags: string[];
  segmentCount: number;
  recentlyUsedIds: string[];
}

export interface FallbackContentRepository {
  content: FallbackContent[];
  lastUpdated: string;
  version: string;
}