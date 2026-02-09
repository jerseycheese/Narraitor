'use client';

import React from 'react';
import { useSessionStore } from '@/state/sessionStore';
import { X } from 'lucide-react';

interface TutorialHintProps {
  id: string;
  children: React.ReactNode;
  className?: string;
  dismissible?: boolean;
}

export function TutorialHint({
  id,
  children,
  className = '',
  dismissible = true,
}: TutorialHintProps) {
  const dismissedHints = useSessionStore(
    (state) => state.tutorialProgress.dismissedHints
  );
  const dismissTutorialHint = useSessionStore(
    (state) => state.dismissTutorialHint
  );

  if (dismissedHints.includes(id)) return null;

  return (
    <div className={`${className}`}>
      {dismissible && (
        <button
          onClick={() => dismissTutorialHint(id)}
          aria-label="Dismiss hint"
        >
          <X />
        </button>
      )}
      <div>{children}</div>
    </div>
  );
}
