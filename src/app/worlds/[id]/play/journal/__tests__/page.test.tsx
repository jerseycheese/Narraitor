import React from 'react';
import { render, screen } from '@testing-library/react';
import JournalPageRoute from '../page';

jest.mock('@/components/Journal', () => ({
  JournalPage: ({ worldId }: { worldId: string }) => (
    <div data-testid="journal-page">Journal for {worldId}</div>
  ),
}));

describe('Journal Page Route', () => {
  it('renders JournalPage with the worldId param', async () => {
    const element = await JournalPageRoute({
      params: Promise.resolve({ id: 'world-123' }),
    });
    render(element);

    expect(screen.getByTestId('journal-page')).toHaveTextContent('Journal for world-123');
  });
});
