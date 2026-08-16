import type { Metadata } from 'next';
import { LegalPage, LegalSection } from '@/components/Legal';

export const metadata: Metadata = {
  title: 'Privacy',
  description:
    'How Narraitor handles your data: your worlds and characters stay in your browser, prompts go to the provider that generates the story, and usage measurement is anonymous and cookieless.',
};

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy"
      lead="The short, honest version: your stories live in your browser. What leaves it is the prompt sent off to generate the next part of the story, plus anonymous counts of how the app gets used and what breaks."
      updated="August 2026"
    >
      <LegalSection id="privacy-data" heading="Where your data lives">
        <p>
          Your worlds, characters, and saved stories are stored locally in your
          browser, on the device you&apos;re using. They aren&apos;t uploaded to a
          server — there isn&apos;t one holding your stuff.
        </p>
        <p>
          From Settings you can export everything to a file and import it back —
          that&apos;s your backup, and it&apos;s the only copy of your saved data
          that leaves your device, when you choose to make it. Clearing your browser data for this
          site erases everything, so keep an export of anything you&apos;d be sad
          to lose.
        </p>
      </LegalSection>

      <LegalSection id="privacy-prompts" heading="What leaves your browser">
        <p>
          To write the story and generate images, the app sends your prompts — the
          world and character details you create, and the choices you make — by way
          of its own server, which passes them on without keeping a copy, to the
          provider that does the generating. By default that&apos;s Google Gemini;
          if you&apos;ve set up your own provider key, it goes to whichever provider
          you chose instead.
        </p>
        <p>
          What that provider does with what you send is governed by their terms, not
          ours. The practical upshot: treat a prompt like anything you&apos;d paste
          into a third-party service, and don&apos;t put passwords, secrets, or real
          personal data you&apos;d rather not share into it.
        </p>
      </LegalSection>

      <LegalSection id="privacy-accounts" heading="No accounts">
        <p>
          There&apos;s no sign-up, no login, no profile. The app doesn&apos;t know
          who you are, and nothing ties your stories to an identity.
        </p>
      </LegalSection>

      <LegalSection id="privacy-analytics" heading="Usage measurement">
        <p>
          Usage is measured with Vercel Web Analytics: anonymous, cookieless counting
          of page views and a few funnel steps — did someone land on the site, create
          a world, start a session, come back. Because it&apos;s cookieless,
          there&apos;s no consent banner to click through.
        </p>
        <p>
          No personal data, and nothing derived from your content — world names,
          character names, prompts, story text — is ever sent to it. It exists to
          answer one question: does the first-play flow actually work for someone new.
        </p>
      </LegalSection>

      <LegalSection id="privacy-errors" heading="When something breaks">
        <p>
          If the app crashes or a request fails, it sends a short report so the
          break is visible instead of silent. A report holds five things: which
          part failed, the error&apos;s class name, a category like
          &ldquo;network&rdquo; or &ldquo;timeout&rdquo;, the page you were on with
          any ids swapped out, and the stack trace.
        </p>
        <p>
          What it deliberately leaves out: the error message itself, anything from
          your worlds, characters, or story, whatever you typed, and your provider
          key. The message is read on your device to pick the category, and then
          it&apos;s dropped — only the category travels.
        </p>
      </LegalSection>

      <LegalSection id="privacy-changes" heading="If this changes">
        <p>
          This note matches how the app works today: local-first, no accounts. If
          that ever changes — accounts, server-side saves, syncing across devices —
          this note changes with it, and the change shows up right here.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
