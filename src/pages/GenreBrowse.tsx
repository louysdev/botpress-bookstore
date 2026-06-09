import { useSearchParams } from 'react-router-dom';
import { Container, Heading, Flex, Button } from '@radix-ui/themes';
import { useSearchBooks } from '../hooks/useBigBook';
import BookGrid from '../components/book/BookGrid';
import Skeleton from '../components/ui/Skeleton';
import EmptyState from '../components/ui/EmptyState';
import { GENRES, genreNameFromSlug } from '../utils/genres';
import { fireCustomEvent } from '../components/botpress/EventDispatcher';

function GenreBrowse() {
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedGenre = searchParams.get('genre') || '';
  const genreName = genreNameFromSlug(selectedGenre);

  const { books, loading, error, hasMore, loadMore } =
    useSearchBooks('', selectedGenre);

  const topGenres = GENRES.slice(0, 8);

  const handleGenreSelect = (slug: string) => {
    setSearchParams(slug ? { genre: slug } : {});
  };

  const handleGetRecommendations = () => {
    if (selectedGenre) {
      fireCustomEvent('bookvault:recommend-books', { genre: selectedGenre });
    }
  };

  return (
    <Container size="3" px="4" py="6">
      <Heading size="7" mb="4">
        {genreName || 'Browse by Genre'}
      </Heading>

      {/* Genre selector */}
      <Flex gap="2" wrap="wrap" mb="6">
        <Button
          variant={!selectedGenre ? 'solid' : 'soft'}
          onClick={() => handleGenreSelect('')}
        >
          All Genres
        </Button>
        {topGenres.map((genre) => (
          <Button
            key={genre.slug}
            variant={selectedGenre === genre.slug ? 'solid' : 'soft'}
            onClick={() => handleGenreSelect(genre.slug)}
          >
            {genre.name}
          </Button>
        ))}
      </Flex>

      {/* Content */}
      {!selectedGenre ? (
        <EmptyState
          title="Select a genre to start browsing"
          description="Choose a genre from above to discover books you'll love."
        />
      ) : loading ? (
        <Skeleton count={6} />
      ) : error ? (
        <EmptyState
          title="Failed to load books"
          description="Something went wrong. Please try again."
        />
      ) : books.length === 0 ? (
        <EmptyState
          title="No books found"
          description={`No books found for "${genreName}". Try another genre.`}
        />
      ) : (
        <>
          <BookGrid books={books} />

          <Flex justify="center" gap="3" mt="6">
            {hasMore && (
              <Button variant="soft" size="3" onClick={loadMore}>
                Load More
              </Button>
            )}

            <Button
              variant="solid"
              size="3"
              onClick={handleGetRecommendations}
            >
              Get Recommendations
            </Button>
          </Flex>
        </>
      )}
    </Container>
  );
}

export default GenreBrowse;
