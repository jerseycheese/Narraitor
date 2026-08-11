import React from 'react';
import { clsx } from 'clsx';

interface ManuscriptDecisionBlockProps {
  children: React.ReactNode;
  className?: string;
  isStreaming?: boolean;
}

/**
 * The turn's decision, set as the closing paragraph of the current beat.
 *
 * It sits in the page's one scroll flow rather than a docked panel, so a long
 * choice list extends the story instead of competing with it for viewport
 * height. Nothing here may reserve or cap height: the choices are 3-5 cards of
 * unknown length, and every attempt to box them ends in either a squeezed
 * narrative or a nested scrollbar.
 */
export const ManuscriptDecisionBlock: React.FC<ManuscriptDecisionBlockProps> = ({
  children,
  className,
  isStreaming = false,
}) => {
  return (
    <div
      id="manuscript-decision-block"
      className={clsx(
        'manuscript-decision-block',
        isStreaming && 'manuscript-decision-block-streaming',
        className
      )}
      data-testid="manuscript-decision-block"
    >
      <div className="manuscript-decision-block-mark" aria-hidden="true" />
      {children}
    </div>
  );
};
