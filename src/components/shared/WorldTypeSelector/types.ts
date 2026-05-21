type WorldType = 'original' | 'inspired_by' | 'set_within';

export interface WorldTypeData {
  worldType: WorldType;
  worldReference: string;
  additionalDetails: string;
}

export interface WorldTypeOption {
  id: WorldType;
  label: string;
  description: string;
  requiresReference: boolean;
  referenceLabel?: string;
  referencePlaceholder?: string;
  additionalDetailsLabel?: string;
  additionalDetailsPlaceholder?: string;
}

export interface WorldGenerationParams {
  reference?: string;
  relationship?: 'inspired_by' | 'set_within';
}