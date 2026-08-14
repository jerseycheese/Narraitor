import { renderHook, act } from '@testing-library/react';
import { useTutorialTooltipReposition } from '../useTutorialTooltipReposition';

const originalResizeObserver = global.ResizeObserver;
let resizeObserverCallback: ResizeObserverCallback | undefined;

const TARGET = '[data-tutorial="world-name"]';

const mountTarget = () => {
  document.body.innerHTML = `<div data-tutorial="world-name"></div>`;
  return document.querySelector(TARGET) as HTMLElement;
};

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
  document.body.innerHTML = '';
  jest.restoreAllMocks();
});

const renderActiveHook = () => {
  const popper = { update: jest.fn() };
  const { result } = renderHook(() =>
    useTutorialTooltipReposition(true, TARGET, jest.fn())
  );
  act(() => {
    result.current(popper, 'floater');
  });
  return { popper };
};

describe('useTutorialTooltipReposition', () => {
  // Whether the tooltip and spotlight actually end up back on a target that
  // moved is measured in tests/visual/tutorials/tooltip-reposition.spec.ts.
  // Faking that here means writing the rects the hook then reads back, which
  // is arithmetic against the test's own numbers rather than against layout.
  it('repositions the tooltip when the page scrolls or reflows', () => {
    mountTarget();
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
    mountTarget();
    const wrapperPopper = { update: jest.fn() };
    const { result } = renderHook(() =>
      useTutorialTooltipReposition(true, TARGET, jest.fn())
    );

    act(() => {
      result.current(wrapperPopper, 'wrapper');
      window.dispatchEvent(new Event('scroll'));
    });

    expect(wrapperPopper.update).not.toHaveBeenCalled();
  });

  it('stops repositioning once the tour is no longer running', () => {
    mountTarget();
    const popper = { update: jest.fn() };
    const { result, rerender } = renderHook(
      ({ isActive }) => useTutorialTooltipReposition(isActive, TARGET, jest.fn()),
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
