import type { Metadata } from 'next';
import { NotFoundState } from '@/components/shared/NotFoundState';

export const metadata: Metadata = {
  title: 'Page Not Found',
  description:
    'This path does not lead anywhere. Head back to your worlds and pick up the story.',
};

/**
 * Global not-found page for unknown routes (#1535).
 *
 * Renders inside the app shell via the root layout, so a stale bookmark or a
 * typo lands on branded copy with a way back into the player flow instead of
 * the framework-default 404.
 */
export default function NotFound() {
  return (
    <NotFoundState
      title="Page Not Found"
      message="This path doesn't lead anywhere — the page may have moved, or the link is stale. Head back to your worlds and pick up the story."
      backUrl="/worlds"
      backLabel="Back to Worlds"
    />
  );
}
