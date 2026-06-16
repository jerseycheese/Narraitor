import { Decision } from '../types/narrative.types';
import { EntityID } from '../types/common.types';
import { generateUniqueId } from '../lib/utils';
import { mapAlignmentToChoiceType } from '../lib/narrative/choiceType';
import { logger } from '../lib/utils/logger';
import { playerDecisionTracker } from '../lib/ai/playerDecisionTracker';
import { useWorldStore } from './worldStore';
import { useCharacterStore } from './characterStore';
import {
  extractWorldStateImpacts,
  extractDecisionContext,
  type DecisionWorldStatePayload,
} from './narrativeStore.worldStateImpacts';
import type { NarrativeStoreSet, NarrativeStoreGet } from './narrativeStore.types';

export const createNarrativeDecisionActions = (
  set: NarrativeStoreSet,
  get: NarrativeStoreGet
) => ({
  addDecision: (sessionId: EntityID, decisionData: Omit<Decision, 'id'>): EntityID => {
    const decisionId = generateUniqueId('decision');

    const newDecision: Decision = {
      ...decisionData,
      id: decisionId
    };

    set((state) => {
      // Initialize session decisions if not exists
      const sessionDecisions = state.sessionDecisions[sessionId] || [];

      return {
        decisions: {
          ...state.decisions,
          [decisionId]: newDecision,
        },
        sessionDecisions: {
          ...state.sessionDecisions,
          [sessionId]: [...sessionDecisions, decisionId],
        },
      };
    });

    return decisionId;
  },

  updateDecision: (decisionId: EntityID, updates: Partial<Decision>) => set((state) => {
    if (!state.decisions[decisionId]) {
      return { error: 'Decision not found' };
    }

    const updatedDecision: Decision = {
      ...state.decisions[decisionId],
      ...updates,
    };

    return {
      decisions: {
        ...state.decisions,
        [decisionId]: updatedDecision,
      },
      error: null,
    };
  }),

  selectDecisionOption: (decisionId: EntityID, optionId: EntityID, characterId?: EntityID) => {
    let worldStatePayload: DecisionWorldStatePayload | undefined;

    set((state) => {
      if (!state.decisions[decisionId]) {
        return { error: 'Decision not found' };
      }

      const decision = state.decisions[decisionId];
      const selectedOption = decision.options.find(opt => opt.id === optionId);

      if (!selectedOption) {
        return { error: 'Selected option not found' };
      }

      const updatedDecision: Decision = {
        ...decision,
        selectedOptionId: optionId,
        selectedAt: new Date(),
        characterId,
      };

      let sessionId: EntityID | null = null;
      let worldId: EntityID | null = null;

      try {
        for (const [sId, decisionIds] of Object.entries(state.sessionDecisions)) {
          if (decisionIds.includes(decisionId)) {
            sessionId = sId;
            break;
          }
        }

        if (sessionId) {
          const segmentIds = state.sessionSegments[sessionId] || [];
          for (const segmentId of segmentIds) {
            const segment = state.segments[segmentId];
            if (segment?.worldId) {
              worldId = segment.worldId;
              break;
            }
          }
        }

        if (sessionId && characterId) {
          const choiceType = mapAlignmentToChoiceType(selectedOption.alignment);

          const sessionSegmentIds = state.sessionSegments[sessionId] || [];
          const sessionSegments = sessionSegmentIds.map(id => state.segments[id]).filter(Boolean);
          const context = extractDecisionContext(decision.prompt, sessionSegments);

          playerDecisionTracker.recordDecision(
            decision.prompt,
            selectedOption.text,
            choiceType,
            sessionId,
            worldId || 'unknown-world',
            context
          );
        }
      } catch (error) {
        logger.warn('Failed to track player decision:', error);
      }

      if (sessionId && worldId) {
        const impacts = extractWorldStateImpacts(decision, selectedOption, characterId);

        // Gate NPC relationship updates on scene presence. An NPC counts as
        // present if its id appears in the latest segment's characterIds (the
        // same model useNarrativeParticipants uses for the Scene Status panel).
        const segmentIds = state.sessionSegments[sessionId] || [];
        const latestSegment = segmentIds.length
          ? state.segments[segmentIds[segmentIds.length - 1]]
          : undefined;
        const presentNpcIds = new Set<EntityID>([
          ...(latestSegment?.metadata?.characterIds ?? []),
          ...(latestSegment?.characterIds ?? []),
        ]);

        const gatedRelationships: Record<EntityID, typeof impacts.relationships[EntityID]> = {};
        for (const [npcId, update] of Object.entries(impacts.relationships)) {
          if (presentNpcIds.has(npcId as EntityID)) {
            gatedRelationships[npcId as EntityID] = update;
          } else {
            logger.warn(
              `Dropped relationship update for absent NPC "${npcId}" — not present in the current scene`
            );
          }
        }

        if (
          Object.keys(gatedRelationships).length > 0 ||
          impacts.events.length > 0 ||
          impacts.alignmentDelta !== 0
        ) {
          worldStatePayload = {
            worldId,
            sessionId,
            relationships: gatedRelationships,
            events: impacts.events,
            alignmentDelta: impacts.alignmentDelta,
          };
        }
      }

      return {
        decisions: {
          ...state.decisions,
          [decisionId]: updatedDecision,
        },
        error: null,
      };
    });

    const payload = worldStatePayload;
    if (payload) {
      if (Object.keys(payload.relationships).length > 0 || payload.events.length > 0) {
        try {
          useWorldStore.getState().updateWorldState(
            payload.worldId,
            {
              npcRelationships: payload.relationships,
              majorEvents: payload.events,
            },
            payload.sessionId
          );
        } catch (error) {
          logger.warn('Failed to apply world state update from decision', error);
        }
      }

      if (payload.alignmentDelta !== 0 && characterId) {
        try {
          useCharacterStore.getState().applyAlignmentShift(characterId, payload.alignmentDelta);
        } catch (error) {
          logger.warn('Failed to apply alignment shift from decision', error);
        }
      }
    }
  },

  getSessionDecisions: (sessionId: EntityID): Decision[] => {
    const state = get();
    const decisionIds = state.sessionDecisions[sessionId] || [];
    return decisionIds.map((id) => state.decisions[id]).filter(Boolean);
  },

  getLatestDecision: (sessionId: EntityID): Decision | null => {
    const state = get();
    const decisionIds = state.sessionDecisions[sessionId] || [];
    if (decisionIds.length === 0) return null;

    const latestDecisionId = decisionIds[decisionIds.length - 1];
    return state.decisions[latestDecisionId] || null;
  },

  clearSessionDecisions: (sessionId: EntityID) => {
    const state = get();
    const decisionIdsToRemove = state.sessionDecisions[sessionId] || [];

    if (decisionIdsToRemove.length === 0) return;

    // Remove decisions from the decisions record
    const updatedDecisions = { ...state.decisions };
    decisionIdsToRemove.forEach(id => {
      delete updatedDecisions[id];
    });

    // Remove session from sessionDecisions
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { [sessionId]: removedSession, ...remainingSessionDecisions } = state.sessionDecisions;

    set({
      decisions: updatedDecisions,
      sessionDecisions: remainingSessionDecisions
    });
  },
});
