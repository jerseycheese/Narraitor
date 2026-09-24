import React from 'react';
import { render, screen } from '@testing-library/react';
import { WorldThumbnail } from '../WorldThumbnail';
import { usePlate } from '@/hooks/usePlate';

jest.mock('@/hooks/usePlate', () => ({
  usePlate: jest.fn(),
  plateInkStyle: jest.fn(),
}));

const mockUsePlate = usePlate as jest.MockedFunction<typeof usePlate>;

describe('WorldThumbnail', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders image with plate source when plate is available', () => {
    mockUsePlate.mockReturnValue({
      plate: { source: 'data:image/png;base64,plated', ink: null },
      pending: false,
      blank: false,
    });

    const { container } = render(
      <WorldThumbnail url="https://example.com/art.png" name="Eldoria" size="sm" />
    );

    const img = container.querySelector('img');
    expect(img).toHaveAttribute('src', 'data:image/png;base64,plated');
  });

  it('renders raw url when plate is null but art is not blank', () => {
    mockUsePlate.mockReturnValue({
      plate: null,
      pending: true,
      blank: false,
    });

    const { container } = render(
      <WorldThumbnail url="https://example.com/art.png" name="Eldoria" size="sm" />
    );

    const img = container.querySelector('img');
    expect(img).toHaveAttribute('src', 'https://example.com/art.png');
  });

  it('renders Globe icon on size="sm" when art is flat (blank)', () => {
    mockUsePlate.mockReturnValue({
      plate: null,
      pending: false,
      blank: true,
    });

    const { container } = render(
      <WorldThumbnail url="https://example.com/flat.png" name="Eldoria" size="sm" />
    );

    expect(screen.queryByRole('img')).not.toBeInTheDocument();
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('renders Globe icon on size="sm" when url is missing', () => {
    mockUsePlate.mockReturnValue({
      plate: null,
      pending: false,
      blank: false,
    });

    const { container } = render(<WorldThumbnail size="sm" />);

    expect(screen.queryByRole('img')).not.toBeInTheDocument();
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('renders initial on size="lg" when art is flat (blank)', () => {
    mockUsePlate.mockReturnValue({
      plate: null,
      pending: false,
      blank: true,
    });

    render(<WorldThumbnail url="https://example.com/flat.png" name="Cyberpunk" size="lg" />);

    expect(screen.queryByRole('img')).not.toBeInTheDocument();
    expect(screen.getByText('C')).toBeInTheDocument();
  });

  it('renders initial on size="lg" when url is missing', () => {
    mockUsePlate.mockReturnValue({
      plate: null,
      pending: false,
      blank: false,
    });

    render(<WorldThumbnail name="Avalon" size="lg" />);

    expect(screen.queryByRole('img')).not.toBeInTheDocument();
    expect(screen.getByText('A')).toBeInTheDocument();
  });
});
