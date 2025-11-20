import { EntityID, ISODateString } from './common.types';

export interface StoryCheckpointEventPayload {
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
  events: StoryCheckpointEventPayload[];
  decisions?: StoryCheckpointDecisionPayload[];
  narrativeSummary?: string;
  currentLocation?: string;
  activeGoals?: string[];
  previousCheckpointSummary?: string;
}

export interface StoryCheckpointResponseBody {
  summary: string;
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
