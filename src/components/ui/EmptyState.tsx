import { Flex, Text, Button } from '@radix-ui/themes';
import { Link } from 'react-router-dom';

interface EmptyStateProps {
  /** Icon/emoji to display (default "📚") */
  icon?: string;
  /** Main heading */
  title?: string;
  /** Descriptive message */
  description?: string;
  /** Optional label for a call-to-action link. When provided, a link button appears. */
  actionLabel?: string;
  /** Optional CTA URL (default "/") */
  actionTo?: string;
}

/**
 * Centered empty-state message with icon, title, and optional CTA.
 * Use for "No results found", "Book not found", etc.
 */
function EmptyState({
  icon = '📚',
  title = 'No results found',
  description = 'Try adjusting your search or browse a different genre.',
  actionLabel,
  actionTo = '/',
}: EmptyStateProps) {
  return (
    <Flex
      direction="column"
      align="center"
      justify="center"
      gap="3"
      py="8"
      px="4"
      style={{ textAlign: 'center' }}
    >
      <Text size="7">{icon}</Text>

      <Text size="4" weight="bold">
        {title}
      </Text>

      {description && (
        <Text size="2" color="gray" style={{ maxWidth: 360 }}>
          {description}
        </Text>
      )}

      {actionLabel && (
        <Button variant="soft" asChild>
          <Link to={actionTo}>{actionLabel}</Link>
        </Button>
      )}
    </Flex>
  );
}

export default EmptyState;
