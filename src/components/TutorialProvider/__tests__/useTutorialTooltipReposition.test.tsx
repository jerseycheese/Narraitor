import { renderHook, act } from '@testing-library/react';
import { useTutorialTooltipReposition } from '../useTutorialTooltipReposition';

const originalResizeObserver = global.ResizeObserver;
let resizeObserverCallback: ResizeObserverCallback | undefined;

const TARGET = '[data-tutorial="world-name"]';

const mountTarget = (top: number) => {
  document.body.innerHTML = `<div data-tutorial="world-name"></div>`;
  const element = document.querySelector(TARGET) as HTMLElement;
  element.getBoundingClientRect = () =>
    ({ top, left: 0, bottom: top + 40, right: 100, width: 100, height: 40 }) as DOMRect;
  return element;
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

const renderActiveHook = (onTargetMoved = jest.fn()) => {
  const popper = { update: jest.fn() };
  const { result } = renderHook(() =>
    useTutorialTooltipReposition(true, TARGET, onTargetMoved)
  );
  act(() => {
    result.current(popper, 'floater');
  });
  return { popper, onTargetMoved };
};

describe('useTutorialTooltipReposition', () => {
  it('repositions the tooltip when the page scrolls or reflows', () => {
    mountTarget(100);
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

  it('reports a target that a reflow moved, but not a plain scroll', () => {
    mountTarget(100);
    const { onTargetMoved } = renderActiveHook();

    act(() => {
      window.dispatchEvent(new Event('scroll'));
    });
    expect(onTargetMoved).not.toHaveBeenCalled();

    mountTarget(300);
    act(() => {
      resizeObserverCallback?.([], {} as ResizeObserver);
    });
    expect(onTargetMoved).toHaveBeenCalledTimes(1);
  });

  it('ignores the beacon wrapper popper', () => {
    mountTarget(100);
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
    mountTarget(100);
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
