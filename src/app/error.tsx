'use client';

import { ActionButtonGroup } from '@/components/shared/ActionButtonGroup';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div>
      <h2>Something went wrong!</h2>
      <p>{error.message || 'An unexpected error occurred'}</p>
      <ActionButtonGroup
        actions={[{
          label: 'Try again',
          onClick: reset,
          variant: 'primary'
        }]}
        
      />
    </div>
  );
}
