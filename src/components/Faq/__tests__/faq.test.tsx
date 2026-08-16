import React from 'react';
import { render, screen, within } from '@testing-library/react';
import FaqPage from '@/app/faq/page';
import { FAQ_GROUPS } from '@/components/Faq';

/**
 * MVP coverage for the FAQ surface.
 *
 * The one failure worth a test is the jump list going stale: it's generated
 * from the same data as the answers, so a link pointing at an id that isn't
 * rendered means the data shape broke. Beyond that, the assertions pin the
 * facts the page exists to state — bring your own key, browser-local storage,
 * no accounts — so a copy edit that reverses one of them fails here.
 */

describe('FAQ page', () => {
  it('renders every group and question', () => {
    render(<FaqPage />);

    expect(
      screen.getByRole('heading', { level: 1, name: /questions and answers/i })
    ).toBeInTheDocument();

    for (const group of FAQ_GROUPS) {
      expect(
        screen.getByRole('heading', { level: 2, name: group.title })
      ).toBeInTheDocument();

      for (const item of group.items) {
        expect(
          screen.getByRole('heading', { level: 3, name: item.question })
        ).toBeInTheDocument();
      }
    }
  });

  it('points every jump-list link at a question that exists', () => {
    const { container } = render(<FaqPage />);

    const jumpList = screen.getByRole('navigation', {
      name: /jump to a question/i,
    });
    const links = within(jumpList).getAllByRole('link');

    expect(links).toHaveLength(
      FAQ_GROUPS.reduce((total, group) => total + group.items.length, 0)
    );

    for (const link of links) {
      const href = link.getAttribute('href') ?? '';
      expect(href).toMatch(/^#/);
      expect(container.querySelector(href)).not.toBeNull();
    }
  });

  it('states how the key, storage, and accounts actually work', () => {
    render(<FaqPage />);

    expect(screen.getByText(/no sign-up, no login, no profile/i)).toBeInTheDocument();
    expect(
      screen.getByText(/no backend database and no server-side copy/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/generation is billed to whichever key you set up/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/gemini, openai, openrouter, and ollama/i)
    ).toBeInTheDocument();
  });

  it('exposes footer links to about, privacy, and terms', () => {
    render(<FaqPage />);

    const footer = screen.getByRole('navigation', { name: /more information/i });
    expect(within(footer).getByRole('link', { name: /about/i })).toHaveAttribute(
      'href',
      '/about'
    );
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
