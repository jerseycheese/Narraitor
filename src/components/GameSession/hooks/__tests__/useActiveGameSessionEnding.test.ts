import { renderHook, act } from '@testing-library/react';
import { useActiveGameSessionEnding } from '../useActiveGameSessionEnding';
import { createMockWorld, createMockCharacter } from '@/lib/test-utils';

const mockWorld = createMockWorld({
  id: 'world-1',
  name: 'Test World',
  description: 'Test World Description',
});

const mockCharacter = createMockCharacter({
  id: 'char-1',
  name: 'Test Hero',
  worldId: 'world-1',
});

describe('useActiveGameSessionEnding (#2168)', () => {
  const sessionId = 'session-1';

  it('triggers generateEnding exactly once with desiredTone: tragic on a fatal suggestion', async () => {
    const generateEnding = jest.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() =>
      useActiveGameSessionEnding({
        sessionId,
        characterId: mockCharacter.id,
        world: mockWorld,
        character: mockCharacter,
        generateEnding,
      })
    );

    act(() => {
      result.current.handleEndingSuggested(
        'fatal: narrative segment marked the player as dead or incapacitated.',
        'story-complete'
      );
    });

    expect(result.current.isFatalEnding).toBe(true);
    expect(result.current.showEndingSuggestion).toBe(false);
    expect(generateEnding).toHaveBeenCalledTimes(1);
    expect(generateEnding).toHaveBeenCalledWith('story-complete', {
      sessionId,
      characterId: mockCharacter.id,
      worldId: mockWorld.id,
      world: mockWorld,
      character: mockCharacter,
      desiredTone: 'tragic',
    });

    // Calling it again does not trigger duplicate generation
    act(() => {
      result.current.handleEndingSuggested(
        'fatal: narrative segment marked the player as dead or incapacitated.',
        'story-complete'
      );
    });

    expect(generateEnding).toHaveBeenCalledTimes(1);
  });

  it('shows the soft offer banner and does not generate an ending on non-fatal suggestions', () => {
    const generateEnding = jest.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() =>
      useActiveGameSessionEnding({
        sessionId,
        characterId: mockCharacter.id,
        world: mockWorld,
        character: mockCharacter,
        generateEnding,
      })
    );

    act(() => {
      result.current.handleEndingSuggested(
        'Your story reaches a natural resting place.',
        'story-complete'
      );
    });

    expect(result.current.isFatalEnding).toBe(false);
    expect(result.current.showEndingSuggestion).toBe(true);
    expect(result.current.endingSuggestionReason).toBe(
      'Your story reaches a natural resting place.'
    );
    expect(generateEnding).not.toHaveBeenCalled();

    // Rejecting the suggestion hides the offer
    act(() => {
      result.current.handleRejectEndingSuggestion();
    });

    expect(result.current.showEndingSuggestion).toBe(false);
  });
});
