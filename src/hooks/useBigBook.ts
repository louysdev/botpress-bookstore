import { useState, useEffect, useCallback, useRef } from 'react';
import { Book, BookDetail } from '../types/book';
import { SearchParams } from '../types/api';
import { searchBooks, getBook, getSimilarBooks } from '../api/bigbook';
import { GENRES } from '../utils/genres';

// ---------------------------------------------------------------------------
// useSearchBooks
// ---------------------------------------------------------------------------
interface UseSearchBooksResult {
  books: Book[];
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  loadMore: () => void;
}

/**
 * Paginated search hook.
 * Pass `query`, optional `genres`, and optional `page` (1-indexed).
 */
export function useSearchBooks(
  query: string,
  genres?: string,
): UseSearchBooksResult {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const prevKey = useRef('');

  const key = `${query}|${genres ?? ''}`;

  // Reset when query or genre changes
  useEffect(() => {
    if (key !== prevKey.current) {
      setBooks([]);
      setPage(1);
      setHasMore(true);
      setError(null);
      prevKey.current = key;
    }
  }, [key]);

  useEffect(() => {
    if (!query.trim() && !genres) {
      setBooks([]);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    const params: SearchParams = { page };
    if (query.trim()) params.query = query;
    if (genres) params.genre = genres;

    searchBooks(params)
      .then((response) => {
        if (cancelled) return;

        // If fallback data (no real results), signal no more pages
        const allFallback =
          response.data.length > 0 && response.data.every((b) => b.isFallback);

        setBooks((prev) => {
          // On page 1 replace, on page >1 append
          if (page === 1) return response.data;
          // Deduplicate by id
          const existing = new Map(prev.map((b) => [b.id, b]));
          for (const book of response.data) {
            if (!existing.has(book.id)) existing.set(book.id, book);
          }
          return Array.from(existing.values());
        });

        setHasMore(
          !allFallback &&
            response.data.length > 0 &&
            books.length + response.data.length < response.total,
        );
        setError(null);
      })
      .catch(() => {
        if (!cancelled) setError('Failed to load books');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, genres, page]);

  const loadMore = useCallback(() => {
    setPage((p) => p + 1);
  }, []);

  return { books, loading, error, hasMore, loadMore };
}

// ---------------------------------------------------------------------------
// useBookDetail
// ---------------------------------------------------------------------------
interface UseBookDetailResult {
  book: BookDetail | null;
  loading: boolean;
  error: string | null;
}

/**
 * Fetch a single book's full detail by ID.
 */
export function useBookDetail(id: string): UseBookDetailResult {
  const [book, setBook] = useState<BookDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    let cancelled = false;
    setLoading(true);
    setError(null);

    Promise.all([getBook(id), getSimilarBooks(id)])
      .then(([detail, similar]) => {
        if (cancelled) return;
        setBook({ ...detail, similar });
      })
      .catch(() => {
        if (!cancelled) setError('Failed to load book details');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [id]);

  return { book, loading, error };
}

// ---------------------------------------------------------------------------
// useFeaturedBooks
// ---------------------------------------------------------------------------
interface UseFeaturedBooksResult {
  books: Book[];
  loading: boolean;
  error: string | null;
}

/**
 * Fetch featured books by searching popular genres.
 * Rotates through a set of genres to provide variety on each call.
 */
export function useFeaturedBooks(): UseFeaturedBooksResult {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    // Pick the first 3 genres for featured content
    const popular = GENRES.slice(0, 3).map((g) => g.slug);

    Promise.all(
      popular.map((genre) =>
        searchBooks({ genre: genre, page: 1 }).then((r) => r.data),
      ),
    )
      .then((results) => {
        if (cancelled) return;

        const all = results.flat();
        // Deduplicate
        const seen = new Set<string>();
        const unique: Book[] = [];
        for (const b of all) {
          if (!seen.has(b.id)) {
            seen.add(b.id);
            unique.push(b);
          }
        }

        // Take up to 12 books, ensure we show at least some
        setBooks(unique.slice(0, 12));
        setError(null);
      })
      .catch(() => {
        if (!cancelled) setError('Failed to load featured books');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return { books, loading, error };
}
