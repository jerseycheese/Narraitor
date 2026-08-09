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

  it('renders a heading when a title is provided', () => {
    render(<ImageGenerationSection {...baseProps} headingLevel="h3" />);

    expect(
      screen.getByRole('heading', { level: 3, name: 'Character Portrait' })
    ).toBeInTheDocument();
  });

  it.each(['preset', 'uploaded'] as const)(
    'treats a %s image as an existing image',
    (type) => {
      render(
        <ImageGenerationSection
          {...baseProps}
          currentImageType={type}
          currentImageUrl="data:image/png;base64,abc"
          removeButtonText="Remove Portrait"
        />
      );

      expect(
        screen.getByRole('button', { name: 'Remove Portrait' })
      ).toBeInTheDocument();
    }
  );

  it('omits the heading entirely when the title is empty', () => {
    // FinalizeStep passes title="" so the surrounding section owns the heading;
    // the component must not emit an empty <h2> (#1473).
    render(<ImageGenerationSection {...baseProps} title="" />);

    expect(screen.queryByRole('heading')).not.toBeInTheDocument();
  });
});
