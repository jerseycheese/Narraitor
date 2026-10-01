import type { GeneratedCharacterMetadata, LostItemMetadata } from '@/types/narrative.types';
import type { InventoryAcquisitionMethod, StandardInventoryCategory } from '@/types/inventory.types';

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
  sceneEntries?: string[];
  sceneExits?: string[];
  sceneTransition?: { to: string };
  sceneBeat?: { id: string; text: string };
  speakerId?: string;
  itemsAcquired?: Array<{
    name: string;
    description?: string;
    quantity?: number;
    acquisitionMethod?: InventoryAcquisitionMethod;
    categoryHint?: StandardInventoryCategory;
  }>;
  itemsLost?: LostItemMetadata[];
  characters?: GeneratedCharacterMetadata[];
  majorEvent?: string;
}

export interface ParsedNarrativeResponse {
  actualContent: string;
  segmentType: string;
  extractedMetadata: NarrativeExtractedMetadata;
}
