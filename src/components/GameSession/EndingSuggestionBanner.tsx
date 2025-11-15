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
    <Alert variant="warning" className="mb-4 ending-suggestion-banner">
      <AlertTitle className="flex items-center gap-2 text-foreground">
        <BookOpen className="w-4 h-4" />
        Your story could end here
      </AlertTitle>
      <AlertDescription className="mt-2 text-sm text-foreground/80">
        {reason}
      </AlertDescription>
      <div className="flex gap-2 mt-4">
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
