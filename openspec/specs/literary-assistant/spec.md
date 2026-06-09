# Literary Assistant Specification

## Purpose

Botpress webchat integration enabling context-aware book recommendations, conversation starters triggered from the catalog UI, and proactive assistant prompts.

## Requirements

### Requirement: Webchat Embed

The system MUST embed the Botpress webchat script (v3.x) in `index.html`, initializing with a custom config for theme color, proactive message, and container positioning.

#### Scenario: Chat loads on page visit

- GIVEN the page loads with a valid Botpress client ID
- WHEN the webchat script initializes
- THEN a chat bubble appears in the bottom-right corner and is ready for input

#### Scenario: Proactive greeting

- GIVEN the webchat has loaded
- WHEN 5 seconds of inactivity elapse
- THEN a proactive message bubble appears with "Ask me about any book!" or equivalent

#### Scenario: Webchat config error

- GIVEN the Botpress client ID is missing or invalid
- WHEN the page loads
- THEN the webchat does not render and a console warning is logged; the rest of the app is unaffected

### Requirement: Catalog-to-Chat Events

The system MUST dispatch custom `CustomEvent` objects from catalog pages that the Botpress chatbot can observe, enabling context-aware conversations.

Events:
- `bookvault:recommend-books` — dispatched from Genre Browse with `{ genre: string }`
- `bookvault:ask-about-book` — dispatched from Book Detail with `{ id: string, title: string, author: string }`
- `bookvault:search-results` — dispatched from Search with `{ query: string, count: number }`

#### Scenario: Ask about a specific book

- GIVEN the user is on a book detail page
- WHEN they click "Ask the Bot"
- THEN a `bookvault:ask-about-book` event is dispatched with the book's id, title, and author
- AND the webchat opens with a prompt about that book

#### Scenario: Genre recommendation trigger

- GIVEN the user is browsing a genre page
- WHEN they click "Get Recommendations"
- THEN a `bookvault:recommend-books` event is dispatched with the genre name
- AND the webchat opens with "Recommend me some {genre} books"

### Requirement: Proactive Triggers

The system SHOULD fire proactive chat prompts based on user behavior without explicit button clicks.

#### Scenario: Post-search suggestion

- GIVEN the user has just completed a search
- WHEN results are displayed
- THEN a subtle "Want to chat about these results?" indicator appears near the chat bubble

#### Scenario: Page-visit trigger

- GIVEN the user navigates to a book detail page
- WHEN the page loads
- THEN a `bookvault:page-view` event fires with `{ page: "book-detail", id }`
- AND if the user has not interacted with chat recently, no proactive prompt is shown (avoids annoyance)

### Requirement: Visual Theme Integration

The webchat SHOULD use Botpress config to match the BookVault Radix UI dark/light theme: accent color, border radius, and font family consistent with the app.

#### Scenario: Dark mode matching

- GIVEN the app renders in dark mode
- WHEN the webchat initializes
- THEN the chat header, buttons, and bubbles use the Radix dark theme primary color

#### Scenario: Light mode matching

- GIVEN the app renders in light mode
- WHEN the webchat initializes
- THEN the chat uses the Radix light theme primary color

### Requirement: Graceful Degradation

The system MUST not block page rendering or functionality if the Botpress script fails to load or throws an error.

#### Scenario: Botpress CDN unavailable

- GIVEN the Botpress script CDN is unreachable
- WHEN the page loads
- THEN the page renders fully without the chat bubble
- AND no JavaScript errors propagate to the main app
