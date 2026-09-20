import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { CharacterPropertyGrid } from '../CharacterPropertyGrid';

describe('CharacterPropertyGrid', () => {
  it('omits lone General subheading when showing categories', () => {
    const items = [
      { id: '1', name: 'Item 1', category: 'General' },
      { id: '2', name: 'Item 2', category: 'General' },
    ];

    render(
      <CharacterPropertyGrid
        items={items}
        kind="attribute"
        emptyText="None"
        showCategories={true}
        renderItem={(item) => <div>{item.name}</div>}
      />
    );

    expect(screen.queryByRole('heading', { level: 3, name: /general/i })).not.toBeInTheDocument();
    expect(screen.getByText('Item 1')).toBeInTheDocument();
    expect(screen.getByText('Item 2')).toBeInTheDocument();
  });

  it('renders category headings when multiple categories exist', () => {
    const items = [
      { id: '1', name: 'Item 1', category: 'Physical' },
      { id: '2', name: 'Item 2', category: 'Mental' },
    ];

    render(
      <CharacterPropertyGrid
        items={items}
        kind="attribute"
        emptyText="None"
        showCategories={true}
        renderItem={(item) => <div>{item.name}</div>}
      />
    );

    expect(screen.getByRole('heading', { level: 3, name: 'Physical' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 3, name: 'Mental' })).toBeInTheDocument();
  });
});
