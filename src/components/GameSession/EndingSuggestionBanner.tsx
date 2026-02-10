import React from 'react';
import { BookOpen } from 'lucide-react';
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
        <BookOpen />
        Your story could end here
      </AlertTitle>
      <AlertDescription>{reason}</AlertDescription>
      <div>
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
