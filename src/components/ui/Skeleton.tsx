import { Flex } from '@radix-ui/themes';

interface SkeletonProps {
  /** Number of skeleton cards to show (default 6) */
  count?: number;
}

/**
 * Animated placeholder card with pulse animation.
 * Mimics the BookCard layout: cover image area + title line + author line.
 */
function Skeleton({ count = 6 }: SkeletonProps) {
  return (
    <Flex
      gap="4"
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
      }}
    >
      {Array.from({ length: count }, (_, i) => (
        <Flex key={i} direction="column" gap="2" style={{ width: '100%' }}>
          {/* Cover skeleton */}
          <Flex
            style={{
              aspectRatio: '3 / 4',
              borderRadius: 'var(--radius-2)',
              background: 'var(--gray-4)',
              animation: 'skeleton-pulse 1.5s ease-in-out infinite',
            }}
          />

          {/* Title line */}
          <Flex
            style={{
              height: 14,
              width: '80%',
              borderRadius: 'var(--radius-1)',
              background: 'var(--gray-4)',
              animation: 'skeleton-pulse 1.5s ease-in-out infinite',
            }}
          />

          {/* Author line */}
          <Flex
            style={{
              height: 12,
              width: '50%',
              borderRadius: 'var(--radius-1)',
              background: 'var(--gray-4)',
              animation: 'skeleton-pulse 1.5s ease-in-out infinite',
            }}
          />
        </Flex>
      ))}
    </Flex>
  );
}

export default Skeleton;
