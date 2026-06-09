import { useState, useEffect } from 'react';
import { Container, Heading, Text, Flex, Button, TextField } from '@radix-ui/themes';
import { useSearchBooks } from '../hooks/useBigBook';
import { useDebounce } from '../hooks/useDebounce';
import BookGrid from '../components/book/BookGrid';
import Skeleton from '../components/ui/Skeleton';
import EmptyState from '../components/ui/EmptyState';
import { fireCustomEvent } from '../components/botpress/EventDispatcher';

function Search() {
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, 300);

  const { books, loading, error, hasMore, loadMore } =
    useSearchBooks(debouncedQuery);

  // Fire event when search results change
  useEffect(() => {
    if (debouncedQuery.trim() && books.length > 0 && !loading) {
      fireCustomEvent('bookvault:search-results', {
        query: debouncedQuery,
        count: books.length,
      });
    }
  }, [debouncedQuery, books.length, loading]);

  return (
    <Container size="3" px="4" py="6">
      <Heading size="7" mb="4">
        Search Books
      </Heading>

      {/* Search input */}
      <Flex gap="3" mb="6">
        <TextField.Root
          size="3"
          style={{ flex: 1 }}
          placeholder="Search by title, author, or genre..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
          }}
        />
      </Flex>

      {/* Results */}
      {!debouncedQuery.trim() ? (
        <EmptyState
          title="Search for your next read..."
          description="Type a title, author, or genre to start exploring."
        />
      ) : loading ? (
        <Skeleton count={6} />
      ) : error ? (
        <EmptyState
          title="Search failed"
          description="Something went wrong. Please try again."
        />
      ) : books.length === 0 ? (
        <EmptyState
          title="No books found for your query"
          description="Try different keywords or browse by genre instead."
          actionLabel="Browse Genres"
          actionTo="/genre-browse"
        />
      ) : (
        <>
          <Text size="2" color="gray" mb="4">
            Found {books.length} result{books.length !== 1 ? 's' : ''}
          </Text>

          <BookGrid books={books} />

          {hasMore && (
            <Flex justify="center" mt="6">
              <Button variant="soft" size="3" onClick={loadMore}>
                Load More
              </Button>
            </Flex>
          )}
        </>
      )}
    </Container>
  );
}

export default Search;
