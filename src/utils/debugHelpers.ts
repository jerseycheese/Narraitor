/**
 * Debug utilities for development and troubleshooting
 */

import { useSessionStore } from '@/state/sessionStore';
import { useNarrativeStore } from '@/state/narrativeStore';

/**
 * Manually fix narrative counts for all existing sessions
 * This is a debug utility to fix sessions when persistence isn't working properly
 */
export const fixNarrativeCountsManually = () => {
  const sessionStore = useSessionStore.getState();
  const narrativeStore = useNarrativeStore.getState();
  
  console.log('[DebugHelper] Fixing narrative counts manually...');
  console.log('[DebugHelper] Current saved sessions:', sessionStore.savedSessions);
  console.log('[DebugHelper] Current narrative segments:', narrativeStore.sessionSegments);
  
  const updatedSessions = { ...sessionStore.savedSessions };
  let hasUpdates = false;
  
  for (const sessionId of Object.keys(updatedSessions)) {
    const sessionSegments = narrativeStore.sessionSegments[sessionId] || [];
    const actualCount = sessionSegments.length;
    const currentCount = updatedSessions[sessionId].narrativeCount;
    
    console.log(`[DebugHelper] Session ${sessionId}: current=${currentCount}, actual=${actualCount}`);
    
    if (currentCount !== actualCount) {
      updatedSessions[sessionId] = {
        ...updatedSessions[sessionId],
        narrativeCount: actualCount
      };
      hasUpdates = true;
      console.log(`[DebugHelper] Updated session ${sessionId} count to ${actualCount}`);
    }
  }
  
  if (hasUpdates) {
    // Update the saved sessions via the store API
    // Note: useSessionStore.setState updates state in a type-safe way
    // without relying on any casts.
    useSessionStore.setState({ savedSessions: updatedSessions });
    console.log('[DebugHelper] ✅ Session counts updated successfully');
    return updatedSessions;
  } else {
    console.log('[DebugHelper] ℹ️ No updates needed');
    return sessionStore.savedSessions;
  }
};

/**
 * Create a test narrative segment for debugging
 */
export const createTestNarrativeSegment = (sessionId: string, content: string = 'Test narrative segment') => {
  const narrativeStore = useNarrativeStore.getState();
  
  console.log(`[DebugHelper] Creating test segment for session: ${sessionId}`);
  
  const segmentId = narrativeStore.addSegment(sessionId, {
    type: 'scene',
    content,
    timestamp: new Date(),
    updatedAt: new Date().toISOString(),
    metadata: {
      characterIds: [],
      location: 'Test Location',
      tags: []
    }
  });
  
  console.log(`[DebugHelper] Created segment: ${segmentId}`);
  return segmentId;
};

/**
 * Debug function to inspect current store states
 */
export const inspectStores = () => {
  const sessionStore = useSessionStore.getState();
  const narrativeStore = useNarrativeStore.getState();
  
  console.log('=== STORE DEBUG INFO ===');
  console.log('Session Store:', {
    savedSessions: sessionStore.savedSessions,
    currentSession: sessionStore.id,
    status: sessionStore.status
  });
  console.log('Narrative Store:', {
    sessionSegments: narrativeStore.sessionSegments,
    segments: Object.keys(narrativeStore.segments).length + ' total segments'
  });
  console.log('========================');
  
  return {
    sessionStore: sessionStore,
    narrativeStore: narrativeStore
  };
};

// Make functions available globally for console access
if (typeof window !== 'undefined') {
  (window as typeof window & { debugHelpers?: object }).debugHelpers = {
    fixNarrativeCountsManually,
    createTestNarrativeSegment,
    inspectStores
  };
}
