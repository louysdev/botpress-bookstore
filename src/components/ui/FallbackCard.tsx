import { Card, Flex, Text } from '@radix-ui/themes';

interface FallbackCardProps {
  /** Title to display (default "Data Unavailable") */
  title?: string;
}

/**
 * Muted placeholder card displayed when the API is unavailable.
 * Shows a "Data Unavailable" badge and a subdued visual.
 */
function FallbackCard({ title = 'Data Unavailable' }: FallbackCardProps) {
  return (
    <Card variant="surface" style={{ opacity: 0.6 }}>
      <Flex direction="column" gap="2" align="center" py="4">
        {/* Icon placeholder */}
        <Text size="5" color="gray">
          ⚠️
        </Text>

        <Text size="2" weight="bold" color="gray" align="center">
          {title}
        </Text>

        <Text size="1" color="gray" align="center">
          Data temporarily unavailable.
        </Text>
      </Flex>
    </Card>
  );
}

export default FallbackCard;
