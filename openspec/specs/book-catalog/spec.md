# Book Catalog Specification

## Purpose

Browsing, genre search, and detail views via the Big Book API.

## Requirements

### Requirement: API Client

MUST provide centralized client with 1 req/s throttle, 5-min in-memory cache, and fallback placeholders on 429/5xx or missing key.

Endpoints: `searchBooks(query, genres, page)`, `getBook(id)`, `getSimilarBooks(id)`, `searchAuthors(name)`.

#### Scenario: Successful search

- GIVEN a valid `VITE_BIGBOOK_API_KEY`
- WHEN `searchBooks("dune", ["fiction"])` is called
- THEN results with `id`, `title`, `author`, `image`, `rating`, and `genres` are returned

#### Scenario: Rate-limited

- GIVEN 60+ requests in the last minute
- WHEN `searchBooks` is called
- THEN fallback placeholders are returned and a warning is logged

#### Scenario: Cached response

- GIVEN same query was fetched within 5 min
- WHEN requested again
- THEN cached data is returned without a network call

### Requirement: Landing Page

SHALL render hero, featured books grid (6+ cards), and genre quick-picks for ≥5 genres.

#### Scenario: Successful load

- GIVEN the page mounts at `/`
- WHEN featured books are fetched
- THEN 6+ cards with cover, title, rating are displayed alongside genre buttons

#### Scenario: API down

- GIVEN the API returns 5xx
- THEN placeholder cards with a "data temporarily unavailable" badge are shown

### Requirement: Genre Browse Page

SHALL provide a genre selector (≥8: Fiction, Fantasy, Sci-Fi, Mystery, Romance, Non-Fiction, Biography, History), paginated grid, and active genre indicator.

#### Scenario: Browse genre

- GIVEN the user navigates to `/genre-browse`
- WHEN they select "Fantasy"
- THEN books tagged `genres=fantasy` are displayed with "Fantasy" as heading

#### Scenario: Paginate

- GIVEN results are displayed
- WHEN the user clicks "Next Page"
- THEN the next page is rendered; page counter updates

#### Scenario: Empty genre

- GIVEN a genre returns zero results
- THEN "No books found" is displayed with a prompt to try another genre

### Requirement: Search Page

SHALL provide search input, submit-on-Enter, URL-encoded query, and paginated results grid.

#### Scenario: Search with results

- GIVEN the user types "dune" and presses Enter
- WHEN the search resolves
- THEN matching books appear in a results grid

#### Scenario: Special characters

- GIVEN the user searches "d'une" or "100%"
- WHEN the API call is made
- THEN the query is URL-encoded before transmission

#### Scenario: No results

- GIVEN a query returns empty
- THEN "No books found for your query" with refinement suggestions

### Requirement: Book Detail Page

SHALL render cover, title, author, description, metadata (genre, year, pages), rating, and similar books (≤5).

#### Scenario: Valid ID

- GIVEN the user navigates to `/books/{id}`
- WHEN detail and similar endpoints resolve
- THEN all fields plus up to 5 similar cards link to their detail pages

#### Scenario: Invalid ID

- GIVEN the API returns 404
- THEN "Book not found" with a link back to the landing page

### Requirement: Loading States

Every data-fetching page MUST display a skeleton or spinner while requests are in flight.

#### Scenario: Loading indicator

- GIVEN a search is submitted
- WHEN the API is pending
- THEN a spinner or skeleton grid appears until the response arrives

### Requirement: Routing

SHALL use React Router v6 with shared layout. Routes: `/` (Landing), `/genre-browse`, `/search`, `/books/:id`.

#### Scenario: Navigate via genre button

- GIVEN the user is on the landing page
- WHEN they click a genre button
- THEN they are navigated to `/genre-browse` with that genre pre-selected

### Requirement: Semantic HTML & Keyboard Nav

SHOULD use `<nav>`, `<main>`, `<section>`, provide `alt` on cover images, and support keyboard navigation for interactive controls.

#### Scenario: Keyboard-only

- GIVEN a keyboard-only user
- WHEN they tab through genre buttons
- THEN each button receives visible focus and activates on Enter/Space
