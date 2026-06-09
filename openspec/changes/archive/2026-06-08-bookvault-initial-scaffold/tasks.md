# Tasks: BookVault Initial Scaffold

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~2000–2500 |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Suggested split | PR 1 Foundation → PR 2 Data/Components → PR 3 Pages/Botpress/Tests |
| Delivery strategy | auto-chain |
| Chain strategy | stacked-to-main |

Decision needed before apply: Yes (resolved: auto-chain, stacked-to-main, PR #1)
Chained PRs recommended: Yes
Chain strategy: stacked-to-main
400-line budget risk: High

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | Foundation + types + utils | PR 1 | Config, dir structure, types, cache, throttle, genres |
| 2 | API client + hooks + components | PR 2 | bigbook.ts, useBigBook, useDebounce, layout, book/UI |
| 3 | Pages + Botpress + tests | PR 3 | All 5 pages, App.tsx routes, Botpress, all tests |

## Phase 1: Foundation & Config

- [x] 1.1 `vite.config.ts`, `tsconfig.json`, `tsconfig.node.json`, `.env.example`, `.eslintrc.cjs`, `.prettierrc`
- [x] 1.2 `index.html` — app mount + Botpress script embed placeholder
- [x] 1.3 `src/main.tsx`, `src/App.tsx` (shell), `src/vite-env.d.ts`, `src/index.css`
- [x] 1.4 `src/types/book.ts`, `src/types/api.ts`, `src/types/events.ts` — Book, BookDetail, SearchParams, PaginatedResponse, BookVaultEvent
- [x] 1.5 `src/utils/cache.ts` — MemoryCache<T> with 5min TTL
- [x] 1.6 `src/utils/throttle.ts` — TokenBucket (1 req/s)
- [x] 1.7 `src/utils/genres.ts` — ≥8 genre constants + slug map

## Phase 2: API & Components

- [x] 2.1 `src/api/bigbook.ts` — searchBooks, getBook, getSimilarBooks, searchAuthors with cache+throttle+fallback
- [x] 2.2 `src/hooks/useDebounce.ts` — generic debounce hook
- [x] 2.3 `src/hooks/useBigBook.ts` — useSearchBooks, useBookDetail, useFeaturedBooks
- [x] 2.4 `src/components/layout/Header.tsx`, `Footer.tsx`, `Layout.tsx`
- [x] 2.5 `src/components/book/BookCard.tsx`, `BookGrid.tsx`, `SimilarBooks.tsx`
- [x] 2.6 `src/components/ui/Skeleton.tsx`, `FallbackCard.tsx`, `EmptyState.tsx`

## Phase 3: Pages & Botpress

- [x] 3.1 `src/pages/Landing.tsx` — hero + featured grid + genre quick-picks
- [x] 3.2 `src/pages/GenreBrowse.tsx` — genre selector + paginated grid
- [x] 3.3 `src/pages/Search.tsx` — input + paginated results
- [x] 3.4 `src/pages/BookDetail.tsx` — detail + similar + "Ask the Bot"
- [x] 3.5 `src/pages/NotFound.tsx` — 404 with link home
- [x] 3.6 Wire `App.tsx` with lazy-loaded routes

## Phase 4: Botpress Integration

- [x] 4.1 `src/components/botpress/BotpressProvider.tsx` — context provider, init, ready state, sendEvent
- [x] 4.2 `src/components/botpress/useBotpress.ts` — hook consuming BotpressContext
- [x] 4.3 `src/components/botpress/EventDispatcher.ts` — fireCustomEvent, no-throw
- [x] 4.4 Embed Botpress webchat v3 script in `index.html`

## Phase 5: Tests

- [x] 5.1 Unit: MemoryCache (get/set/expiry/eviction) — vitest with fake timers
- [x] 5.2 Unit: TokenBucket (acquire/queue/refill) — vitest advanceTimersByTime
- [x] 5.3 Unit: useDebounce — renderHook from @testing-library/react
- [x] 5.4 Integration: bigbook.ts throttle->cache->fallback chain — mock Axios
- [x] 5.5 Integration: page renders with API mock — @testing-library/react
- [x] 5.6 Component: BotpressProvider init / missing key — assert console.warn
- [x] 5.7 Component: BookCard, BookGrid, EmptyState — snapshot + a11y checks
