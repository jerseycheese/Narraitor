import { useEffect, useRef } from 'react';
import { Step } from 'react-joyride';

export function useTutorialAutoScroll(
  run: boolean,
  steps: Step[],
  stepIndex: number
) {
  const prevStepIndexRef = useRef<number | null>(null);
  const lastStepIndexRef = useRef<number | null>(null);

  // Track previous step index
  useEffect(() => {
    prevStepIndexRef.current = lastStepIndexRef.current;
    lastStepIndexRef.current = stepIndex;
  }, [stepIndex]);

  // Auto-scroll logic
  useEffect(() => {
    if (!run || !steps[stepIndex]) return;
    
    const stepData = steps[stepIndex]?.data as { autoScroll?: boolean | 'down' | 'up' } | undefined;
    if (!stepData?.autoScroll) return;

    const prevIndex = prevStepIndexRef.current;
    const isForward = prevIndex === null || stepIndex > prevIndex;
    const isBackward = prevIndex !== null && stepIndex < prevIndex;

    if (!isForward && !isBackward) return;

    const target = steps[stepIndex].target;
    if (typeof target !== 'string') return;

    const element = document.querySelector(target);
    if (!element) return;

    const getScrollParent = (node: Element | null) => {
      let current = node?.parentElement || null;
      while (current) {
        const style = window.getComputedStyle(current);
        if (/(auto|scroll)/.test(style.overflowY)) {
          return current;
        }
        current = current.parentElement;
      }
      return document.scrollingElement instanceof HTMLElement ? document.scrollingElement : null;
    };

    const scrollParent = getScrollParent(element);
    const parentRect = scrollParent?.getBoundingClientRect();
    const rect = element.getBoundingClientRect();

    const topBoundary = parentRect?.top ?? 0;
    const bottomBoundary = parentRect?.bottom ?? (window.innerHeight || document.documentElement.clientHeight);

    const isAbove = rect.top < topBoundary;
    const isBelow = rect.bottom > bottomBoundary;

    if (stepData.autoScroll === 'down') {
      if (!isForward) return;
      element.scrollIntoView({ block: 'center', behavior: 'smooth' });
      return;
    }

    if (stepData.autoScroll === 'up') {
      if (!isBackward) return;
      element.scrollIntoView({ block: 'center', behavior: 'smooth' });
      return;
    }

    if (isForward && !isBelow) return;
    if (isBackward && !isAbove) return;
    
    element.scrollIntoView({ block: 'center', behavior: 'smooth' });
  }, [run, steps, stepIndex]);
}
