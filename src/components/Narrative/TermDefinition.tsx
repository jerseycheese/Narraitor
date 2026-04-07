import React, { useRef, useEffect } from 'react';
import type { TermDefinitionData } from './useTermDefinitions';

interface TermDefinitionProps {
  term: TermDefinitionData;
  anchorRect: DOMRect;
  onDismiss: () => void;
}

/**
 * Displays a lore term definition as an editorial margin note (desktop)
 * or popover (mobile). Dismisses on Escape key or click outside.
 */
export const TermDefinition: React.FC<TermDefinitionProps> = ({
  term,
  anchorRect,
  onDismiss,
}) => {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const handleMouseDown = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        onDismiss();
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onDismiss();
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
      style={{
        top: anchorRect.bottom + 8,
        left: Math.max(8, Math.min(anchorRect.left, window.innerWidth - 288)),
      }}
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
