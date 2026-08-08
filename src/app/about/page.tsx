import type { Metadata } from 'next';
import About from '@/components/About';

export const metadata: Metadata = {
  title: 'About',
  description:
    'Narraitor is a solo role-playing game where the story answers to the world you built. Define a setting, create a character, and make the choices that shape the story.',
};

export default function AboutPage() {
  return <About />;
}
