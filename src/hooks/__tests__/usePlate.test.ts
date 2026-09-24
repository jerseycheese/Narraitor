import { renderHook, waitFor } from '@testing-library/react';
import { usePlate, plateInkStyle } from '../usePlate';
import { toPlate } from '@/lib/plates/plate';

jest.mock('@/lib/plates/plate', () => ({
  toPlate: jest.fn(),
}));

const mockToPlate = toPlate as jest.MockedFunction<typeof toPlate>;

describe('usePlate', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders plate when toPlate resolves', async () => {
    const mockPlate = {
      source: 'data:image/png;base64,renderedPlate',
      ink: { light: '#123456', dark: '#654321', hue: 120, guarded: false },
    };
    mockToPlate.mockResolvedValue(mockPlate);

    const { result } = renderHook(() =>
      usePlate('https://example.com/art.png', { width: 32, height: 32 })
    );

    expect(result.current.pending).toBe(true);

    await waitFor(() => {
      expect(result.current.pending).toBe(false);
    });

    expect(result.current.plate).toEqual(mockPlate);
    expect(result.current.blank).toBe(false);
  });

  it('reports blank when art has no tonal range', async () => {
    mockToPlate.mockResolvedValue('blank');

    const { result } = renderHook(() =>
      usePlate('https://example.com/flat.png', { width: 32, height: 32 })
    );

    await waitFor(() => {
      expect(result.current.pending).toBe(false);
    });

    expect(result.current.plate).toBeNull();
    expect(result.current.blank).toBe(true);
  });

  it('degrades gracefully to null on plate generation failure', async () => {
    mockToPlate.mockRejectedValue(new Error('Canvas error'));

    const { result } = renderHook(() =>
      usePlate('https://example.com/fail.png', { width: 32, height: 32 })
    );

    await waitFor(() => {
      expect(result.current.pending).toBe(false);
    });

    expect(result.current.plate).toBeNull();
    expect(result.current.blank).toBe(false);
  });

  it('evicts least recently used entries when exceeding 30 entries', async () => {
    // Fill cache with 30 items
    for (let i = 0; i < 30; i++) {
      mockToPlate.mockResolvedValueOnce({
        source: `plate-${i}`,
        ink: null,
      });

      const { result } = renderHook(() =>
        usePlate(`https://example.com/img-${i}.png`, { width: 32, height: 32 })
      );

      await waitFor(() => {
        expect(result.current.pending).toBe(false);
      });
    }

    expect(mockToPlate).toHaveBeenCalledTimes(30);

    // Now request item 31, which should evict item 0
    mockToPlate.mockResolvedValueOnce({
      source: 'plate-31',
      ink: null,
    });
    const { result: r31 } = renderHook(() =>
      usePlate('https://example.com/img-31.png', { width: 32, height: 32 })
    );
    await waitFor(() => {
      expect(r31.current.pending).toBe(false);
    });

    // Requesting item 29 (which should still be in cache) should NOT trigger toPlate
    renderHook(() =>
      usePlate('https://example.com/img-29.png', { width: 32, height: 32 })
    );
    expect(mockToPlate).toHaveBeenCalledTimes(31);

    // Requesting item 0 (which was evicted) should trigger toPlate again
    mockToPlate.mockResolvedValueOnce({
      source: 'plate-0-reload',
      ink: null,
    });
    const { result: r0 } = renderHook(() =>
      usePlate('https://example.com/img-0.png', { width: 32, height: 32 })
    );
    await waitFor(() => {
      expect(r0.current.pending).toBe(false);
    });
    expect(mockToPlate).toHaveBeenCalledTimes(32);
  });

  it('compacts long data URL keys without errors', async () => {
    const longDataUrl = `data:image/png;base64,${'a'.repeat(500)}`;
    mockToPlate.mockResolvedValue({
      source: 'data:image/png;base64,rendered',
      ink: null,
    });

    const { result } = renderHook(() =>
      usePlate(longDataUrl, { width: 96, height: 96 })
    );

    await waitFor(() => {
      expect(result.current.pending).toBe(false);
    });

    expect(result.current.plate?.source).toBe('data:image/png;base64,rendered');
  });

  it('does not return cached plate on key collision when source differs', async () => {
    // Two distinct sources that produce the exact same 32-bit FNV-1a hash and length
    const s1 =
      'data:image/png;base64,AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA1vvzjeqi';
    const s2 =
      'data:image/png;base64,AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAse27237a';

    const plate1 = { source: 'plate-1', ink: null };
    const plate2 = { source: 'plate-2', ink: null };

    mockToPlate.mockResolvedValueOnce(plate1);

    const { result: r1 } = renderHook(() =>
      usePlate(s1, { width: 32, height: 32 })
    );

    await waitFor(() => {
      expect(r1.current.pending).toBe(false);
    });
    expect(r1.current.plate).toEqual(plate1);

    mockToPlate.mockResolvedValueOnce(plate2);

    const { result: r2 } = renderHook(() =>
      usePlate(s2, { width: 32, height: 32 })
    );

    await waitFor(() => {
      expect(r2.current.pending).toBe(false);
    });
    expect(r2.current.plate).toEqual(plate2);
    expect(mockToPlate).toHaveBeenCalledWith(s2, { width: 32, height: 32, dpr: 2 });
  });

  it('produces plate ink style when ink is present', () => {
    const style = plateInkStyle({
      source: 'data:...',
      ink: { light: '#111111', dark: '#222222', hue: 120, guarded: false },
    });
    expect(style).toEqual({
      '--plate-ink': '#111111',
      '--plate-ink-dark': '#222222',
    });
  });

  it('returns undefined style when ink is absent', () => {
    expect(plateInkStyle(null)).toBeUndefined();
    expect(plateInkStyle({ source: 'data:...', ink: null })).toBeUndefined();
  });
});
