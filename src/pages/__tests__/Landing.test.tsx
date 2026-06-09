import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

// Mock the hooks used by Landing
vi.mock('../../hooks/useBigBook', () => ({
  useFeaturedBooks: vi.fn(),
}));

import { useFeaturedBooks } from '../../hooks/useBigBook';
import type { Book } from '../../types/book';
import Landing from '../Landing';

function renderLanding() {
  return render(
    <MemoryRouter>
      <Landing />
    </MemoryRouter>,
  );
}

describe('Landing page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render hero section with heading and CTA', () => {
    vi.mocked(useFeaturedBooks).mockReturnValue({
      books: [],
      loading: false,
      error: null,
    });

    renderLanding();

    expect(screen.getByText('Discover Your Next Read')).toBeInTheDocument();
    expect(screen.getByText('Start Browsing')).toBeInTheDocument();
  });

  it('should render genre buttons', () => {
    vi.mocked(useFeaturedBooks).mockReturnValue({
      books: [],
      loading: false,
      error: null,
    });

    renderLanding();

    // Check a few genre buttons are present
    expect(screen.getByText('Fiction')).toBeInTheDocument();
    expect(screen.getByText('Fantasy')).toBeInTheDocument();
    expect(screen.getByText('Science Fiction')).toBeInTheDocument();
    expect(screen.getByText('Mystery')).toBeInTheDocument();
    expect(screen.getByText('History')).toBeInTheDocument();
  });

  it('should show skeleton when loading', () => {
    vi.mocked(useFeaturedBooks).mockReturnValue({
      books: [],
      loading: true,
      error: null,
    });

    const { container } = renderLanding();
    // Skeleton renders with the pulse animation, check for skeleton elements
    const skeletons = container.querySelectorAll('[style*="skeleton-pulse"]');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('should render featured books when data is loaded', () => {
    const mockBooks: Book[] = [
      {
        id: '1',
        title: 'Test Book 1',
        author: 'Author 1',
        rating: 4.5,
        genres: ['fiction'],
        isFallback: false,
      },
      {
        id: '2',
        title: 'Test Book 2',
        author: 'Author 2',
        rating: 4.0,
        genres: ['fantasy'],
        isFallback: false,
      },
    ];

    vi.mocked(useFeaturedBooks).mockReturnValue({
      books: mockBooks,
      loading: false,
      error: null,
    });

    renderLanding();

    expect(screen.getByText('Test Book 1')).toBeInTheDocument();
    expect(screen.getByText('Test Book 2')).toBeInTheDocument();
    expect(screen.getByText('Featured Books')).toBeInTheDocument();
  });

  it('should show empty state on error', () => {
    vi.mocked(useFeaturedBooks).mockReturnValue({
      books: [],
      loading: false,
      error: 'Failed to load',
    });

    renderLanding();

    expect(screen.getByText('Unable to load featured books')).toBeInTheDocument();
    expect(screen.getByText('Please try again later.')).toBeInTheDocument();
  });
});
