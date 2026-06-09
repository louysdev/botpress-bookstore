import axios, { AxiosError } from 'axios';
import { Book, BookDetail } from '../types/book';
import { SearchParams, PaginatedResponse } from '../types/api';
import { MemoryCache } from '../utils/cache';
import { TokenBucket } from '../utils/throttle';

// ---------------------------------------------------------------------------
// Raw OpenLibrary API response shapes
// ---------------------------------------------------------------------------

interface RawSearchDoc {
  key: string;
  title: string;
  author_name?: string[];
  cover_i?: number;
  first_publish_year?: number;
  subject?: string[];
  ratings_average?: number;
  number_of_pages_median?: number;
}

interface RawSearchResponse {
  numFound: number;
  start: number;
  docs: RawSearchDoc[];
}

interface RawWorkDetail {
  description?: string | { type: string; value: string };
  title: string;
  covers?: number[];
  subjects?: string[];
  first_publish_date?: string;
  authors?: Array<{
    author: { key: string };
    type: { key: string };
  }>;
}

interface RawAuthorDoc {
  key: string;
  name: string;
}

interface RawAuthorSearchResponse {
  numFound: number;
  docs: RawAuthorDoc[];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const BASE_URL = 'https://openlibrary.org';

const apiClient = axios.create({ baseURL: BASE_URL });

/** Shared cache + throttle instances (5 req/s for OpenLibrary) */
const cache = new MemoryCache<unknown>();
const throttle = new TokenBucket(5, 1000);

export function clearCache(): void {
  cache.clear();
}

// ---------------------------------------------------------------------------
// Mapping helpers
// ---------------------------------------------------------------------------

function extractId(key: string): string {
  return key.replace('/works/', '');
}

function extractAuthorName(authorName?: string[]): string {
  if (!authorName || authorName.length === 0) return 'Unknown Author';
  return authorName.join(', ');
}

/** Filter out internal subjects (series:..., ... in fiction) and take first 5 */
function extractGenres(subjects?: string[]): string[] {
  if (!subjects || subjects.length === 0) return [];
  return subjects
    .filter((s) => !s.startsWith('series:') && !s.endsWith(' in fiction'))
    .slice(0, 5);
}

function buildCoverUrl(coverId?: number): string | undefined {
  if (!coverId) return undefined;
  return `https://covers.openlibrary.org/b/id/${coverId}-M.jpg`;
}

function extractRating(rating?: number): number | undefined {
  if (typeof rating !== 'number') return undefined;
  return Math.round(rating * 100) / 100;
}

function extractDescription(
  desc?: string | { type: string; value: string },
): string | undefined {
  if (!desc) return undefined;
  if (typeof desc === 'string') return desc;
  if (typeof desc.value === 'string') return desc.value;
  return undefined;
}

function parseYear(dateStr?: string): number | undefined {
  if (!dateStr) return undefined;
  const match = dateStr.match(/\b(\d{4})\b/);
  return match ? Number(match[1]) : undefined;
}

/** Map a search result doc to a Book. */
function mapRawSearchBook(raw: RawSearchDoc): Book {
  return {
    id: extractId(raw.key),
    title: raw.title,
    author: extractAuthorName(raw.author_name),
    image: buildCoverUrl(raw.cover_i),
    rating: extractRating(raw.ratings_average),
    genres: extractGenres(raw.subject),
    year: raw.first_publish_year ?? undefined,
    pages: raw.number_of_pages_median ?? undefined,
    isFallback: false,
  };
}

/** Map a work detail response to a BookDetail (author resolved by caller). */
function mapRawDetail(raw: RawWorkDetail, id: string): BookDetail {
  return {
    id,
    title: raw.title,
    author: 'Unknown Author', // resolved by caller via author API
    image:
      raw.covers && raw.covers.length > 0
        ? buildCoverUrl(raw.covers[0])
        : undefined,
    rating: undefined,
    genres: extractGenres(raw.subjects),
    description: extractDescription(raw.description),
    year: parseYear(raw.first_publish_date),
    pages: undefined,
    isFallback: false,
    similar: [],
  };
}

// ---------------------------------------------------------------------------
// Fallback constructors
// ---------------------------------------------------------------------------

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
    description: "This book's details are temporarily unavailable.",
    similar: [],
    isFallback: true,
  };
}

