import type { Metadata } from 'next';
import { Landing, ReturningUserRedirect } from '@/components/Landing';

export const metadata: Metadata = {
  title: 'Narraitor — a solo narrative RPG in any world you imagine',
  description:
    'Build a world, create a character, and play a story that adapts to your choices. Runs in your browser, your data stays on your device.',
};

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
