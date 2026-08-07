import React from 'react';
import { render, screen, within } from '@testing-library/react';
import PrivacyPage from '@/app/privacy/page';
import TermsPage from '@/app/terms/page';
import About from '@/components/About';

/**
 * MVP coverage for the lightweight privacy/terms surfaces (#1366).
 * Tests map to the acceptance criteria: the copy states how the app actually
 * works (local data, prompts leave the browser, no accounts, cookieless
 * analytics; use-at-your-own-risk terms), and the pages are reachable from
 * each other via the shared footer.
 */

describe('Privacy page (#1366)', () => {
  it('states the local-data model and that prompts go to the provider', () => {
    render(<PrivacyPage />);

    expect(
      screen.getByRole('heading', { level: 1, name: /privacy/i })
    ).toBeInTheDocument();
    // Local-first storage
    expect(screen.getByText(/stored locally in your browser/i)).toBeInTheDocument();
    // Export/import backup
    expect(screen.getByText(/export everything to a file/i)).toBeInTheDocument();
    // Prompts leave the browser for the AI provider
    expect(
      screen.getByText(/sends your prompts.*to the provider that does the generating/i)
    ).toBeInTheDocument();
    // No accounts
    expect(screen.getByText(/no sign-up, no login, no profile/i)).toBeInTheDocument();
    // Cookieless analytics, no content-derived data
    expect(screen.getByText(/anonymous, cookieless/i)).toBeInTheDocument();
    expect(
      screen.getByText(/nothing derived from your content/i)
    ).toBeInTheDocument();
  });

  it('states what a crash report holds and what it leaves out (#1641)', () => {
    render(<PrivacyPage />);

    expect(
      screen.getByRole('heading', { name: /when something breaks/i })
    ).toBeInTheDocument();
    expect(screen.getByText(/the error's class name/i)).toBeInTheDocument();
    expect(
      screen.getByText(/deliberately leaves out.*the error message itself/i)
    ).toBeInTheDocument();
  });
});

describe('Terms page (#1366)', () => {
  it('states no-warranty and the do-not-paste-secrets responsibility', () => {
    render(<TermsPage />);

    expect(
      screen.getByRole('heading', { level: 1, name: /terms/i })
    ).toBeInTheDocument();
    expect(screen.getByText(/no warranty of any kind/i)).toBeInTheDocument();
    expect(screen.getByText(/use it at your own risk/i)).toBeInTheDocument();
    expect(
      screen.getByText(/don't paste secrets or real personal data/i)
    ).toBeInTheDocument();
  });
});

describe('Legal pages are reachable (#1366)', () => {
  it('exposes footer links to privacy, terms, and about', () => {
    render(<PrivacyPage />);

    const footer = screen.getByRole('navigation', { name: /more information/i });
    expect(within(footer).getByRole('link', { name: /privacy/i })).toHaveAttribute(
      'href',
      '/privacy'
    );
    expect(within(footer).getByRole('link', { name: /terms/i })).toHaveAttribute(
      'href',
      '/terms'
    );
    expect(within(footer).getByRole('link', { name: /about/i })).toHaveAttribute(
      'href',
      '/about'
    );
  });

  it('exposes privacy and terms links from the About page', () => {
    render(<About />);

    const footer = screen.getByRole('navigation', { name: /site information/i });
    expect(within(footer).getByRole('link', { name: /privacy/i })).toHaveAttribute(
      'href',
      '/privacy'
    );
    expect(within(footer).getByRole('link', { name: /terms/i })).toHaveAttribute(
      'href',
      '/terms'
    );
  });
});
