import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Theme } from '@radix-ui/themes';
import BookCard from '../BookCard';
import type { Book } from '../../../types/book';

function renderWithProviders(element: React.ReactElement) {
  return render(
    <Theme>
      <MemoryRouter>{element}</MemoryRouter>
    </Theme>,
  );
}

describe('BookCard', () => {
  const mockBook: Book = {
    id: '123',
    title: 'Dune',
    author: 'Frank Herbert',
    image: 'https://example.com/dune.jpg',
    rating: 4.5,
    genres: ['fiction', 'science_fiction'],
    isFallback: false,
  };

  it('should render book title', () => {
    renderWithProviders(<BookCard book={mockBook} />);
    expect(screen.getByText('Dune')).toBeInTheDocument();
  });

  it('should render author name', () => {
    renderWithProviders(<BookCard book={mockBook} />);
    expect(screen.getByText('Frank Herbert')).toBeInTheDocument();
  });

  it('should render image with correct alt text', () => {
    renderWithProviders(<BookCard book={mockBook} />);
    const img = screen.getByAltText('Cover of Dune');
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src', 'https://example.com/dune.jpg');
  });

  it('should render rating star when rating is present', () => {
    renderWithProviders(<BookCard book={mockBook} />);
    expect(screen.getByText('4.5 ★')).toBeInTheDocument();
  });

  it('should not render rating when rating is absent', () => {
    const bookWithoutRating: Book = {
      ...mockBook,
      rating: undefined,
    };
    renderWithProviders(<BookCard book={bookWithoutRating} />);
    expect(screen.queryByText('★')).not.toBeInTheDocument();
  });

  it('should render fallback card without link when isFallback is true', () => {
    const fallbackBook: Book = {
      ...mockBook,
      isFallback: true,
    };
    renderWithProviders(<BookCard book={fallbackBook} />);

    expect(screen.getByText('Data unavailable')).toBeInTheDocument();
    // Should not have a link wrapping it
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });

  it('should link to detail page for normal books', () => {
    renderWithProviders(<BookCard book={mockBook} />);
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/books/123');
  });

  it('should render card with placeholder image when no image URL', () => {
    const bookWithoutImage: Book = {
      ...mockBook,
      image: undefined,
    };
    const { container } = renderWithProviders(
      <BookCard book={bookWithoutImage} />,
    );

    // The card still renders, just without an img element
    expect(screen.getByText('Dune')).toBeInTheDocument();
    expect(container.querySelector('img')).not.toBeInTheDocument();
  });
});
