import React from 'react';
import { render, screen } from '@testing-library/react';
import { ToneSettingsForm } from '../ToneSettingsForm';
import { DEFAULT_TONE_SETTINGS } from '@/types/tone-settings.types';

// Unlike ToneSettingsForm.test.tsx, this file does not mock
// descriptionsToSelectOptions — it exercises the real formatter to prove
// the content rating options render as "PG", not "Pg" (#2082).
describe('ToneSettingsForm - content rating labels', () => {
  it('renders content rating options with their correct casing', () => {
    render(
      <ToneSettingsForm
        toneSettings={DEFAULT_TONE_SETTINGS}
        onToneSettingsChange={jest.fn()}
      />
    );

    const select = screen.getByLabelText('Content Rating');
    const options = Array.from(select.querySelectorAll('option')).map(
      (option) => option.textContent
    );

    expect(options.some((text) => text?.startsWith('PG -'))).toBe(true);
    expect(options.some((text) => text?.startsWith('Pg'))).toBe(false);
  });
});
