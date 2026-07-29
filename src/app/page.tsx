import { Landing, ReturningUserRedirect } from '@/components/Landing';

// No metadata export: the root layout's default title and description are
// written for this page, so re-declaring them here would only invite drift.

/**
 * Public entry point (#1528). Anonymous visitors (no local worlds, characters,
 * or saved sessions) see the Landing front door; returning browsers are routed
 * to /dashboard by ReturningUserRedirect once the persisted stores hydrate.
 */
export default function HomePage() {
  return (
    <>
      <ReturningUserRedirect />
      <Landing />
    </>
  );
}
