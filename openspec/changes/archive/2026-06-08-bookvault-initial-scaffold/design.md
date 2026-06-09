# Design: BookVault Initial Scaffold

## Technical Approach

Single-page catalog app (React 18 + TypeScript + Vite) consuming Big Book API with rate-limit safety. Botpress webchat embedded as a companion layer — independent of app rendering, driven by custom DOM events. Four pages under a shared layout. No global state store: per-page local state with a memoized API cache.

## Architecture Decisions

### Decision: Per-page local state vs. global store

| Option | Tradeoff | Decision |
|--------|----------|----------|
| Zustand/Redux | Solves cross-page sharing, but we have none | ❌ Rejected — adds cost without benefit |
| React Context per page | Works but re-renders all consumers | ❌ Rejected |
| **useState + useReducer in page** | Simple, co-located, no deps | ✅ **Chosen** |

**Rationale**: No page shares data with another. Landing, Search, Genre Browse, and Detail are independent queries. A global store would be ceremonial overhead.

### Decision: API caching strategy

| Option | Tradeoff | Decision |
|--------|----------|----------|
| React Query (TanStack Query) | Automatic, stale-while-revalidate, dedup | ❌ Rejected — keeps deps minimal |
| **Custom in-memory cache with TTL** | Full control, zero deps, 5-min expiry | ✅ **Chosen** |
| sessionStorage | Survives refresh but has size limits | ❌ Rejected |

**Rationale**: The only consumer is `bigbook.ts`. Adding React Query for one client is disproportionate. A `Map<string, {data, timestamp}>` with 5-min TTL is 30 lines and trivially testable.

### Decision: Throttle vs. debounce for rate limiting

| Option | Tradeoff | Decision |
|--------|----------|----------|
| **Token bucket (1 req/s, queue)** | Guarantees never exceed 60/min | ✅ **Chosen** |
| Debounce API calls | Reduces calls but can still burst under load | ❌ Rejected |
| Retry-after on 429 | Reactive, not preventive — still hits rate limit | ❌ Rejected |

**Rationale**: Big Book API has a hard 60 req/min cap. A token bucket with FIFO queue prevents 429s proactively — critical since the free tier has no retry budget.

### Decision: Botpress initialization style

| Option | Tradeoff | Decision |
|--------|----------|----------|
| **Script embed + React wrapper** | CDN script in index.html, React component wraps init | ✅ **Chosen** |
| npm SDK package | First-class types, but v3.x SDK is unstable | ❌ Rejected — version pins unreliable |

**Rationale**: The spec says "script-based" embed. The wrapper (`BotpressProvider`) isolates all `window.botpressWebChat.*` calls behind a React context, so the rest of the app never touches the global.

## Data Flow

