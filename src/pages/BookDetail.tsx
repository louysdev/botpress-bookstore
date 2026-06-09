import { useParams } from 'react-router-dom';
import {
  Container,
  Heading,
  Text,
  Flex,
  Grid,
  Button,
  Card,
  Badge,
} from '@radix-ui/themes';
import { useBookDetail } from '../hooks/useBigBook';
import SimilarBooks from '../components/book/SimilarBooks';
import Skeleton from '../components/ui/Skeleton';
import EmptyState from '../components/ui/EmptyState';
import { fireCustomEvent } from '../components/botpress/EventDispatcher';

function BookDetail() {
  const { id } = useParams<{ id: string }>();
  const { book, loading, error } = useBookDetail(id ?? '');

  const handleAskBot = () => {
    if (book) {
      fireCustomEvent('bookvault:ask-about-book', {
        id: book.id,
        title: book.title,
        author: book.author,
      });
    }
  };

  // Loading state
  if (loading) {
    return (
      <Container size="3" px="4" py="6">
        <Grid columns="1" gap="6">
          <Skeleton count={1} />
          <Skeleton count={3} />
        </Grid>
      </Container>
    );
  }

  // Error / not found
  if (error || !book || book.isFallback) {
    return (
      <Container size="3" px="4" py="6">
        <EmptyState
          title="Book not found"
          description="The book you are looking for could not be found."
          actionLabel="Go Home"
          actionTo="/"
        />
      </Container>
    );
  }

  const ratingStars = book.rating
    ? `${Math.round(book.rating * 10) / 10} / 5`
    : null;

  return (
    <Container size="3" px="4" py="6">
      <Grid columns={{ initial: '1', md: '300px 1fr' }} gap="6">
        {/* Cover image */}
        <Card>
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
              />
            ) : (
              <Text size="6" color="gray">
                No Cover
              </Text>
            )}
          </Flex>
        </Card>

        {/* Book info */}
        <Flex direction="column" gap="4">
          <Heading size="7">{book.title}</Heading>

          <Text size="3" color="gray">
            by {book.author}
          </Text>

          {ratingStars && (
            <Flex align="center" gap="2">
              <Badge color="amber" size="2">
                {ratingStars}
              </Badge>
            </Flex>
          )}

          {/* Metadata */}
          <Flex gap="3" wrap="wrap">
            {book.year && (
              <Badge variant="soft" color="gray">
                {book.year}
              </Badge>
            )}
            {book.pages && (
              <Badge variant="soft" color="gray">
                {book.pages} pages
              </Badge>
            )}
          </Flex>

          {/* Genres */}
          {book.genres.length > 0 && (
            <Flex gap="2" wrap="wrap">
              {book.genres.map((genre) => (
                <Badge key={genre} variant="surface" color="blue">
                  {genre}
                </Badge>
              ))}
            </Flex>
          )}

          {/* Description */}
          {book.description && (
            <Text size="2" style={{ lineHeight: 1.7 }}>
              {book.description}
            </Text>
          )}

          {/* Action buttons */}
          <Flex gap="3" mt="2">
            <Button size="3" onClick={handleAskBot}>
              Ask the Bot about this book
            </Button>
          </Flex>
        </Flex>
      </Grid>

      {/* Similar books */}
      {book.similar && book.similar.length > 0 && (
        <Flex mt="8">
          <SimilarBooks books={book.similar} />
        </Flex>
      )}
    </Container>
  );
}

export default BookDetail;
