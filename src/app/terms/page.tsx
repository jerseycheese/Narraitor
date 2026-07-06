import type { Metadata } from 'next';
import { LegalPage, LegalSection } from '@/components/Legal';

export const metadata: Metadata = {
  title: 'Terms — Narraitor',
  description:
    'Plain-language terms for Narraitor: a free, creative-fiction tool provided as-is, with no warranty. Your stories are yours.',
};

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms"
      lead="Plain-language terms for a free, creative-fiction tool. No fine print designed to trip you up — just what you can expect, and what's on you."
      updated="June 2026"
    >
      <LegalSection id="terms-what" heading="What this is">
        <p>
          Narraitor is a free, creative-fiction tool and a personal, open-source
          project. It&apos;s for building and playing your own stories. By using it,
          you&apos;re agreeing to the plain-language terms below.
        </p>
      </LegalSection>

      <LegalSection id="terms-warranty" heading="Provided as-is, no warranty">
        <p>
          It comes with no warranty of any kind. It might have bugs, it might be
          unavailable, and the story and images it generates are produced by a model
          — they can be wrong, strange, repetitive, or just not what you asked for.
          Use it at your own risk.
        </p>
      </LegalSection>

      <LegalSection id="terms-responsibility" heading="Your part of the deal">
        <p>
          Don&apos;t paste secrets or real personal data into prompts — see the{' '}
          <a href="/privacy">privacy note</a> for why. You&apos;re responsible for
          what you create and how you use it.
        </p>
        <p>
          If you&apos;re using your own provider key, you&apos;re also bound by that
          provider&apos;s terms, and any usage costs billed to that key are yours.
        </p>
      </LegalSection>

      <LegalSection id="terms-ownership" heading="Your stories are yours">
        <p>
          The app doesn&apos;t claim your stories, and because they live in your
          browser, the project never sees them. The code itself is open-source under
          the license in its repository.
        </p>
      </LegalSection>

      <LegalSection id="terms-availability" heading="It can change or go away">
        <p>
          This is a hobby release. Features can change, and there&apos;s no guarantee
          it&apos;ll stay online or keep working. Your local data is yours to export
          and keep, so back up anything you&apos;d be sad to lose.
        </p>
      </LegalSection>

      <LegalSection id="terms-questions" heading="Questions">
        <p>
          It&apos;s open-source — read the code, or file an issue on{' '}
          <a
            href="https://github.com/jerseycheese/Narraitor"
            target="_blank"
            rel="noopener noreferrer"
          >
            GitHub
          </a>
          .
        </p>
      </LegalSection>
    </LegalPage>
  );
}
