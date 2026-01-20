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

export function TutorialHint({ id, children, className = '', dismissible = true }: TutorialHintProps) {
  const dismissedHints = useSessionStore(state => state.tutorialProgress.dismissedHints);
  const dismissTutorialHint = useSessionStore(state => state.dismissTutorialHint);
  
  if (dismissedHints.includes(id)) return null;

  return (
    <div className={`relative bg-card border border-primary/20 rounded-md p-3 shadow-sm ${className}`}>
      {dismissible && (
        <button 
          onClick={() => dismissTutorialHint(id)}
          className="absolute top-1 right-1 text-muted-foreground hover:text-foreground"
          aria-label="Dismiss hint"
        >
          <X className="h-3 w-3" />
        </button>
      )}
      <div className="text-sm text-card-foreground pr-4">
        {children}
      </div>
    </div>
  );
}
