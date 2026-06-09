import { Link, useLocation } from 'react-router-dom';
import { Flex, Text, Button } from '@radix-ui/themes';

function Header() {
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <Flex
      asChild
      align="center"
      justify="between"
      px="4"
      py="3"
      style={{ borderBottom: '1px solid var(--gray-5)' }}
    >
      <header>
        {/* Logo */}
        <Link to="/" style={{ textDecoration: 'none' }}>
          <Text size="5" weight="bold" style={{ letterSpacing: '-0.02em' }}>
            BookVault
          </Text>
        </Link>

        {/* Navigation */}
        <Flex asChild gap="2" align="center">
          <nav>
            <Button variant={isActive('/') ? 'solid' : 'ghost'} asChild>
              <Link to="/">Home</Link>
            </Button>
            <Button variant={isActive('/genre-browse') ? 'solid' : 'ghost'} asChild>
              <Link to="/genre-browse">Browse</Link>
            </Button>
            <Button variant={isActive('/search') ? 'solid' : 'ghost'} asChild>
              <Link to="/search">Search</Link>
            </Button>
          </nav>
        </Flex>
      </header>
    </Flex>
  );
}

export default Header;
