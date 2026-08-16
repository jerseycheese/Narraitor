import type { Metadata } from 'next';
import Faq from '@/components/Faq';

export const metadata: Metadata = {
  title: 'FAQ',
  description:
    'Common questions about Narraitor: what it is, why you bring your own provider key, what it costs, where your worlds and saves are stored, and what to do when something breaks.',
};

export default function FaqPage() {
  return <Faq />;
}
