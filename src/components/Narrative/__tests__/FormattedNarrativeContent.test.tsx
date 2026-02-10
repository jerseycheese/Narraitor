import React from 'react';
import { render, screen } from '@testing-library/react';
import { FormattedNarrativeContent } from '../FormattedNarrativeContent';

describe('FormattedNarrativeContent', () => {
  const TEST_CONTENT = `The first paragraph has some *italic text* and **bold text** to test.

This is a second paragraph with normal text.

This third paragraph has *malformed emphasis without ending.`;

  it('renders multiple paragraphs with proper spacing', () => {
    render(<FormattedNarrativeContent content={TEST_CONTENT} />);
    
    const paragraphs = screen.getAllByRole('paragraph');
    expect(paragraphs).toHaveLength(3);
    
    // Verify paragraph text content
    expect(paragraphs[0]).toHaveTextContent(/first paragraph/);
    expect(paragraphs[1]).toHaveTextContent(/second paragraph/);
    expect(paragraphs[2]).toHaveTextContent(/third paragraph/);
  });

  it('renders emphasis correctly', () => {
    render(<FormattedNarrativeContent content={TEST_CONTENT} />);
    
    const paragraphs = screen.getAllByRole('paragraph');
    
    // Check for italic rendering
    const italicElements = paragraphs[0].querySelectorAll('em');
    expect(italicElements).toHaveLength(1);
    expect(italicElements[0]).toHaveTextContent('text');
    
    // Check for bold rendering
    const boldElements = paragraphs[0].querySelectorAll('strong');
    expect(boldElements).toHaveLength(1);
    expect(boldElements[0]).toHaveTextContent('bold text');
    
    // Check malformed emphasis handling (missing closing asterisk)
    expect(paragraphs[2]).toHaveTextContent('*malformed emphasis without ending.');
    expect(paragraphs[2].querySelectorAll('em')).toHaveLength(0);
    expect(paragraphs[2].querySelectorAll('strong')).toHaveLength(0);
  });

  it('handles empty content gracefully', () => {
    render(<FormattedNarrativeContent content="" />);
    expect(screen.queryByTestId('narrative-content-container')).not.toBeInTheDocument();
  });

  it('applies custom className when provided', () => {
    render(
      <FormattedNarrativeContent 
        content="Test" 
        className="test-class" 
      />
    );
    
    const container = screen.getByTestId('narrative-content-container');
    expect(container).toHaveClass('test-class');
  });

  it('preserves whitespace normalization', () => {
    const messyContent = `Excessive whitespace should be normalized.

Multiple newlines should create separate paragraphs.`;
    
    render(<FormattedNarrativeContent content={messyContent} />);
    
    const paragraphs = screen.getAllByRole('paragraph');
    expect(paragraphs).toHaveLength(2);
    expect(paragraphs[0]).toHaveTextContent(
      'Excessive whitespace should be normalized.'
    );
  });

  it('highlights specified terms, including possessive forms', () => {
    const { container } = render(
      <FormattedNarrativeContent
        content="Marge's gaze sharpens as Marge, the Waitress wipes the counter."
        highlightTerms={['Marge, the Waitress']}
      />
    );

    const highlights = container.querySelectorAll('span.narrative-highlight');
    expect(highlights.length).toBeGreaterThan(0);
    expect(
      Array.from(highlights).some(
        (element) => element.textContent === 'Marge, the Waitress'
      )
    ).toBe(true);
  });
});
