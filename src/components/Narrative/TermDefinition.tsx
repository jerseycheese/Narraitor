import React, { useRef, useEffect } from 'react';
import type { TermDefinitionData } from './useTermDefinitions';

interface TermDefinitionProps {
  term: TermDefinitionData;
  onDismiss: (shouldRestoreFocus?: boolean) => void;
}

/**
 * Displays a lore term definition as an editorial margin note (desktop)
 * or bottom sheet (mobile). Dismisses on Escape key or click outside.
 */
export const TermDefinition: React.FC<TermDefinitionProps> = ({
  term,
  onDismiss,
}) => {
  const ref = useRef<HTMLElement>(null);

  // Auto-focus the panel on mount so screen readers announce it
  useEffect(() => {
    ref.current?.focus({ preventScroll: true });
  }, []);

  useEffect(() => {
    const handleMouseDown = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        onDismiss(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onDismiss(true);
      }
    };

    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onDismiss]);

  return (
    <aside
      ref={ref}
      role="complementary"
      className="manuscript-marginalia-definition"
      aria-label={`Definition: ${term.name}`}
      tabIndex={-1}
    >
      <span className="manuscript-marginalia-category">{term.category}</span>
      <p className="manuscript-marginalia-name">{term.name}</p>
      {term.type && (
        <span className="manuscript-marginalia-type">{term.type}</span>
      )}
      <p className="manuscript-marginalia-description">{term.description}</p>
    </aside>
  );
};
