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
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h2 className="text-2xl font-bold mb-4">Something went wrong!</h2>
      <p className="text-red-500 mb-4">{error.message || 'An unexpected error occurred'}</p>
      <ActionButtonGroup
        actions={[{
          label: 'Try again',
          onClick: reset,
          variant: 'primary'
        }]}
        className="justify-center"
      />
    </div>
  );
}
