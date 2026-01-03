import type { GeneratedCharacterMetadata } from '@/types/narrative.types';
import type { InventoryAcquisitionMethod } from '@/types/inventory.types';

export interface NarrativeExtractedMetadata {
  location?: string;
  mood?:
    | 'tense'
    | 'relaxed'
    | 'mysterious'
    | 'action'
    | 'emotional'
    | 'neutral';
  tags?: string[];
  characterIds?: string[];
  speakerId?: string;
  itemsAcquired?: Array<{
    name: string;
    description?: string;
    quantity?: number;
    acquisitionMethod?: InventoryAcquisitionMethod;
  }>;
  characters?: GeneratedCharacterMetadata[];
  majorEvent?: string;
}

export interface ParsedNarrativeResponse {
  actualContent: string;
  segmentType: string;
  extractedMetadata: NarrativeExtractedMetadata;
}
