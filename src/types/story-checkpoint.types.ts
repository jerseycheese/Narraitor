import { EntityID, ISODateString } from './common.types';
import { ToneSettings } from './tone-settings.types';

interface StoryCheckpointEventPayload {
  id: EntityID;
  description: string;
  timestamp: ISODateString;
  characterId?: EntityID;
  characterName?: string;
  sessionId: EntityID;
}

export interface StoryCheckpointDecisionPayload {
  id: EntityID;
  text: string;
  consequence?: string;
  alignment?: string;
  timestamp?: ISODateString;
}

export interface StoryCheckpointRequestBody {
  worldId: EntityID;
  sessionId: EntityID;
  characterId?: EntityID;
  characterName?: string;
  events: StoryCheckpointEventPayload[];
  decisions?: StoryCheckpointDecisionPayload[];
  currentLocation?: string;
  activeGoals?: string[];
  previousSegments?: string[]; // Last 2-3 checkpoint segments for narrative continuity
  toneSettings?: ToneSettings;
}

export interface StoryCheckpointResponseBody {
  segment: string; // 50-75 word immutable segment about events in this checkpoint only
  highlights: string[];
  majorEvents: string[];
  characterDevelopment: string[];
  nextHooks: string[];
  themes?: string[];
  includedEvents: number;
  includedDecisions: number;
  lastEventTimestamp?: ISODateString;
  model?: string;
}
