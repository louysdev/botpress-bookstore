# Proposal: BookVault Initial Scaffold

## Intent

Scaffold a production-ready BookVault catalog SPA — Radix UI, Big Book API, Botpress literary assistant. Establish tooling, data layer, core pages, and chatbot integration.

## Scope

### In Scope
- Vite + React 18 + TypeScript + pnpm project init
- Radix UI theming and component integration
- Big Book API client with rate-limit handling (60 req/min) and fallback cards
- Core pages: Landing, Genre Browse, Search, Book Detail
- React Router v6 navigation
- Botpress webchat embed (script-based) with proactive triggers
- vitest + @testing-library/react + eslint + prettier

### Out of Scope
- User accounts, auth, personalization
- SSR / static generation
- Checkout, payments, purchase flows
- Reading lists or bookmark persistence
- Admin dashboard or CMS
- Accessibility audit (deferred)

## Capabilities

### New Capabilities
- `book-catalog`: Browsing, genre filtering, search, and detail views via Big Book API
- `literary-assistant`: Botpress webchat as literary recommendation engine with proactive triggers

### Modified Capabilities
- None

## Approach

- **API layer**: `src/api/bigbook.ts` with Axios, 1 req/s throttle, cached responses, fallback cards on 429/5xx
- **Pages**: Landing (grid) → Genre Browse (picker → results) → Search (input + results) → Detail (info + similar)
- **Botpress**: Script embed in `index.html`, webchat via Botpress API, custom events from page interactions
- **Routing**: React Router v6 layout route wrapping all pages

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/` | New | Full project source tree |
| `src/api/bigbook.ts` | New | Big Book API client |
| `index.html` | New | Botpress embed + app mount |
| `vite.config.ts` | New | Build/test/lint config |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Big Book rate limit (60 req/min) | Medium | Throttle + cache + fallback on 429 |
| API key exposure in client bundle | High | Vite env vars; proxy endpoint later |
| Botpress SDK breaking changes | Low | Pin webchat version |

## Rollback Plan
- `git revert` scaffold commit if build breaks
- Remove Botpress `<script>` from `index.html` to deactivate chatbot
- Fall back to placeholder data if API integration blocks dev

## Dependencies
- Big Book API key (`VITE_BIGBOOK_API_KEY`)
- pnpm 11.5.2, Node.js v26.0.0 (pre-configured)

## Success Criteria
- [ ] `pnpm dev` starts with no errors
- [ ] Landing renders book cards (fetched or placeholder)
- [ ] Genre filter works across ≥5 genres
- [ ] Search returns results from Big Book API
- [ ] Detail page shows info + similar books
- [ ] Botpress webchat loads and accepts messages
- [ ] `pnpm test` + `pnpm lint` pass
