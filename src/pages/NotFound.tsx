import { Link } from 'react-router-dom';
import { Flex, Heading, Text, Button } from '@radix-ui/themes';

function NotFound() {
  return (
    <Flex
      direction="column"
      align="center"
      justify="center"
      gap="4"
      py="8"
      px="4"
      style={{ textAlign: 'center', minHeight: '60vh' }}
    >
      <Heading size="9" weight="bold" color="gray">
        404
      </Heading>

      <Heading size="5" weight="medium">
        Page not found
      </Heading>

      <Text size="2" color="gray" style={{ maxWidth: 360 }}>
        The page you are looking for does not exist or has been moved.
      </Text>

      <Button variant="soft" size="3" asChild>
        <Link to="/">Go Home</Link>
      </Button>
    </Flex>
  );
}

export default NotFound;
