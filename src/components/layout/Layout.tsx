import { Outlet } from 'react-router-dom';
import { Box } from '@radix-ui/themes';
import Header from './Header';
import Footer from './Footer';

function Layout() {
  return (
    <Box style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Header />
      <Box asChild flexGrow="1" style={{ flex: 1 }}>
        <main>
          <Outlet />
        </main>
      </Box>
      <Footer />
    </Box>
  );
}

export default Layout;
