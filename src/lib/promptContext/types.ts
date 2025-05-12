export interface WorldContext {
  id: string;
  name?: string;
  genre?: string;
  description?: string;
  attributes?: AttributeDefinition[];
  skills?: SkillDefinition[];
}

export interface AttributeDefinition {
  id: string;
  name: string;
  description?: string;
  minValue?: number;
  maxValue?: number;
  defaultValue?: number;
}

export interface SkillDefinition {
  id: string;
  name: string;
  description?: string;
  relatedAttributes?: string[];
  minValue?: number;
  maxValue?: number;
  defaultValue?: number;
}

export interface CharacterContext {
  id: string;
  name?: string;
  level?: number;
  description?: string;
  attributes?: CharacterAttribute[];
  skills?: CharacterSkill[];
  inventory?: InventoryItem[];
}

export interface CharacterAttribute {
  attributeId: string;
  name: string;
  value: number;
}

export interface CharacterSkill {
  skillId: string;
  name: string;
  value: number;
}

export interface InventoryItem {
  id: string;
  name: string;
  equipped?: boolean;
  quantity?: number;
}

export interface ContextElement {
  type: string;
  content: string;
  tokens?: number;
  weight?: number;
  timestamp?: number;
  truncated?: boolean;
}

export interface ContextOptions {
  promptType?: string;
  world?: WorldContext | null;
  character?: CharacterContext | null;
  recentEvents?: string[];
  currentSituation?: string;
  tokenLimit?: number;
}

export interface PriorityWeights {
  [key: string]: number;
}
