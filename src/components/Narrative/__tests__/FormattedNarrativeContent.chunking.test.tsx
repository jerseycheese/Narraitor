import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FormattedNarrativeContent } from '../FormattedNarrativeContent';

describe('FormattedNarrativeContent with chunking', () => {
  const longContent = 'First sentence here. Second sentence here. Third sentence here. Fourth sentence here. Fifth sentence here. Sixth sentence here.';

  it('renders all content when chunking is disabled', () => {
    render(
      <FormattedNarrativeContent
        content={longContent}
        enableChunking={false}
      />
    );

    expect(screen.getByText(/first sentence/i)).toBeInTheDocument();
    expect(screen.getByText(/sixth sentence/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /continue reading/i })).not.toBeInTheDocument();
  });

  it('initially shows only first chunk when chunking is enabled', () => {
    render(
      <FormattedNarrativeContent
        content={longContent}
        enableChunking={true}
        chunkingOptions={{ minWordsPerChunk: 1 }}
      />
    );

    expect(screen.getByText(/first sentence/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /continue reading/i })).toBeInTheDocument();
  });

  it('reveals more content when continue button is clicked', async () => {
    const user = userEvent.setup();

    render(
      <FormattedNarrativeContent
        content={longContent}
        enableChunking={true}
        chunkingOptions={{ minWordsPerChunk: 1 }}
      />
    );

    // Initially only first chunk visible
    expect(screen.getByText(/first sentence/i)).toBeInTheDocument();

    // Click reveal button
    const button = screen.getByRole('button', { name: /continue reading/i });
    await user.click(button);

    // More content should be visible
    expect(screen.getByText(/second sentence/i)).toBeInTheDocument();
  });

  it('hides reveal button when all chunks are shown', async () => {
    const user = userEvent.setup();

    render(
      <FormattedNarrativeContent
        content="First sentence. Second sentence."
        enableChunking={true}
        chunkingOptions={{ minWordsPerChunk: 1 }}
      />
    );

    // Reveal all content
    const button = screen.getByRole('button', { name: /continue reading/i });
    await user.click(button);

    // Button should disappear when all content is revealed
    expect(screen.queryByRole('button', { name: /continue reading/i })).not.toBeInTheDocument();
  });

  it('shows remaining chunks count on button', () => {
    render(
      <FormattedNarrativeContent
        content={longContent}
        enableChunking={true}
        chunkingOptions={{ minWordsPerChunk: 1 }}
      />
    );

    const button = screen.getByRole('button');
    expect(button).toHaveTextContent(/more/i);
  });

  it('uses custom reveal button text when provided', () => {
    render(
      <FormattedNarrativeContent
        content={longContent}
        enableChunking={true}
        chunkingOptions={{ minWordsPerChunk: 1 }}
        revealButtonText="Show More Story"
      />
    );

    expect(screen.getByRole('button', { name: /show more story/i })).toBeInTheDocument();
  });

  it('applies fade-in animation to paragraphs', () => {
    const { container } = render(
      <FormattedNarrativeContent
        content="Test paragraph."
        enableChunking={true}
      />
    );

    const paragraph = container.querySelector('p');
    expect(paragraph).toHaveClass('animate-fade-in');
  });

  it('still supports highlighting when chunking is enabled', () => {
    render(
      <FormattedNarrativeContent
        content="The hero walked through the forest."
        enableChunking={true}
        highlightTerms={['hero']}
      />
    );

    const highlighted = screen.getByText('hero');
    expect(highlighted.tagName).toBe('SPAN');
    expect(highlighted).toHaveClass('font-semibold');
  });

  it('still supports markdown formatting when chunking is enabled', () => {
    render(
      <FormattedNarrativeContent
        content="This is **bold** text and this is *italic* text."
        enableChunking={true}
      />
    );

    expect(screen.getByText('bold')).toBeInTheDocument();
    expect(screen.getByText('italic')).toBeInTheDocument();
  });
});
