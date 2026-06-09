import { Flex, Text } from '@radix-ui/themes';
import { Link } from 'react-router-dom';
import type { Book } from '../../types/book';

interface SimilarBooksProps {
  books: Book[];
}

/**
 * Horizontal scrollable row of up to 5 small book cards for the detail page.
 */
function SimilarBooks({ books }: SimilarBooksProps) {
  if (books.length === 0) return null;

  return (
    <Flex direction="column" gap="3">
      <Text size="3" weight="bold">
        Similar Books
      </Text>

      <Flex
        gap="3"
        style={{ overflowX: 'auto', paddingBottom: 'var(--space-2)' }}
      >
        {books.slice(0, 5).map((book) => (
          <Link
            key={book.id}
            to={`/books/${book.id}`}
            style={{ textDecoration: 'none', flexShrink: 0, width: 120 }}
          >
            <Flex direction="column" gap="1">
              {/* Small cover thumbnail */}
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
                  <Text size="4" color="gray">
                    📖
                  </Text>
                )}
              </Flex>

              <Text size="1" weight="bold" style={{ lineClamp: 2 }}>
                {book.title}
              </Text>
            </Flex>
          </Link>
        ))}
      </Flex>
    </Flex>
  );
}

export default SimilarBooks;
