import axios, { AxiosError } from 'axios';
import { Book, BookDetail } from '../types/book';
import { SearchParams, PaginatedResponse } from '../types/api';
import { MemoryCache } from '../utils/cache';
import { TokenBucket } from '../utils/throttle';

// ---------------------------------------------------------------------------
// Raw Big Book API response shapes (REAL shapes from the live API)
// ---------------------------------------------------------------------------

interface RawAuthor {
  id: number;
  name: string;
}

interface RawRating {
  average: number;
}

/**
 * Each book in the search results array is itself wrapped in an array:
 * "books": [[{...}], [{...}], ...]
 */
interface RawSearchBook {
  id: number;
  title: string;
  subtitle?: string;
  image?: string;
  authors?: RawAuthor[];
  rating?: RawRating;
  genres?: string[];
  description?: string;
  year?: number;
  pages?: number;
}

interface RawSearchResponse {
  available: number;
  number: number;
  offset: number;
  books: RawSearchBook[][];  // array of arrays!
}

interface RawBookDetail {
  id: number;
  title: string;
  image?: string;
  authors?: RawAuthor[];
  identifiers?: {
    open_library_id?: string;
    isbn_10?: string;
    isbn_13?: string;
  };
  description?: string;
  rating?: RawRating;
  publish_date?: number;  // year as a number (e.g. 1997.0)
  number_of_pages?: number;
  genres?: string[];
}

/**
 * Similar books response uses "similar_books" (not "books")
 */
interface RawSimilarBook {
  id: number;
  title: string;
  subtitle?: string;
  image?: string;
}

