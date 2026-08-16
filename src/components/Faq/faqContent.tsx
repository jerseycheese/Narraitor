import React from 'react';
import Link from 'next/link';

/**
 * FAQ content, kept apart from the markup so the page stays a single map.
 *
 * Every answer is pinned to how the app works today, not how it might work:
 * a provider is usable only once it has been checked against a live key,
 * storage is browser-local with no server copy, and there are no accounts. When
 * one of those changes, this file changes with it.
 */

const GEMINI_KEY_URL = 'https://aistudio.google.com/apikey';
const ISSUES_URL = 'https://github.com/jerseycheese/Narraitor/issues';

export interface FaqItem {
  /** Stable anchor target, linked from the jump list. Don't rename casually — external links point here. */
  id: string;
  question: string;
  answer: React.ReactNode;
}

export interface FaqGroup {
  id: string;
  title: string;
  items: FaqItem[];
}

export const FAQ_GROUPS: FaqGroup[] = [
  {
    id: 'faq-getting-started',
    title: 'Getting started',
    items: [
      {
        id: 'what-is-narraitor',
        question: 'What is Narraitor?',
        answer: (
          <p>
            A solo role-playing game where the story answers to the world you
            built. Describe a setting, create a character with real strengths and
            weaknesses, and play through a story that reacts to what you do.
            It&apos;s a structured RPG with skill checks and tracked state, not a
            chat window.
          </p>
        ),
      },
      {
        id: 'do-i-need-an-account',
        question: 'Do I need an account?',
        answer: (
          <p>
            No. There&apos;s no sign-up, no login, no profile, and no email to
            hand over. Open the site and start building.
          </p>
        ),
      },
      {
        id: 'what-do-i-need',
        question: 'What do I need to start?',
        answer: (
          <p>
            A browser and a provider key of your own. Setting it up takes about
            two minutes under Settings, then Providers. Google Gemini is the
            easiest place to start &mdash;{' '}
            <a href={GEMINI_KEY_URL} target="_blank" rel="noopener noreferrer">
              getting a key
            </a>{' '}
            is quick, needs no card, and Google has a tier that costs nothing.
          </p>
        ),
      },
      {
        id: 'first-thing-to-do',
        question: "What's the first thing I do?",
        answer: (
          <p>
            Build a world. The wizard asks for a genre and a description, then
            suggests attributes and skills that fit what you wrote &mdash;
            &ldquo;Force Sensitivity&rdquo; for a Star Wars setting,
            &ldquo;Sanity&rdquo; for something Lovecraftian. Accept, edit, or
            replace each one. Then create a character and start playing.
          </p>
        ),
      },
    ],
  },
  {
    id: 'faq-your-key',
    title: 'Your key, providers, and cost',
    items: [
      {
        id: 'why-my-own-key',
        question: 'Why do I need my own key?',
        answer: (
          <p>
            Because generation runs on your account rather than a shared one.
            That&apos;s what keeps Narraitor account-free and keeps your stories
            off anybody&apos;s server. You set the key up once and it stays in
            this browser.
          </p>
        ),
      },
      {
        id: 'where-do-i-get-a-key',
        question: 'Where do I get a key?',
        answer: (
          <p>
            Gemini is easiest:{' '}
            <a href={GEMINI_KEY_URL} target="_blank" rel="noopener noreferrer">
              Google AI Studio
            </a>{' '}
            hands you one in a minute. Every other provider issues keys from its
            own dashboard, and a model you host yourself needs no key at all.
            Paste whatever you have into Settings, Providers, Set up a provider.
            The wizard runs a connection check before it saves anything, so you
            find out then and there whether it works.
          </p>
        ),
      },
      {
        id: 'what-does-it-cost',
        question: 'What does it cost?',
        answer: (
          <p>
            Narraitor doesn&apos;t charge anything. Generation is billed to
            whichever key you set up, and Google&apos;s no-cost Gemini tier
            covers casual play. If you go past it, or use a paid provider, what
            you spend is between you and them. A model you host yourself costs
            nothing but your own hardware.
          </p>
        ),
      },
      {
        id: 'why-only-gemini',
        question: 'Which providers can I use?',
        answer: (
          <p>
            Gemini, OpenAI, OpenRouter, and Ollama if you host a model yourself.
            OpenRouter is the other one you can reach without a card, and a single
            key there covers dozens of models. The setup screen also lists
            Deepseek, Mistral, Together, Groq and Perplexity, which stay out of
            reach until each has been checked against a live key.
          </p>
        ),
      },
      {
        id: 'which-model',
        question: 'Which model does it use?',
        answer: (
          <p>
            <code>gemini-2.5-flash</code> by default. The setup wizard offers{' '}
            <code>gemini-2.5-pro</code> if you&apos;d rather trade speed for
            depth, and every other provider brings its own list &mdash; on a
            model you host yourself, you type the name of whatever you installed.
          </p>
        ),
      },
    ],
  },
  {
    id: 'faq-privacy',
    title: 'Privacy and your data',
    items: [
      {
        id: 'where-is-my-data',
        question: 'Where is my data stored?',
        answer: (
          <p>
            In your browser&apos;s own storage, on the device you&apos;re using.
            Worlds, characters, sessions, journal entries, inventory &mdash; all
            of it. There&apos;s no backend database and no server-side copy of
            your games.
          </p>
        ),
      },
      {
        id: 'is-my-key-safe',
        question: 'Is my key safe?',
        answer: (
          <p>
            It&apos;s encrypted in this browser with a key the page can&apos;t
            read back out, and it&apos;s sent only with the request that needs
            it. The plaintext key is never written to storage and never logged.
          </p>
        ),
      },
      {
        id: 'what-gets-sent',
        question: 'What gets sent to Google?',
        answer: (
          <>
            <p>
              The prompt for the next piece of story: your world and character
              details, and the choices you&apos;ve made. What Google does with it
              is governed by their terms, not ours.
            </p>
            <p>
              Treat a prompt like anything you&apos;d paste into a third-party
              service &mdash; no passwords, no secrets, no real personal data
              you&apos;d rather not share. <Link href="/privacy">Privacy</Link>{' '}
              has the full picture.
            </p>
          </>
        ),
      },
      {
        id: 'backup-and-move',
        question: 'Can I back up my games or move to another browser?',
        answer: (
          <p>
            Yes. Settings exports everything &mdash; worlds, characters,
            sessions, journal, narrative, inventory, and lore &mdash; to a single
            JSON file, and import restores it. That&apos;s how you move between
            browsers or devices. An import replaces what&apos;s already there, so
            it&apos;s a restore rather than a merge.
          </p>
        ),
      },
      {
        id: 'clearing-site-data',
        question: 'What happens if I clear site data?',
        answer: (
          <p>
            Everything goes: worlds, characters, saves, and your saved key.
            There&apos;s no server copy to restore from, so export anything
            you&apos;d be sad to lose before you clear anything.
          </p>
        ),
      },
    ],
  },
  {
    id: 'faq-how-it-works',
    title: 'How the game works',
    items: [
      {
        id: 'whats-in-a-world',
        question: "What's in a world?",
        answer: (
          <p>
            A setting description plus the attributes and skills that matter in
            it. Those aren&apos;t decoration &mdash; they&apos;re what the story
            checks against when your character tries something difficult.
          </p>
        ),
      },
      {
        id: 'where-do-attributes-come-from',
        question: 'Where do attributes and skills come from?',
        answer: (
          <p>
            The creation wizard suggests them from your description, and you
            accept, edit, or replace each one. Most worlds sit well at four to
            six attributes and eight to twelve skills &mdash; enough to make
            choices meaningful without drowning you in options. You can write
            your own instead.
          </p>
        ),
      },
      {
        id: 'how-do-choices-matter',
        question: 'How do my choices matter?',
        answer: (
          <p>
            Pick a suggested choice or type your own action. Decisions are
            weighted Minor, Major, or Critical so you can see what&apos;s at
            stake, and they get tested against your character&apos;s relevant
            skill. A failed check bends the story rather than handing you a
            retry. Alignment tracking (Lawful, Neutral, Chaotic) keeps a read on
            how your character has been playing.
          </p>
        ),
      },
      {
        id: 'journal-and-inventory',
        question: 'What are the journal and inventory for?',
        answer: (
          <p>
            They&apos;re the record of what happened. The journal drawer holds
            story history and past decisions, inventory tracks what you&apos;re
            carrying, and &ldquo;Story So Far&rdquo; summaries capture where
            things stand &mdash; which is also what keeps a long campaign
            coherent when you come back to it weeks later.
          </p>
        ),
      },
      {
        id: 'how-does-a-story-end',
        question: 'How does a story end?',
        answer: (
          <p>
            When a story is reaching its natural end you get an ending
            suggestion, and taking it generates a conclusion that accounts for
            what you actually did. So a campaign finishes properly instead of
            trailing off.
          </p>
        ),
      },
    ],
  },
  {
    id: 'faq-troubleshooting',
    title: 'When something goes wrong',
    items: [
      {
        id: 'key-rejected',
        question: 'My key was rejected',
        answer: (
          <p>
            Check that you copied the whole key with no stray whitespace, and
            that it&apos;s an API key from AI Studio rather than something else
            from your Google account. Re-run the connection check under Settings,
            Providers &mdash; the wizard won&apos;t save a key that fails it.
          </p>
        ),
      },
      {
        id: 'slow-or-timing-out',
        question: 'Generation is slow, or it timed out',
        answer: (
          <p>
            Long turns usually mean the provider is under load. Wait a moment and
            retry the turn. If it keeps timing out, switching the model from{' '}
            <code>gemini-2.5-pro</code> to <code>gemini-2.5-flash</code> under
            Settings, Providers is the fastest thing to try.
          </p>
        ),
      },
      {
        id: 'rate-limited',
        question: 'I hit a rate limit',
        answer: (
          <p>
            Two separate limits can stop a turn. Narraitor caps generation at 50
            requests an hour from one connection, and that&apos;s usually the one
            you hit first; the message tells you how long the wait is, and
            nothing you change at Google will shorten it. Google enforces its own
            limit on your key on top of that, and moving your account onto a paid
            tier raises only that second one.
          </p>
        ),
      },
      {
        id: 'saves-disappeared',
        question: 'My worlds or saves are gone',
        answer: (
          <p>
            Everything lives in one browser&apos;s storage, so a cleared cache, a
            private window, or a different browser or device won&apos;t show
            them. Check you&apos;re in the browser you played in, then restore
            from an export if you have one.
          </p>
        ),
      },
      {
        id: 'report-a-bug',
        question: 'Where do I report a bug?',
        answer: (
          <p>
            On{' '}
            <a href={ISSUES_URL} target="_blank" rel="noopener noreferrer">
              GitHub
            </a>
            . Narraitor is open source, and bug reports and feature requests both
            go to the same place.
          </p>
        ),
      },
    ],
  },
];
