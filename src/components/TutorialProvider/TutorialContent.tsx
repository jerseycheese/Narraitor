'use client';

import React from 'react';

interface TutorialContentProps {
  children: React.ReactNode;
  example?: string;
}

/**
 * TutorialContent - Formats tutorial tooltip content with optional example text
 *
 * The main content appears at normal size, while the example appears
 * in a smaller, muted style to provide guidance without overwhelming.
 */
export function TutorialContent({ children, example }: TutorialContentProps) {
  return (
    <div className="tutorial-content">
      <p >{children}</p>
      {example && (
        <p >
          Example: {example}
        </p>
      )}
    </div>
  );
}
