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

describe('bigbook.ts API client (OpenLibrary)', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    bigbook = await import('../bigbook');
    bigbook.clearCache();
  });

  // -----------------------------------------------------------------------
  // searchBooks
  // -----------------------------------------------------------------------
  describe('searchBooks', () => {
    it('should return mapped books on successful request', async () => {
      mockGet.mockResolvedValue({
        data: {
          numFound: 2,
          start: 0,
          docs: [
            {
              key: '/works/OL82563W',
              title: "Harry Potter and the Philosopher's Stone",
              author_name: ['J. K. Rowling'],
              cover_i: 15155833,
              first_publish_year: 1997,
              subject: ['Fantasy', 'Magic', 'Wizards'],
              ratings_average: 4.5,
              number_of_pages_median: 302,
            },
            {
              key: '/works/OL12345M',
              title: 'Foundation',
              author_name: ['Isaac Asimov'],
              cover_i: undefined,
              first_publish_year: 1951,
              subject: ['Science Fiction'],
            },
          ],
        },
      });

      const result = await bigbook.searchBooks({ query: 'potter' });

      expect(result.data).toHaveLength(2);
      expect(result.data[0]!.title).toBe(
        "Harry Potter and the Philosopher's Stone",
      );
      expect(result.data[0]!.author).toBe('J. K. Rowling');
      expect(result.data[0]!.id).toBe('OL82563W');
      expect(result.data[0]!.isFallback).toBe(false);
      expect(result.data[0]!.year).toBe(1997);
      expect(result.data[0]!.pages).toBe(302);
      expect(result.data[0]!.rating).toBe(4.5);
      expect(result.data[0]!.image).toBe(
        'https://covers.openlibrary.org/b/id/15155833-M.jpg',
      );
      expect(result.data[0]!.genres).toContain('Fantasy');
      expect(result.data[0]!.genres).toContain('Magic');
      expect(result.total).toBe(2);
      expect(result.page).toBe(1);
    });

    it('should handle missing optional fields gracefully', async () => {
      mockGet.mockResolvedValue({
        data: {
          numFound: 1,
          start: 0,
          docs: [
            {
              key: '/works/OL99999X',
              title: 'No Data Book',
            },
          ],
        },
      });

      const result = await bigbook.searchBooks({ query: 'nodata' });

      expect(result.data[0]!.author).toBe('Unknown Author');
      expect(result.data[0]!.image).toBeUndefined();
      expect(result.data[0]!.year).toBeUndefined();
      expect(result.data[0]!.pages).toBeUndefined();
      expect(result.data[0]!.rating).toBeUndefined();
      expect(result.data[0]!.genres).toEqual([]);
    });

    it('should filter internal subjects from genres', async () => {
      mockGet.mockResolvedValue({
        data: {
          numFound: 1,
          start: 0,
          docs: [
            {
              key: '/works/OL11111W',
              title: 'Filtered',
              subject: [
                'series:Harry_Potter',
                'Fantasy',
                'Wizards in fiction',
                'Magic',
                'Adventure',
              ],
            },
          ],
        },
      });

      const result = await bigbook.searchBooks({ query: 'filtered' });

      expect(result.data[0]!.genres).toEqual([
        'Fantasy',
        'Magic',
        'Adventure',
      ]);
    });

    it('should use subject param when genre is provided without query', async () => {
      mockGet.mockResolvedValue({
        data: { numFound: 0, start: 0, docs: [] },
      });

      await bigbook.searchBooks({ genre: 'fantasy', page: 2 });

      expect(mockGet).toHaveBeenCalledWith(
        '/search.json',
        expect.objectContaining({
          params: expect.objectContaining({
            subject: 'fantasy',
            page: 2,
            limit: 12,
          }),
        }),
      );
    });

    it('should use both q and subject when both provided', async () => {
      mockGet.mockResolvedValue({
        data: { numFound: 0, start: 0, docs: [] },
      });

      await bigbook.searchBooks({ query: 'ring', genre: 'fantasy' });

      expect(mockGet).toHaveBeenCalledWith(
        '/search.json',
        expect.objectContaining({
          params: expect.objectContaining({
            q: 'ring',
            subject: 'fantasy',
          }),
        }),
      );
    });

    it('should return fallback on 429 rate limit', async () => {
      mockGet.mockRejectedValue({
        response: { status: 429, data: {} },
      });

      const result = await bigbook.searchBooks({ query: 'rate-limited' });

      expect(result.data).toHaveLength(0);
      expect(result.total).toBe(0);
      expect(result.page).toBe(1);
    });

    it('should return fallback on 5xx server error', async () => {
      mockGet.mockRejectedValue({
        response: { status: 503, data: {} },
      });

      const result = await bigbook.searchBooks({ query: 'server-error' });

      expect(result.data).toHaveLength(0);
      expect(result.total).toBe(0);
    });

    it('should return cached data without network call on repeated request', async () => {
      mockGet.mockResolvedValue({
        data: {
          numFound: 1,
          start: 0,
          docs: [
            {
              key: '/works/OL1W',
              title: 'Dune',
              author_name: ['Frank Herbert'],
              cover_i: 12345,
              first_publish_year: 1965,
              subject: ['Science Fiction'],
              ratings_average: 4.5,
            },
          ],
        },
      });

      // Populate cache
      await bigbook.searchBooks({ query: 'cached-query' });

      // Clear mock to verify no second network call
      mockGet.mockClear();

      const result = await bigbook.searchBooks({ query: 'cached-query' });
      expect(result.data).toHaveLength(1);
      expect(result.data[0]!.title).toBe('Dune');
      expect(mockGet).not.toHaveBeenCalled();
    });
  });

  // -----------------------------------------------------------------------
  // getBook
  // -----------------------------------------------------------------------
  describe('getBook', () => {
    it('should return mapped book detail with resolved author', async () => {
      // Call 1: work detail
      mockGet.mockResolvedValueOnce({
        data: {
          description: { type: '/type/text', value: 'A sci-fi classic.' },
          title: 'Dune',
          covers: [14625765],
          subjects: ['Science Fiction', 'Adventure'],
          first_publish_date: '1965',
          authors: [
            {
              author: { key: '/authors/OL12345A' },
              type: { key: '/type/author_role' },
            },
          ],
        },
      });

      // Call 2: author resolution
      mockGet.mockResolvedValueOnce({
        data: { name: 'Frank Herbert' },
      });

      const result = await bigbook.getBook('OL82563W');

      expect(result.title).toBe('Dune');
      expect(result.author).toBe('Frank Herbert');
      expect(result.description).toBe('A sci-fi classic.');
      expect(result.year).toBe(1965);
      expect(result.image).toBe(
        'https://covers.openlibrary.org/b/id/14625765-M.jpg',
      );
      expect(result.isFallback).toBe(false);
      expect(result.id).toBe('OL82563W');
    });

    it('should handle a plain-string description', async () => {
      mockGet.mockResolvedValueOnce({
        data: {
          description: 'Plain text description.',
          title: 'Simple Book',
          authors: [],
        },
      });

      const result = await bigbook.getBook('OL1W');

      expect(result.description).toBe('Plain text description.');
      expect(result.author).toBe('Unknown Author');
    });

    it('should handle missing description field', async () => {
      mockGet.mockResolvedValueOnce({
        data: {
          title: 'No Description',
          authors: [],
        },
      });

      const result = await bigbook.getBook('OL2W');

      expect(result.description).toBeUndefined();
    });

    it('should handle first_publish_date with year extraction', async () => {
      mockGet.mockResolvedValueOnce({
        data: {
          title: 'Date Book',
          first_publish_date: 'September 3, 2001',
          authors: [],
        },
      });

      const result = await bigbook.getBook('OL3W');

      expect(result.year).toBe(2001);
    });

    it('should return fallback on error', async () => {
      mockGet.mockRejectedValue({
        response: { status: 404, data: {} },
      });

      const result = await bigbook.getBook('unknown-id');

      expect(result.isFallback).toBe(true);
      expect(result.title).toBe('Data Unavailable');
    });

    it('should return cached detail on repeated request', async () => {
      mockGet.mockResolvedValueOnce({
        data: {
          title: 'Cache Me',
          authors: [],
        },
      });

      await bigbook.getBook('cache-test');

      mockGet.mockClear();

      const result = await bigbook.getBook('cache-test');
      expect(result.title).toBe('Cache Me');
      expect(mockGet).not.toHaveBeenCalled();
    });
  });

  // -----------------------------------------------------------------------
  // getSimilarBooks
  // -----------------------------------------------------------------------
  describe('getSimilarBooks', () => {
    it('should return similar books based on author and subject', async () => {
      // Call 1: /works/{id}.json — work detail
      mockGet.mockResolvedValueOnce({
        data: {
          title: 'Dune',
          authors: [
            {
              author: { key: '/authors/OL12345A' },
              type: { key: '/type/author_role' },
            },
          ],
          subjects: ['Science Fiction', 'Adventure'],
        },
      });

      // Call 2: /authors/{id}.json — author resolution
      mockGet.mockResolvedValueOnce({
        data: { name: 'Frank Herbert' },
      });

      // Call 3: /search.json — similar books search
      mockGet.mockResolvedValueOnce({
        data: {
          numFound: 3,
          docs: [
            {
              key: '/works/OL82563W',
              title: 'Original Book',
              author_name: ['Frank Herbert'],
              cover_i: 111,
              first_publish_year: 1965,
              subject: ['Science Fiction'],
            },
            {
              key: '/works/OL2W',
              title: 'Chapterhouse: Dune',
              author_name: ['Frank Herbert'],
              cover_i: 222,
              first_publish_year: 1985,
              subject: ['Science Fiction'],
            },
            {
              key: '/works/OL3W',
              title: 'Heretics of Dune',
              author_name: ['Frank Herbert'],
              cover_i: 333,
              first_publish_year: 1984,
              subject: ['Science Fiction'],
            },
          ],
        },
      });

      const result = await bigbook.getSimilarBooks('OL82563W');

      // Should exclude the original book (same id)
      expect(result).toHaveLength(2);
      expect(result[0]!.id).toBe('OL2W');
      expect(result[1]!.id).toBe('OL3W');
      expect(result[0]!.title).toBe('Chapterhouse: Dune');
    });

    it('should return up to 5 books', async () => {
      // Work detail
      mockGet.mockResolvedValueOnce({
        data: {
          title: 'Prolific Author',
          authors: [
            {
              author: { key: '/authors/OL999A' },
              type: { key: '/type/author_role' },
            },
          ],
          subjects: ['Fantasy'],
        },
      });

      // Author resolution
      mockGet.mockResolvedValueOnce({
        data: { name: 'Prolific Writer' },
      });

      // Search returns 10 docs
      const manyDocs = Array.from({ length: 10 }, (_, i) => ({
        key: `/works/OL${i}W`,
        title: `Book ${i}`,
        author_name: ['Prolific Writer'],
        subject: ['Fantasy'],
      }));
      mockGet.mockResolvedValueOnce({
        data: { numFound: 10, docs: manyDocs },
      });

      const result = await bigbook.getSimilarBooks('OL0W');

      expect(result.length).toBeLessThanOrEqual(5);
    });

    it('should return empty array on work detail failure', async () => {
      mockGet.mockRejectedValue({
        response: { status: 500, data: {} },
      });

      const result = await bigbook.getSimilarBooks('bad-id');

      expect(result).toEqual([]);
    });
  });

  // -----------------------------------------------------------------------
  // searchAuthors
  // -----------------------------------------------------------------------
  describe('searchAuthors', () => {
    it('should return mapped authors', async () => {
      mockGet.mockResolvedValue({
        data: {
          numFound: 2,
          docs: [
            {
              key: '/authors/OL12345A',
              name: 'Frank Herbert',
              work_count: 42,
            },
            {
              key: '/authors/OL67890A',
              name: 'Isaac Asimov',
              work_count: 156,
            },
          ],
        },
      });

      const result = await bigbook.searchAuthors('herbert');

      expect(result).toHaveLength(2);
      expect(result[0]!.id).toBe('OL12345A');
      expect(result[0]!.name).toBe('Frank Herbert');
      expect(result[1]!.id).toBe('OL67890A');
      expect(result[1]!.name).toBe('Isaac Asimov');
    });

    it('should return empty array when no results', async () => {
      mockGet.mockResolvedValue({
        data: { numFound: 0, docs: [] },
      });

      const result = await bigbook.searchAuthors('nonexistent');

      expect(result).toEqual([]);
    });

    it('should return empty array on error', async () => {
      mockGet.mockRejectedValue(new Error('Network error'));

      const result = await bigbook.searchAuthors('error-case');

      expect(result).toEqual([]);
    });
  });

  // -----------------------------------------------------------------------
  // clearCache
  // -----------------------------------------------------------------------
  describe('clearCache', () => {
    it('should clear the cache so a fresh network call is made', async () => {
      mockGet.mockResolvedValue({
        data: {
          numFound: 1,
          start: 0,
          docs: [
            {
              key: '/works/OL1W',
              title: 'First',
              author_name: ['Author One'],
              subject: ['Fiction'],
            },
          ],
        },
      });

      await bigbook.searchBooks({ query: 'first' });

      bigbook.clearCache();

      mockGet.mockResolvedValue({
        data: {
          numFound: 1,
          start: 0,
          docs: [
            {
              key: '/works/OL2W',
              title: 'Second',
              author_name: ['Author Two'],
              subject: ['Fiction'],
            },
          ],
        },
      });

      const result = await bigbook.searchBooks({ query: 'first' });
      expect(result.data[0]!.title).toBe('Second');
    });
  });
});
