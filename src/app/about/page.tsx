import type { Metadata } from 'next';
import About from '@/components/About';

export const metadata: Metadata = {
  title: 'About Narraitor',
  description:
    'Narraitor is a solo narrative RPG you play in any world you describe. Pick a setting, create a character, and make the choices that shape a story that adapts to you.',
};

export default function AboutPage() {
  return <About />;
}