```
Page Component
  │
  ├── useBigBook() hook
  │     ├── [cache] MemoryCache.get(key) ──→ hit ──→ return cached
  │     └── [miss]  RateLimiter.acquire() ──→ Axios GET ──→ MemoryCache.set(key) ──→ return
  │                     │                                       │
  │                     └── 429/5xx ──→ return fallback data ───┘
  │
  └── Botpress event
        ├── onClick "Ask the Bot" ──→ bookvault:ask-about-book
        ├── onClick "Get Recs"    ──→ bookvault:recommend-books
        ├── onSearchComplete      ──→ bookvault:search-results
        └── onPageMount           ──→ bookvault:page-view
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `index.html` | Create | App mount point + Botpress webchat v3 script embed |
| `vite.config.ts` | Create | Vite + React plugin, proxy-less (direct API call) |
| `tsconfig.json` | Create | Strict TS config |
| `tsconfig.node.json` | Create | Node-scoped TS config for Vite |
| `.env.example` | Create | `VITE_BIGBOOK_API_KEY=`, `VITE_BOTPRESS_CLIENT_ID=` |
| `src/main.tsx` | Create | ReactDOM.createRoot, wraps App in providers |
| `src/App.tsx` | Create | BrowserRouter + Route definitions with lazy pages |
| `src/vite-env.d.ts` | Create | Vite client types + env var declarations |
| `src/index.css` | Create | Radix theme import + minimal global reset |
| `src/types/book.ts` | Create | `Book`, `BookDetail` interfaces |
| `src/types/api.ts` | Create | `SearchParams`, `ApiResponse<T>` |
| `src/types/events.ts` | Create | Botpress custom event payload interfaces |
| `src/utils/cache.ts` | Create | `MemoryCache<T>` — Map with TTL |
| `src/utils/throttle.ts` | Create | `TokenBucket` — 1 req/s rate limiter |
| `src/utils/genres.ts` | Create | Genre constants (≥8), name→slug mapping |
| `src/api/bigbook.ts` | Create | Big Book API client (searchBooks, getBook, getSimilarBooks, searchAuthors) with throttle + cache + fallback |
| `src/hooks/useBigBook.ts` | Create | React hooks: `useSearchBooks`, `useBookDetail`, `useFeaturedBooks` |
| `src/hooks/useDebounce.ts` | Create | Generic debounce hook for search input |
| `src/components/layout/Header.tsx` | Create | Nav bar with logo, nav links |
| `src/components/layout/Footer.tsx` | Create | Footer with attribution |
| `src/components/layout/Layout.tsx` | Create | `<Header/><Outlet/><Footer/>` wrapper |
| `src/components/book/BookCard.tsx` | Create | Card with cover, title, author, rating, link to detail |
| `src/components/book/BookGrid.tsx` | Create | Responsive grid of BookCards |
| `src/components/book/SimilarBooks.tsx` | Create | ≤5 similar book cards for detail page |
| `src/components/ui/Skeleton.tsx` | Create | Skeleton card/line placeholder |
| `src/components/ui/FallbackCard.tsx` | Create | Placeholder card with "unavailable" badge |
| `src/components/ui/EmptyState.tsx` | Create | "No results" / "Book not found" message |
| `src/components/botpress/BotpressProvider.tsx` | Create | Context provider — init, ready state, sendEvent |
| `src/components/botpress/useBotpress.ts` | Create | Hook consuming BotpressContext |
| `src/components/botpress/EventDispatcher.tsx` | Create | `fireCustomEvent()` utility, no-throw on failure |
| `src/pages/Landing.tsx` | Create | Hero + Featured grid (6+ cards) + Genre quick-picks |
| `src/pages/GenreBrowse.tsx` | Create | Genre selector + paginated grid |
| `src/pages/Search.tsx` | Create | Search input + paginated results |
| `src/pages/BookDetail.tsx` | Create | Full detail + similar + "Ask the Bot" |
| `src/pages/NotFound.tsx` | Create | 404 with link home |

## Interfaces / Contracts

```typescript
// types/book.ts
interface Book {
  id: string;
  title: string;
  author: string;
  image?: string;
  rating?: number;
  genres: string[];
  description?: string;
  year?: number;
  pages?: number;
  isFallback?: boolean; // true when returned from 429/5xx fallback
}

interface BookDetail extends Book {
  similar: Book[];
}

// types/api.ts
interface SearchParams {
  query?: string;
  genre?: string;
  page?: number;
}

interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
}

// types/events.ts
type BookVaultEvent =
  | { type: 'bookvault:recommend-books'; detail: { genre: string } }
  | { type: 'bookvault:ask-about-book'; detail: { id: string; title: string; author: string } }
  | { type: 'bookvault:search-results'; detail: { query: string; count: number } }
  | { type: 'bookvault:page-view'; detail: { page: string; id?: string } };

// api/bigbook.ts — public interface
interface BigBookClient {
  searchBooks(params: SearchParams): Promise<PaginatedResponse<Book>>;
  getBook(id: string): Promise<BookDetail>;
  getSimilarBooks(id: string): Promise<Book[]>;
  searchAuthors(name: string): Promise<Book[]>; // minimal — returns books by author
}

// components/botpress/BotpressProvider.tsx — context shape
interface BotpressContextValue {
  isReady: boolean;
  sendEvent: (event: BookVaultEvent) => void;
  openChat: () => void;
}
```

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Unit | `MemoryCache` (get/set/expiry/eviction) | Plain vitest, mock timers |
| Unit | `TokenBucket` (acquire/queue/refill timing) | vitest, advanceTimersByTime |
| Unit | `useDebounce` | renderHook from @testing-library/react |
| Integration | `bigbook.ts` client (throttle → cache → fallback chain) | Mock Axios, assert call order and fallback on 429 |
| Integration | Page renders with API mock | @testing-library/react, MSW or manual mock |
| Component | `BotpressProvider` init / missing key | Assert console.warn, no render error |
| Component | `BookCard`, `BookGrid`, `EmptyState` | Snapshot + accessibility checks |

## Migration / Rollout

No migration required — this is a from-scratch scaffold. The first `git init` and scaffold commit is the initial state.

## Open Questions

- [ ] Confirm exact Big Book API response shape (field casing, nested structures) — fallback card rendering depends on it
- [ ] Confirm Botpress v3.x webchat `init()` config keys for proactive message and theme colors
- [ ] Confirm genre slugs the Big Book API expects (e.g. `fiction`, `fantasy` match spec genre names?)
- [ ] Should search pagination use offset or page number? Spec says "page" — Big Book API may use numeric page or offset parameter
