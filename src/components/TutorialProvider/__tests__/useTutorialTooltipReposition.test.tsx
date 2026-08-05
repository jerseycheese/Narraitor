import { renderHook, act } from '@testing-library/react';
import { useTutorialTooltipReposition } from '../useTutorialTooltipReposition';

const originalResizeObserver = global.ResizeObserver;
let resizeObserverCallback: ResizeObserverCallback | undefined;

beforeEach(() => {
  resizeObserverCallback = undefined;
  global.ResizeObserver = class {
    constructor(callback: ResizeObserverCallback) {
      resizeObserverCallback = callback;
    }
    observe() {}
    disconnect() {}
    unobserve() {}
  } as unknown as typeof ResizeObserver;

  jest
    .spyOn(window, 'requestAnimationFrame')
    .mockImplementation((callback: FrameRequestCallback) => {
      callback(0);
      return 1;
    });
});

afterEach(() => {
  global.ResizeObserver = originalResizeObserver;
  jest.restoreAllMocks();
});

const renderActiveHook = () => {
  const popper = { update: jest.fn() };
  const { result, unmount } = renderHook(() => useTutorialTooltipReposition(true));
  act(() => {
    result.current(popper, 'floater');
  });
  return { popper, unmount };
};

describe('useTutorialTooltipReposition', () => {
  it('repositions the tooltip when the page scrolls or reflows', () => {
    const { popper } = renderActiveHook();

    act(() => {
      window.dispatchEvent(new Event('scroll'));
    });
    expect(popper.update).toHaveBeenCalledTimes(1);

    act(() => {
      resizeObserverCallback?.([], {} as ResizeObserver);
    });
    expect(popper.update).toHaveBeenCalledTimes(2);
  });

  it('ignores the beacon wrapper popper', () => {
    const wrapperPopper = { update: jest.fn() };
    const { result } = renderHook(() => useTutorialTooltipReposition(true));

    act(() => {
      result.current(wrapperPopper, 'wrapper');
      window.dispatchEvent(new Event('scroll'));
    });

    expect(wrapperPopper.update).not.toHaveBeenCalled();
  });

  it('stops repositioning once the tour is no longer running', () => {
    const popper = { update: jest.fn() };
    const { result, rerender } = renderHook(
      ({ isActive }) => useTutorialTooltipReposition(isActive),
      { initialProps: { isActive: true } }
    );
    act(() => {
      result.current(popper, 'floater');
    });

    rerender({ isActive: false });
    act(() => {
      window.dispatchEvent(new Event('scroll'));
    });

    expect(popper.update).not.toHaveBeenCalled();
  });
});