interface RawSimilarResponse {
  similar_books: RawSimilarBook[];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const BASE_URL = 'https://api.bigbookapi.com';

import type { InternalAxiosRequestConfig } from 'axios';

function buildApiKeyInterceptor() {
  return (config: InternalAxiosRequestConfig) => {
    const key = import.meta.env.VITE_BIGBOOK_API_KEY;
    if (!key) {
      console.warn('[BigBook API] VITE_BIGBOOK_API_KEY is not set — requests will fail');
      return config;
    }
    return {
      ...config,
      params: { ...config.params, 'api-key': key },
    };
  };
}

const apiClient = axios.create({ baseURL: BASE_URL });
apiClient.interceptors.request.use(buildApiKeyInterceptor());

/** Shared cache + throttle instances */
const cache = new MemoryCache<unknown>();
const throttle = new TokenBucket(1, 1000);

// Exported for test isolation
export function clearCache(): void {
  cache.clear();
}

// ---------------------------------------------------------------------------
// Mapping helpers
// ---------------------------------------------------------------------------

/** Extract author name from authors array, or return a default. */
function extractAuthorName(authors?: RawAuthor[]): string {
  if (!authors || authors.length === 0) return 'Unknown Author';
  return authors.map((a) => a.name).join(', ');
}

/** Extract rating average from rating object. */
function extractRating(rating?: RawRating): number | undefined {
  if (!rating || typeof rating.average !== 'number') return undefined;
  return Math.round(rating.average * 100) / 100;
}

/** Normalize image URL (some are protocol-relative). */
function normalizeImage(image?: string): string | undefined {
  if (!image) return undefined;
  return image.startsWith('http') ? image : `https:${image}`;
}

/**
 * Map a search result book (unwrapped from its enclosing array).
 */
function mapRawBook(raw: RawSearchBook): Book {
  return {
    id: String(raw.id),
    title: raw.title,
    author: extractAuthorName(raw.authors),
    image: normalizeImage(raw.image),
    rating: extractRating(raw.rating),
    genres: Array.isArray(raw.genres) ? raw.genres : [],
    description: raw.description,
    year: raw.year ?? undefined,
    pages: raw.pages ?? undefined,
    isFallback: false,
  };
}

/**
 * Map a book detail response.
 */
function mapDetail(raw: RawBookDetail): BookDetail {
  return {
    id: String(raw.id),
    title: raw.title,
    author: extractAuthorName(raw.authors),
    image: normalizeImage(raw.image),
    rating: extractRating(raw.rating),
    genres: Array.isArray(raw.genres) ? raw.genres : [],
    description: raw.description || undefined,
    year: typeof raw.publish_date === 'number' ? Math.floor(raw.publish_date) : undefined,
    pages: raw.number_of_pages ?? undefined,
    isFallback: false,
    similar: [],
  };
}

/**
 * Map a similar book result (simpler shape, may lack authors/rating).
 */
function mapRawSimilar(raw: RawSimilarBook): Book {
  return {
    id: String(raw.id),
    title: raw.title,
    author: 'Unknown Author',
    image: normalizeImage(raw.image),
    genres: [],
    isFallback: false,
  };
}

function makeFallbackBook(id: string): Book {
  return {
    id,
    title: 'Data Unavailable',
    author: 'Unknown',
    rating: 0,
    genres: [],
    isFallback: true,
  };
}

function makeFallbackDetail(id: string): BookDetail {
  return {
    ...makeFallbackBook(id),
    description: 'This book\'s details are temporarily unavailable.',
    similar: [],
    isFallback: true,
  };
}

/** Generate fallback paginated response for 429/5xx */
function makeFallbackSearchResponse(): PaginatedResponse<Book> {
  return {
    data: [],
    total: 0,
    page: 1,
  };
}

// ---------------------------------------------------------------------------
// Cache key helpers
// ---------------------------------------------------------------------------
function searchCacheKey(params: SearchParams): string {
  return `search:${params.query ?? ''}|${params.genre ?? ''}|${params.page ?? 1}`;
}

function detailCacheKey(id: string): string {
  return `detail:${id}`;
}

function similarCacheKey(id: string): string {
  return `similar:${id}`;
}

// ---------------------------------------------------------------------------
// Request wrapper with throttle + cache + fallback
// ---------------------------------------------------------------------------
async function throttledRequest<T>(
  cacheKey: string,
  fetcher: () => Promise<T>,
  fallback: () => T,
): Promise<T> {
  // 1. Check cache
  const cached = cache.get(cacheKey) as T | undefined;
  if (cached !== undefined) return cached;

  // 2. Acquire rate-limit token
  try {
    await throttle.acquire();
  } catch {
    console.warn('[BigBook API] Rate limiter error, using fallback');
    const fb = fallback();
    cache.set(cacheKey, fb);
    return fb;
  }

  // 3. Make request
  try {
    const response = await fetcher();
    cache.set(cacheKey, response);
    return response;
  } catch (err: unknown) {
    const axiosErr = err as AxiosError;
    if (axiosErr.response) {
      const status = axiosErr.response.status;
      if (status === 429 || status >= 500) {
        console.warn(`[BigBook API] ${status} error — returning fallback`);
        const fb = fallback();
        cache.set(cacheKey, fb);
        return fb;
      }
    }

    // Network error, missing key, etc.
    if (!import.meta.env.VITE_BIGBOOK_API_KEY) {
      console.warn('[BigBook API] No API key configured — returning fallback');
    } else {
      console.warn('[BigBook API] Request failed — returning fallback', err);
    }
    const fb = fallback();
    cache.set(cacheKey, fb);
    return fb;
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Search books by query text and/or genre.
 */
export async function searchBooks(
  params: SearchParams,
): Promise<PaginatedResponse<Book>> {
  const key = searchCacheKey(params);
  const page = params.page ?? 1;
  const offset = (page - 1) * 12;

  return throttledRequest(
    key,
    async () => {
      const response = await apiClient.get<RawSearchResponse>('/search-books', {
        params: {
          query: params.query || undefined,
          genres: params.genre || undefined,
          offset,
          number: 12,
        },
      });

      const raw = response.data;
      // API returns books as array of arrays: [[{...}], [{...}]]
      const books = Array.isArray(raw.books)
        ? raw.books.flat().map(mapRawBook)
        : [];
      return {
        data: books,
        total: raw.available ?? books.length,
        page,
      } as PaginatedResponse<Book>;
    },
    () => makeFallbackSearchResponse(),
  );
}

/**
 * Fetch a single book's full details by ID.
 */
export async function getBook(id: string): Promise<BookDetail> {
  const key = detailCacheKey(id);

  return throttledRequest(
    key,
    async () => {
      const response = await apiClient.get<RawBookDetail>(`/${id}`);
      return mapDetail(response.data);
    },
    () => makeFallbackDetail(id),
  );
}

/**
 * Fetch similar books for a given book ID. Returns up to 5 books.
 */
export async function getSimilarBooks(id: string): Promise<Book[]> {
  const key = similarCacheKey(id);

  return throttledRequest(
    key,
    async () => {
      const response = await apiClient.get<RawSimilarResponse>(`/${id}/similar`);
      const raw = response.data;
      // Similar endpoint uses "similar_books" (not "books")
      const books = Array.isArray(raw.similar_books)
        ? raw.similar_books.slice(0, 5).map(mapRawSimilar)
        : [];
      return books;
    },
    () => [],
  );
}

/**
 * Search authors by name. Returns minimal book entries that represent the author.
 */
export async function searchAuthors(name: string): Promise<{ id: string; name: string }[]> {
  const key = `authors:${name}`;

  return throttledRequest(
    key,
    async () => {
      const response = await apiClient.get<RawSearchResponse>('/search-authors', {
        params: { name },
      });

      const raw = response.data;
      // Authors search returns book entries (array of arrays)
      const bookEntries = Array.isArray(raw.books) ? raw.books.flat() : [];
      if (bookEntries.length === 0) return [];

      // Deduplicate authors from the results
      const seen = new Set<string>();
      const authors: { id: string; name: string }[] = [];
      for (const book of bookEntries) {
        const names = book.authors?.map((a) => a.name) ?? ['Unknown Author'];
        for (const name of names) {
          if (!seen.has(name)) {
            seen.add(name);
            authors.push({ id: String(book.id), name });
          }
        }
      }
      return authors;
    },
    () => [],
  );
}
