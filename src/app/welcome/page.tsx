import type { Metadata } from 'next';
import { Landing } from '@/components/Landing';

export const metadata: Metadata = {
  title: 'Narraitor — a solo narrative RPG in any world you imagine',
  description:
    'Build a world, create a character, and play a story that adapts to your choices. Free, runs in your browser, your data stays on your device.',
};

export default function WelcomePage() {
  return <Landing />;
}
