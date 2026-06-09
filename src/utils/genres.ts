export interface Genre {
  name: string;
  slug: string;
}

export const GENRES: Genre[] = [
  { name: 'Fiction', slug: 'fiction' },
  { name: 'Fantasy', slug: 'fantasy' },
  { name: 'Science Fiction', slug: 'science_fiction' },
  { name: 'Mystery', slug: 'mystery' },
  { name: 'Romance', slug: 'romance' },
  { name: 'Non-Fiction', slug: 'non-fiction' },
  { name: 'Biography', slug: 'biography' },
  { name: 'History', slug: 'history' },
  { name: 'Thriller', slug: 'thriller' },
  { name: 'Young Adult', slug: 'young_adult' },
];

/** Lookup a genre name by its slug. */
export function genreNameFromSlug(slug: string): string | undefined {
  return GENRES.find((g) => g.slug === slug)?.name;
}

/** Lookup a genre slug by its name. */
export function slugFromGenreName(name: string): string | undefined {
  return GENRES.find((g) => g.name === name)?.slug;
}
