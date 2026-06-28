import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { CollapsibleSection } from '../CollapsibleSection';

describe('CollapsibleSection', () => {
  // Editor pages render these sections directly under the PageLayout <h1>, so
  // the section title must be an <h2> to avoid an h1 -> h3 level skip (#1473).
  it('renders the section title as an h2', () => {
    render(
      <CollapsibleSection title="Basic Information">
        <p>body</p>
      </CollapsibleSection>
    );

    expect(
      screen.getByRole('heading', { level: 2, name: 'Basic Information' })
    ).toBeInTheDocument();
  });
});
