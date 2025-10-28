import { renderHook, act } from '@testing-library/react';
import { useChunkedContent } from './useChunkedContent';

describe('useChunkedContent', () => {
  const testContent = 'First sentence here. Second sentence here. Third sentence here. Fourth sentence here.';

  it('initially shows only the first chunk', () => {
    const { result } = renderHook(() =>
      useChunkedContent(testContent, { minWordsPerChunk: 1 })
    );

    expect(result.current.visibleCount).toBe(1);
    expect(result.current.visibleChunks).toHaveLength(1);
    expect(result.current.hasMore).toBe(true);
    expect(result.current.isComplete).toBe(false);
  });

  it('reveals the next chunk when revealNext is called', () => {
    const { result } = renderHook(() =>
      useChunkedContent(testContent, { minWordsPerChunk: 1 })
    );

    act(() => {
      result.current.revealNext();
    });

    expect(result.current.visibleCount).toBe(2);
    expect(result.current.visibleChunks).toHaveLength(2);
  });

  it('reveals all chunks when revealAll is called', () => {
    const { result } = renderHook(() =>
      useChunkedContent(testContent, { minWordsPerChunk: 1 })
    );

    const totalChunks = result.current.totalCount;

    act(() => {
      result.current.revealAll();
    });

    expect(result.current.visibleCount).toBe(totalChunks);
    expect(result.current.isComplete).toBe(true);
    expect(result.current.hasMore).toBe(false);
  });

  it('resets to initial state when reset is called', () => {
    const { result } = renderHook(() =>
      useChunkedContent(testContent, { minWordsPerChunk: 1 })
    );

    act(() => {
      result.current.revealAll();
    });

    expect(result.current.isComplete).toBe(true);

    act(() => {
      result.current.reset();
    });

    expect(result.current.visibleCount).toBe(1);
    expect(result.current.hasMore).toBe(true);
    expect(result.current.isComplete).toBe(false);
  });

  it('calculates progress correctly', () => {
    const { result } = renderHook(() =>
      useChunkedContent(testContent, { minWordsPerChunk: 1 })
    );

    const totalChunks = result.current.totalCount;

    // Initial progress
    expect(result.current.progress).toBe(Math.round((1 / totalChunks) * 100));

    // Reveal half
    const halfWay = Math.floor(totalChunks / 2);
    act(() => {
      for (let i = 1; i < halfWay; i++) {
        result.current.revealNext();
      }
    });

    expect(result.current.progress).toBeGreaterThan(0);
    expect(result.current.progress).toBeLessThan(100);

    // Complete
    act(() => {
      result.current.revealAll();
    });

    expect(result.current.progress).toBe(100);
  });

  it('marks as complete when all chunks are visible', () => {
    const { result } = renderHook(() =>
      useChunkedContent(testContent, { minWordsPerChunk: 1 })
    );

    const totalChunks = result.current.totalCount;

    act(() => {
      for (let i = 1; i < totalChunks; i++) {
        result.current.revealNext();
      }
    });

    expect(result.current.isComplete).toBe(true);
    expect(result.current.hasMore).toBe(false);
  });

  it('does not reveal more chunks than exist', () => {
    const { result } = renderHook(() =>
      useChunkedContent(testContent, { minWordsPerChunk: 1 })
    );

    const totalChunks = result.current.totalCount;

    act(() => {
      result.current.revealAll();
      result.current.revealNext(); // Try to reveal beyond total
    });

    expect(result.current.visibleCount).toBe(totalChunks);
  });

  it('reveals all chunks immediately when revealAll option is true', () => {
    const { result } = renderHook(() =>
      useChunkedContent(testContent, { minWordsPerChunk: 1, revealAll: true })
    );

    expect(result.current.isComplete).toBe(true);
    expect(result.current.hasMore).toBe(false);
    expect(result.current.progress).toBe(100);
  });

  it('resets visible count when content changes', () => {
    const { result, rerender } = renderHook(
      ({ content }) => useChunkedContent(content, { minWordsPerChunk: 1 }),
      { initialProps: { content: testContent } }
    );

    act(() => {
      result.current.revealNext();
      result.current.revealNext();
    });

    expect(result.current.visibleCount).toBe(3);

    // Change content
    rerender({ content: 'New content. Different text.' });

    expect(result.current.visibleCount).toBe(1);
  });

  it('handles empty content gracefully', () => {
    const { result } = renderHook(() => useChunkedContent(''));

    expect(result.current.chunks).toHaveLength(0);
    expect(result.current.visibleChunks).toHaveLength(0);
    expect(result.current.isComplete).toBe(true);
    expect(result.current.hasMore).toBe(false);
    expect(result.current.progress).toBe(100);
  });

  it('passes chunking options to the chunker', () => {
    const { result } = renderHook(() =>
      useChunkedContent(testContent, {
        minWordsPerChunk: 10,
        maxWordsPerChunk: 50,
        isMobile: true,
      })
    );

    // With higher min words, should create fewer chunks
    expect(result.current.totalCount).toBeLessThan(4);
  });
});
