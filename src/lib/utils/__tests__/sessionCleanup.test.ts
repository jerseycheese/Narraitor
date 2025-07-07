import { cleanupSessionData } from '../sessionCleanup';
import { useNarrativeStore } from '@/state/narrativeStore';
import { useJournalStore } from '@/state/journalStore';
import { useSessionStore } from '@/state/sessionStore';

// Mock stores
jest.mock('@/state/narrativeStore');
jest.mock('@/state/journalStore');
jest.mock('@/state/sessionStore');

describe('sessionCleanup', () => {
  let mockClearSessionSegments: jest.Mock;
  let mockClearSessionDecisions: jest.Mock;
  let mockDeleteSessionEntries: jest.Mock;
  let mockDeleteSavedSession: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    mockClearSessionSegments = jest.fn();
    mockClearSessionDecisions = jest.fn();
    mockDeleteSessionEntries = jest.fn();
    mockDeleteSavedSession = jest.fn();

    (useNarrativeStore as unknown as { getState: jest.Mock }).getState = jest.fn().mockReturnValue({
      clearSessionSegments: mockClearSessionSegments,
      clearSessionDecisions: mockClearSessionDecisions,
    });

    (useJournalStore as unknown as { getState: jest.Mock }).getState = jest.fn().mockReturnValue({
      deleteSessionEntries: mockDeleteSessionEntries,
    });

    (useSessionStore as unknown as { getState: jest.Mock }).getState = jest.fn().mockReturnValue({
      deleteSavedSession: mockDeleteSavedSession,
    });
  });

  it('should clean up all related data when deleting a session', async () => {
    const sessionId = 'test-session-1';

    await cleanupSessionData(sessionId);

    expect(mockClearSessionSegments).toHaveBeenCalledWith(sessionId);
    expect(mockClearSessionDecisions).toHaveBeenCalledWith(sessionId);
    expect(mockDeleteSessionEntries).toHaveBeenCalledWith(sessionId);
    expect(mockDeleteSavedSession).toHaveBeenCalledWith(sessionId);
  });

  it('should handle errors during cleanup gracefully', async () => {
    const sessionId = 'test-session-1';
    
    // Mock console.error to prevent error logging during test
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    
    mockClearSessionSegments.mockImplementation(() => {
      throw new Error('Cleanup failed');
    });

    // Should not throw, but should still attempt other cleanup operations
    await expect(cleanupSessionData(sessionId)).resolves.toBeUndefined();

    expect(mockClearSessionSegments).toHaveBeenCalledWith(sessionId);
    expect(mockClearSessionDecisions).toHaveBeenCalledWith(sessionId);
    expect(mockDeleteSessionEntries).toHaveBeenCalledWith(sessionId);
    expect(mockDeleteSavedSession).toHaveBeenCalledWith(sessionId);
    expect(consoleSpy).toHaveBeenCalledWith('Error during session cleanup:', expect.any(Array));
    
    consoleSpy.mockRestore();
  });

  it('should clean up in the correct order to maintain data integrity', async () => {
    const sessionId = 'test-session-1';
    const callOrder: string[] = [];

    mockClearSessionSegments.mockImplementation(() => {
      callOrder.push('segments');
    });
    mockClearSessionDecisions.mockImplementation(() => {
      callOrder.push('decisions');
    });
    mockDeleteSessionEntries.mockImplementation(() => {
      callOrder.push('journal');
    });
    mockDeleteSavedSession.mockImplementation(() => {
      callOrder.push('session');
    });

    await cleanupSessionData(sessionId);

    // Verify cleanup order: related data first, then session record last
    expect(callOrder).toEqual(['segments', 'decisions', 'journal', 'session']);
  });
});