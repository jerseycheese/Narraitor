import React from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

interface EndingSuggestionBannerProps {
  reason: string;
  onAccept: () => void;
  onDismiss: () => void;
}

export function EndingSuggestionBanner({
  reason,
  onAccept,
  onDismiss,
}: EndingSuggestionBannerProps) {
  return (
    <Alert variant="warning" className="ending-suggestion-banner">
      <AlertTitle>
        Your story could end here
      </AlertTitle>
      <AlertDescription>{reason}</AlertDescription>
      <div className="flex gap-2 mt-2">
        <Button size="sm" onClick={onAccept}>
          View Ending
        </Button>
        <Button size="sm" variant="secondary" onClick={onDismiss}>
          Continue Playing
        </Button>
      </div>
    </Alert>
  );
}
