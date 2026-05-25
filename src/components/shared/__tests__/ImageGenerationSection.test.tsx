import React from 'react';
import { render, screen } from '@testing-library/react';
import { ImageGenerationSection } from '../ImageGenerationSection';

describe('ImageGenerationSection accessibility', () => {
  const baseProps = {
    title: 'Character Portrait',
    description: 'AI-generated portrait.',
    isGenerating: false,
    onGenerate: jest.fn(),
    onRemove: jest.fn(),
    customPromptLabel: 'Customize physical description for portrait generation',
    imageComponent: <div>portrait</div>,
  };

  it('labels the custom-prompt checkbox', () => {
    render(<ImageGenerationSection {...baseProps} />);

    expect(
      screen.getByRole('checkbox', {
        name: 'Customize physical description for portrait generation',
      })
    ).toBeInTheDocument();
  });

  it('gives the custom-prompt textarea an accessible name when shown', () => {
    render(<ImageGenerationSection {...baseProps} defaultCustomPromptChecked />);

    expect(
      screen.getByRole('textbox', {
        name: 'Customize physical description for portrait generation',
      })
    ).toBeInTheDocument();
  });
});
