import { useNavigate } from 'react-router-dom';
import { Container, Heading, Text, Flex, Button, Grid } from '@radix-ui/themes';
import { useFeaturedBooks } from '../hooks/useBigBook';
import BookGrid from '../components/book/BookGrid';
import Skeleton from '../components/ui/Skeleton';
import EmptyState from '../components/ui/EmptyState';
import { GENRES } from '../utils/genres';

function Landing() {
  const navigate = useNavigate();
  const { books, loading, error } = useFeaturedBooks();

  const topGenres = GENRES.slice(0, 8);

  return (
    <Container size="3" px="4" py="6">
      {/* Hero section */}
      <Flex
        direction="column"
        align="center"
        gap="4"
        py="8"
        style={{ textAlign: 'center' }}
      >
        <Heading size="8" weight="bold">
          Discover Your Next Read
        </Heading>
        <Text size="4" color="gray" style={{ maxWidth: 480 }}>
          Browse thousands of books across every genre. Find your next favorite
          book today.
        </Text>
        <Button size="3" onClick={() => navigate('/genre-browse')}>
          Start Browsing
        </Button>
      </Flex>

      {/* Featured books section */}
      <Heading size="5" mb="4">
        Featured Books
      </Heading>

      {loading ? (
        <Skeleton count={6} />
      ) : error ? (
        <EmptyState
          title="Unable to load featured books"
          description="Please try again later."
        />
      ) : (
        <BookGrid books={books} />
      )}

      {/* Genre quick-picks */}
      <Heading size="5" mb="4" mt="8">
        Browse by Genre
      </Heading>

      <Grid columns="repeat(auto-fill, minmax(140px, 1fr))" gap="3">
        {topGenres.map((genre) => (
          <Button
            key={genre.slug}
            variant="soft"
            size="3"
            onClick={() =>
              navigate(`/genre-browse?genre=${encodeURIComponent(genre.slug)}`)
            }
          >
            {genre.name}
          </Button>
        ))}
      </Grid>
    </Container>
  );
}

export default Landing;
