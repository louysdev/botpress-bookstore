import { Grid } from '@radix-ui/themes';
import type { Book } from '../../types/book';
import BookCard from './BookCard';

interface BookGridProps {
  books: Book[];
}

/**
 * Responsive grid of BookCards.
 * Uses auto-fill with a minimum column width of 200px.
 */
function BookGrid({ books }: BookGridProps) {
  if (books.length === 0) return null;

  return (
    <Grid
      columns="repeat(auto-fill, minmax(200px, 1fr))"
      gap="4"
      width="auto"
    >
      {books.map((book) => (
        <BookCard key={book.id} book={book} />
      ))}
    </Grid>
  );
}

export default BookGrid;
