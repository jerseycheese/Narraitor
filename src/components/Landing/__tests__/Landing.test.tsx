import React from 'react';
import { render, screen, within } from '@testing-library/react';
import WelcomePage from '@/app/welcome/page';

/**
 * MVP coverage for the free public landing page (#1365). Tests map to the
 * acceptance criteria: a plain-language front door with a clear primary CTA
 * into the existing world-creation flow, an honest "how it's free" note, and
 * footer links out to About / Privacy / Terms.
 */

describe('Landing page (#1365)', () => {
  it('renders an outcome-framed hero with a primary CTA into world creation', () => {
    render(<WelcomePage />);

    expect(
      screen.getByRole('heading', {
        level: 1,
        name: /play a story in any world/i,
      })
    ).toBeInTheDocument();

    const cta = screen.getByRole('link', { name: /start your story/i });
    expect(cta).toHaveAttribute('href', '/worlds/create');
  });

  it('states the honest "free / local / no accounts" promises', () => {
    render(<WelcomePage />);

    expect(screen.getByText(/free to play/i)).toBeInTheDocument();
    expect(screen.getByText(/runs in your browser/i)).toBeInTheDocument();
    expect(screen.getByText(/your own provider key/i)).toBeInTheDocument();
    expect(
      screen.getByText(/stay on your device/i)
    ).toBeInTheDocument();
    expect(screen.getByText(/no accounts/i)).toBeInTheDocument();
  });

  it('exposes footer links to about, privacy, and terms', () => {
    render(<WelcomePage />);

    const footer = screen.getByRole('contentinfo', { name: /site information/i });
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
