import React from 'react';
import { render, screen } from '@testing-library/react';
import { ProviderDisclosure } from '../ProviderDisclosure';
import { getPresetById } from '@/lib/ai/presets';

describe('ProviderDisclosure', () => {
  test('warns that Gemini\'s free tier trains on prompts and is read by humans', () => {
    render(
      <ProviderDisclosure type="gemini" privacyNote={getPresetById('gemini')?.privacyNote} />
    );

    const privacy = screen.getByText(/free tier/i);
    expect(privacy).toHaveTextContent(/improve their models/i);
    expect(privacy).toHaveTextContent(/human raters/i);
    expect(privacy).toHaveTextContent(/paid tiers do not/i);
  });

  test('says a content rating is a safety-filter setting on Gemini', () => {
    render(<ProviderDisclosure type="gemini" />);

    expect(screen.getByText(/safety-filter setting/i)).toBeInTheDocument();
  });

  test('says plainly that a rating is guidance, not a filter, everywhere else', () => {
    render(<ProviderDisclosure type="openai-compatible" />);

    const rating = screen.getByText(/no safety-filter setting/i);
    expect(rating).toHaveTextContent(/guidance/i);
    expect(rating).toHaveTextContent(/does not enforce/i);
  });

  test('shows only the rating line when a provider has no privacy note', () => {
    render(<ProviderDisclosure type="openai-compatible" />);

    expect(screen.queryByText(/^Privacy$/)).not.toBeInTheDocument();
  });
});
