import React from 'react';
import Link from 'next/link';
import { FAQ_GROUPS } from './faqContent';

/**
 * Faq — the answers to the questions a new player asks before they've played,
 * gathered from copy that was previously scattered across the README, /about,
 * /privacy, and the provider wizard.
 *
 * Server component, deliberately: every answer ships open, with a jump list of
 * questions on top. Nothing collapses, so in-page find works and there's no
 * client bundle. Structural treatment lives in src/app/faq.css under
 * .component-faq* selectors (mirrors the legal/about pattern).
 */
export default function Faq() {
  return (
    <div className="component-faq">
      <header className="component-faq-hero">
        <p className="component-faq-eyebrow">Narraitor</p>
        <h1 className="component-faq-title">Questions and answers</h1>
        <p className="component-faq-lead">
          What Narraitor is, what it needs from you, and what happens to your
          stories. If something here is wrong or missing, say so on GitHub.
        </p>
      </header>

      <nav className="component-faq-jumplist" aria-label="Jump to a question">
        {FAQ_GROUPS.map((group) => (
          <div key={group.id} className="component-faq-jumplist-group">
            <p className="component-faq-jumplist-title">{group.title}</p>
            <ul className="component-faq-jumplist-items">
              {group.items.map((item) => (
                <li key={item.id}>
                  <a
                    href={`#${item.id}`}
                    className="component-faq-jumplist-link"
                  >
                    {item.question}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>

      {FAQ_GROUPS.map((group) => (
        <section
          key={group.id}
          className="component-faq-group"
          aria-labelledby={group.id}
        >
          <h2 id={group.id} className="component-faq-group-title">
            {group.title}
          </h2>

          {group.items.map((item) => (
            <article key={item.id} className="component-faq-item">
              <h3 id={item.id} className="component-faq-question">
                {item.question}
              </h3>
              <div className="component-faq-answer">{item.answer}</div>
            </article>
          ))}
        </section>
      ))}

      <nav className="component-faq-footer" aria-label="More information">
        <Link href="/about" className="component-faq-footer-link">
          About
        </Link>
        <Link href="/faq" className="component-faq-footer-link">
          FAQ
        </Link>
        <Link href="/privacy" className="component-faq-footer-link">
          Privacy
        </Link>
        <Link href="/terms" className="component-faq-footer-link">
          Terms
        </Link>
      </nav>
    </div>
  );
}
