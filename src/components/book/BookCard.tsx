import { Link } from 'react-router-dom';
import { Card, Flex, Text } from '@radix-ui/themes';
import type { Book } from '../../types/book';

interface BookCardProps {
  book: Book;
}

/**
 * Card displaying a book's cover image, title, author, and rating.
 * Links to `/books/:id`.
 */
function BookCard({ book }: BookCardProps) {
  const ratingStar =
    book.rating != null
      ? `${Math.round(book.rating * 10) / 10} ★`
      : null;

  const content = (
    <Card
      style={{ height: '100%', cursor: 'pointer' }}
      variant={book.isFallback ? 'surface' : 'classic'}
    >
      <Flex direction="column" gap="2" style={{ height: '100%' }}>
        {/* Cover image */}
        <Flex
          align="center"
          justify="center"
          style={{
            aspectRatio: '3 / 4',
            overflow: 'hidden',
            borderRadius: 'var(--radius-2)',
            background: 'var(--gray-3)',
          }}
        >
          {book.image ? (
            <img
              src={book.image}
              alt={`Cover of ${book.title}`}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
              }}
              loading="lazy"
            />
          ) : (
            <Text size="6" color="gray">
              📖
            </Text>
          )}
        </Flex>

        {/* Title */}
        <Text size="2" weight="bold" style={{ lineClamp: 2 }}>
          {book.title}
        </Text>

        {/* Author */}
        <Text size="1" color="gray" style={{ marginTop: 'auto' }}>
          {book.author}
        </Text>

        {/* Rating */}
        {ratingStar && (
          <Text size="1" color="amber">
            {ratingStar}
          </Text>
        )}

        {/* Fallback badge */}
        {book.isFallback && (
          <Text size="1" color="gray" style={{ fontStyle: 'italic' }}>
            Data unavailable
          </Text>
        )}
      </Flex>
    </Card>
  );

  // Wrap in a link unless it's a fallback placeholder
  if (book.isFallback) {
    return content;
  }

  return (
    <Link to={`/books/${book.id}`} style={{ textDecoration: 'none' }}>
      {content}
    </Link>
  );
}

export default BookCard;
