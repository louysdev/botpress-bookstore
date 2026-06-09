import { Flex, Text } from '@radix-ui/themes';

function Footer() {
  return (
    <Flex
      asChild
      justify="center"
      align="center"
      px="4"
      py="4"
      style={{ borderTop: '1px solid var(--gray-5)', marginTop: 'auto' }}
    >
      <footer>
        <Text size="1" color="gray">
          Powered by{' '}
          <Text
            as="span"
            size="1"
            style={{ fontWeight: 500 }}
          >
            Big Book API
          </Text>
          {' · '}Built with Botpress
        </Text>
      </footer>
    </Flex>
  );
}

export default Footer;
