import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockGet = vi.hoisted(() => vi.fn());

vi.mock('axios', () => ({
  default: {
    create: vi.fn(() => ({
      interceptors: {
        request: { use: vi.fn() },
        response: { use: vi.fn() },
      },
      get: mockGet,
      post: vi.fn(),
    })),
  },
}));

let bigbook: Awaited<typeof import('../bigbook')>;

describe('bigbook.ts API client', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    vi.stubEnv('VITE_BIGBOOK_API_KEY', 'test-api-key');
    bigbook = await import('../bigbook');
    bigbook.clearCache();
  });

  describe('searchBooks', () => {
    it('should return mapped books on successful request', async () => {
      // Real API shape: books is array of arrays, authors is [{id, name}], rating is {average}
      mockGet.mockResolvedValue({
        data: {
          available: 2,
          number: 2,
          offset: 0,
          books: [
            [{
              id: 1,
              title: 'Dune',
              authors: [{ id: 101, name: 'Frank Herbert' }],
              rating: { average: 4.5 },
              genres: ['fiction', 'science_fiction'],
            }],
            [{
              id: 2,
              title: 'Foundation',
              authors: [{ id: 102, name: 'Isaac Asimov' }],
              rating: { average: 4.3 },
            }],
          ],
        },
      });

      const result = await bigbook.searchBooks({ query: 'dune' });

      expect(result.data).toHaveLength(2);
      expect(result.data[0]!.title).toBe('Dune');
      expect(result.data[0]!.author).toBe('Frank Herbert');
      expect(result.data[0]!.id).toBe('1');
      expect(result.data[0]!.isFallback).toBe(false);
      expect(result.total).toBe(2);
    });

    it('should return fallback on 429 rate limit', async () => {
      mockGet.mockRejectedValue({
        response: { status: 429, data: {} },
      });

      const result = await bigbook.searchBooks({ query: 'rate-limited-query' });

      expect(result.data).toHaveLength(0);
      expect(result.total).toBe(0);
    });

    it('should return fallback on 5xx server error', async () => {
      mockGet.mockRejectedValue({
        response: { status: 503, data: {} },
      });

      const result = await bigbook.searchBooks({ query: 'server-error-query' });

      expect(result.data).toHaveLength(0);
      expect(result.total).toBe(0);
    });

    it('should warn and return fallback when API key is missing', async () => {
      vi.stubEnv('VITE_BIGBOOK_API_KEY', '');

      // Re-import to get a fresh module with new env
      bigbook = await import('../bigbook');

      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      mockGet.mockRejectedValue(new Error('Network error'));

      const result = await bigbook.searchBooks({ query: 'no-key-query' });

      expect(warnSpy).toHaveBeenCalledWith(
        '[BigBook API] No API key configured — returning fallback',
      );
      expect(result.data).toHaveLength(0);

      warnSpy.mockRestore();
    });

    it('should return cached data without network call on repeated request', async () => {
      mockGet.mockResolvedValue({
        data: {
          available: 1,
          number: 1,
          offset: 0,
          books: [[{
            id: 1,
            title: 'Dune',
            authors: [{ id: 101, name: 'Frank Herbert' }],
            rating: { average: 4.5 },
          }]],
        },
      });

      await bigbook.searchBooks({ query: 'cached-query' });

      // Clear mock to verify no second call
      mockGet.mockClear();

      const result = await bigbook.searchBooks({ query: 'cached-query' });
      expect(result.data).toHaveLength(1);
      expect(mockGet).not.toHaveBeenCalled();
    });
  });

  describe('getBook', () => {
    it('should return mapped book detail', async () => {
      mockGet.mockResolvedValue({
        data: {
          id: 1,
          title: 'Dune',
          authors: [{ id: 101, name: 'Frank Herbert' }],
          rating: { average: 4.5 },
          description: 'A sci-fi classic.',
          publish_date: 1965,
          number_of_pages: 412,
          identifiers: { isbn_13: '9780441013593' },
        },
      });

      const result = await bigbook.getBook('detail-1');

      expect(result.title).toBe('Dune');
      expect(result.author).toBe('Frank Herbert');
      expect(result.year).toBe(1965);
      expect(result.pages).toBe(412);
      expect(result.isFallback).toBe(false);
    });

    it('should return fallback on error', async () => {
      mockGet.mockRejectedValue({
        response: { status: 404, data: {} },
      });

      const result = await bigbook.getBook('unknown-detail');

      expect(result.isFallback).toBe(true);
      expect(result.title).toBe('Data Unavailable');
    });
  });

  describe('getSimilarBooks', () => {
    it('should return up to 5 similar books', async () => {
      const books = Array.from({ length: 10 }, (_, i) => ({
        id: i + 1,
        title: `Book ${i + 1}`,
      }));

      // Real API: uses "similar_books" key
      mockGet.mockResolvedValue({ data: { similar_books: books } });

      const result = await bigbook.getSimilarBooks('similar-1');

      expect(result).toHaveLength(5);
    });
  });
});