function makeFallbackSearchResponse(): PaginatedResponse<Book> {
  return { data: [], total: 0, page: 1 };
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
    console.warn('[OpenLibrary] Rate limiter error, using fallback');
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
        console.warn(`[OpenLibrary] ${status} error — returning fallback`);
        const fb = fallback();
        cache.set(cacheKey, fb);
        return fb;
      }
    }

    console.warn('[OpenLibrary] Request failed — returning fallback', err);
    const fb = fallback();
    cache.set(cacheKey, fb);
    return fb;
  }
}

/** Resolve author name from an OpenLibrary author key (e.g. "/authors/OL33421A"). */
async function resolveAuthorName(authorKey: string): Promise<string> {
  try {
    const id = authorKey.replace('/authors/', '');
    const resp = await apiClient.get(`/authors/${id}.json`);
    return resp.data.name || 'Unknown Author';
  } catch {
    return 'Unknown Author';
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Search books by query text and/or genre.
 * Uses `q` for text search, `subject` for genre filtering.
 */
export async function searchBooks(
  params: SearchParams,
): Promise<PaginatedResponse<Book>> {
  const key = searchCacheKey(params);
  const page = params.page ?? 1;

  return throttledRequest(
    key,
    async () => {
      const queryParams: Record<string, string | number> = {
        page,
        limit: 12,
        fields:
          'key,title,author_name,cover_i,first_publish_year,subject,ratings_average,number_of_pages_median',
      };

      if (params.query) queryParams['q'] = params.query;
      if (params.genre) queryParams['subject'] = params.genre;

      const response = await apiClient.get<RawSearchResponse>('/search.json', {
        params: queryParams,
      });

      const raw = response.data;
      const books = Array.isArray(raw.docs) ? raw.docs.map(mapRawSearchBook) : [];

      return {
        data: books,
        total: raw.numFound ?? books.length,
        page,
      } satisfies PaginatedResponse<Book>;
    },
    () => makeFallbackSearchResponse(),
  );
}

/**
 * Fetch a single book's full details by work ID (e.g. "OL82563W").
 */
export async function getBook(id: string): Promise<BookDetail> {
  const key = detailCacheKey(id);

  return throttledRequest(
    key,
    async () => {
      const response = await apiClient.get<RawWorkDetail>(
        `/works/${id}.json`,
      );
      const raw = response.data;
      const detail = mapRawDetail(raw, id);

      // Resolve first author name via author API
      if (raw.authors && raw.authors.length > 0) {
        detail.author = await resolveAuthorName(raw.authors[0]!.author.key);
      }

      return detail;
    },
    () => makeFallbackDetail(id),
  );
}

/**
 * Fetch similar books for a given book ID. Returns up to 5 books.
 * Searches by the same author name and/or subject.
 */
export async function getSimilarBooks(id: string): Promise<Book[]> {
  const key = similarCacheKey(id);

  return throttledRequest(
    key,
    async () => {
      // 1. Get work detail to extract author and subject
      const detailResp = await apiClient.get<RawWorkDetail>(
        `/works/${id}.json`,
      );
      const detail = detailResp.data;

      // 2. Resolve author name (may fail gracefully)
      let authorName = '';
      if (detail.authors && detail.authors.length > 0) {
        authorName = await resolveAuthorName(detail.authors[0]!.author.key);
      }

      // 3. Search by author name and/or first subject
      const queryParams: Record<string, string | number> = {
        limit: 5,
        fields:
          'key,title,author_name,cover_i,first_publish_year,subject,ratings_average,number_of_pages_median',
      };

      if (authorName && authorName !== 'Unknown Author') {
        queryParams['q'] = authorName;
      }

      // Also add first real subject as additional filter
      const firstSubject = extractGenres(detail.subjects)[0];
      if (firstSubject) {
        queryParams['subject'] = firstSubject;
      }

      const searchResp = await apiClient.get<RawSearchResponse>(
        '/search.json',
        { params: queryParams },
      );

      const docs = searchResp.data.docs || [];
      return docs
        .map(mapRawSearchBook)
        .filter((b) => b.id !== id)
        .slice(0, 5);
    },
    () => [],
  );
}

/**
 * Search authors by name. Returns up to 10 results.
 */
export async function searchAuthors(
  name: string,
): Promise<{ id: string; name: string }[]> {
  const key = `authors:${name}`;

  return throttledRequest(
    key,
    async () => {
      const response = await apiClient.get<RawAuthorSearchResponse>(
        '/search/authors.json',
        { params: { q: name, limit: 10 } },
      );

      const docs = response.data.docs || [];
      if (docs.length === 0) return [];

      return docs.map((doc) => ({
        id: doc.key.replace('/authors/', ''),
        name: doc.name,
      }));
    },
    () => [],
  );
}
