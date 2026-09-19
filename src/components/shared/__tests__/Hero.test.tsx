import React from 'react';
import { render, screen } from '@testing-library/react';

import { Hero } from '../Hero';
import { usePlate } from '@/hooks/usePlate';

jest.mock('@/hooks/usePlate', () => ({
  usePlate: jest.fn(),
  plateInkStyle: () => undefined,
}));

const mockUsePlate = usePlate as jest.MockedFunction<typeof usePlate>;

const image = { url: '/art.png', alt: 'Aethermoor world' };

describe('Hero', () => {
  it('shows the art while no plate exists', () => {
    mockUsePlate.mockReturnValue({ plate: null, pending: false, blank: false });

    render(<Hero title="Aethermoor" image={image} />);

    expect(screen.getByAltText('Aethermoor world')).toBeInTheDocument();
  });

  it('drops flat art so the themed empty state shows instead of a slab', () => {
    mockUsePlate.mockReturnValue({ plate: null, pending: false, blank: true });

    render(<Hero title="Aethermoor" image={image} />);

    expect(screen.queryByAltText('Aethermoor world')).not.toBeInTheDocument();
    expect(screen.getByText('Aethermoor')).toBeInTheDocument();
  });
});
