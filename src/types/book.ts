export interface Book {
  id: string;
  title: string;
  author: string;
  image?: string;
  rating?: number;
  genres: string[];
  description?: string;
  year?: number;
  pages?: number;
  /** true when returned from 429/5xx fallback */
  isFallback?: boolean;
}

export interface BookDetail extends Book {
  similar: Book[];
}
