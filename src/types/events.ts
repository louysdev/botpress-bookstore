export type BookVaultEvent =
  | { type: 'bookvault:recommend-books'; detail: { genre: string } }
  | { type: 'bookvault:ask-about-book'; detail: { id: string; title: string; author: string } }
  | { type: 'bookvault:search-results'; detail: { query: string; count: number } }
  | { type: 'bookvault:page-view'; detail: { page: string; id?: string } }
  | { type: 'bookvault:navigate-to-book'; detail: { id: string } };
