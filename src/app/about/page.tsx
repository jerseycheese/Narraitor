import type { Metadata } from 'next';
import About from '@/components/About';

export const metadata: Metadata = {
  title: 'About',
  description:
    'Narraitor is a solo role-playing game you play in any world you can describe. Pick a setting, create a character, and make the choices that shape the story.',
};

export default function AboutPage() {
  return <About />;
}
