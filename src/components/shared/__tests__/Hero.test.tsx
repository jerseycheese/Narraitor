import React from 'react';
import { render, screen } from '@testing-library/react';
import { Hero } from '../Hero';

// Mock Next.js Image component for testing
jest.mock('next/image', () => {
  return function MockedImage({ src, alt, className }: { src: string; alt: string; className?: string }) {
    return <img src={src} alt={alt} className={className} />;
  };
});

describe('Hero Component', () => {
  const defaultProps = {
    title: 'Test Hero Title',
    image: {
      url: '/test-image.jpg',
      alt: 'Test image'
    }
  };

  it('renders hero with title and image', () => {
    render(<Hero {...defaultProps} />);
    
    expect(screen.getByText('Test Hero Title')).toBeInTheDocument();
    expect(screen.getByAltText('Test image')).toBeInTheDocument();
  });

  it('renders subtitle when provided', () => {
    render(
      <Hero 
        {...defaultProps} 
        subtitle="Test subtitle" 
      />
    );
    
    expect(screen.getByText('Test subtitle')).toBeInTheDocument();
  });

  it('renders badge when provided', () => {
    const badge = <span data-testid="test-badge">Test Badge</span>;
    
    render(
      <Hero 
        {...defaultProps} 
        badge={badge}
      />
    );
    
    expect(screen.getByTestId('test-badge')).toBeInTheDocument();
  });

  it('uses custom height class', () => {
    const { container } = render(
      <Hero 
        {...defaultProps} 
        height="h-80"
      />
    );
    
    const heroContainer = container.querySelector('.h-80');
    expect(heroContainer).toBeInTheDocument();
  });

  it('uses custom title element', () => {
    render(
      <Hero 
        {...defaultProps} 
        titleElement="h2"
      />
    );
    
    const titleElement = screen.getByRole('heading', { level: 2 });
    expect(titleElement).toHaveTextContent('Test Hero Title');
  });

  it('applies test ID to title when provided', () => {
    render(
      <Hero 
        {...defaultProps} 
        titleTestId="hero-title"
      />
    );
    
    expect(screen.getByTestId('hero-title')).toHaveTextContent('Test Hero Title');
  });

  it('uses default h1 title element when not specified', () => {
    render(<Hero {...defaultProps} />);
    
    const titleElement = screen.getByRole('heading', { level: 1 });
    expect(titleElement).toHaveTextContent('Test Hero Title');
  });

  it('uses default height when not specified', () => {
    const { container } = render(<Hero {...defaultProps} />);
    
    const heroContainer = container.querySelector('.h-64.md\\:h-96');
    expect(heroContainer).toBeInTheDocument();
  });
});