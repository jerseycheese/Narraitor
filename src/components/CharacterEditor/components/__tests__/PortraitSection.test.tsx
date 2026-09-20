import React from 'react';
import { render, screen } from '@testing-library/react';
import { PortraitSection } from '../PortraitSection';

describe('PortraitSection', () => {
  test('renders regenerate and remove buttons when portrait image exists', () => {
    render(
      <PortraitSection
        portrait={{
          type: 'ai-generated',
          url: 'https://example.com/portrait.png',
        }}
        characterName="Alice"
        generatingPortrait={false}
        onGeneratePortrait={jest.fn()}
        onRemovePortrait={jest.fn()}
      />
    );

    expect(screen.getByRole('button', { name: /regenerate portrait/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /remove portrait/i })).toBeInTheDocument();
  });

  test('renders generate button when portrait is placeholder', () => {
    render(
      <PortraitSection
        portrait={{
          type: 'placeholder',
          url: null,
        }}
        characterName="Alice"
        generatingPortrait={false}
        onGeneratePortrait={jest.fn()}
        onRemovePortrait={jest.fn()}
      />
    );

    expect(screen.getByRole('button', { name: /generate portrait/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /remove portrait/i })).not.toBeInTheDocument();
  });
});
