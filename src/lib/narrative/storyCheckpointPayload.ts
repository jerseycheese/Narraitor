import type { StoryCheckpointRequestBody } from '@/types/story-checkpoint.types';

interface BuildStoryCheckpointPayloadParams {
  worldId: string;
  sessionId: string;
  characterId?: string;
  characterName?: string;
  events: StoryCheckpointRequestBody['events'];
  decisions?: StoryCheckpointRequestBody['decisions'];
  currentLocation?: string;
  activeGoals?: string[];
  previousSegments?: string[];
  toneSettings?: StoryCheckpointRequestBody['toneSettings'];
}

export const buildStoryCheckpointPayload = ({
  worldId,
  sessionId,
  characterId,
  characterName,
  events,
  decisions,
  currentLocation,
  activeGoals,
  previousSegments,
  toneSettings,
}: BuildStoryCheckpointPayloadParams): StoryCheckpointRequestBody => {
  const normalizedGoals = activeGoals
    ?.map((goal) => goal.trim())
    .filter((goal) => goal.length > 0);

  return {
    worldId,
    sessionId,
    characterId,
    events,
    decisions: decisions ?? [],
    currentLocation: currentLocation || undefined,
    activeGoals: normalizedGoals && normalizedGoals.length > 0 ? normalizedGoals : undefined,
    characterName: characterName || undefined,
    previousSegments: previousSegments && previousSegments.length > 0 ? previousSegments : undefined,
    toneSettings: toneSettings || undefined,
  };
};
