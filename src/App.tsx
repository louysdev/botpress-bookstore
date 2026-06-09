import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/layout/Layout';
import { BotpressProvider } from './components/botpress/BotpressProvider';
import Skeleton from './components/ui/Skeleton';

const Landing = lazy(() => import('./pages/Landing'));
const GenreBrowse = lazy(() => import('./pages/GenreBrowse'));
const Search = lazy(() => import('./pages/Search'));
const BookDetail = lazy(() => import('./pages/BookDetail'));
const NotFound = lazy(() => import('./pages/NotFound'));

function App() {
  return (
    <BrowserRouter>
      <BotpressProvider>
        <Suspense fallback={<Skeleton count={6} />}>
          <Routes>
            <Route element={<Layout />}>
              <Route path="/" element={<Landing />} />
              <Route path="/genre-browse" element={<GenreBrowse />} />
              <Route path="/search" element={<Search />} />
              <Route path="/books/:id" element={<BookDetail />} />
              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
        </Suspense>
      </BotpressProvider>
    </BrowserRouter>
  );
}

export default App;
