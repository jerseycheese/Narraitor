import type { StoryCheckpointRequestBody } from '@/types/story-checkpoint.types';

interface BuildStoryCheckpointPayloadParams {
  worldId: string;
  sessionId: string;
  characterId?: string;
  events: StoryCheckpointRequestBody['events'];
  decisions?: StoryCheckpointRequestBody['decisions'];
  narrativeSummary?: string;
  currentLocation?: string;
  activeGoals?: string[];
}

export const buildStoryCheckpointPayload = ({
  worldId,
  sessionId,
  characterId,
  events,
  decisions,
  narrativeSummary,
  currentLocation,
  activeGoals,
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
    narrativeSummary: narrativeSummary || undefined,
    currentLocation: currentLocation || undefined,
    activeGoals: normalizedGoals && normalizedGoals.length > 0 ? normalizedGoals : undefined,
  };
};
