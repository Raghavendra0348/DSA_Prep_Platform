import { lazy, Suspense, useState, useCallback } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './App.css';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './components/ui/Toast';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import ProtectedRoute from './components/shared/ProtectedRoute';
import ErrorBoundary from './components/shared/ErrorBoundary';
import ScrollToTop from './components/shared/ScrollToTop';
import Spinner from './components/ui/Spinner';
import CommandPalette from './components/ui/CommandPalette';
import { useKeyboard } from './hooks/useKeyboard';

// ── Lazy-loaded pages (code-splitting) ───────────────────────────────────────
const Landing        = lazy(() => import('./pages/Landing'));
const Companies      = lazy(() => import('./pages/Companies'));
const CompanyDetail  = lazy(() => import('./pages/CompanyDetail'));
const QuestionDetail = lazy(() => import('./pages/QuestionDetail'));
const Search         = lazy(() => import('./pages/Search'));
const Topics         = lazy(() => import('./pages/Topics'));
const TopicDetail    = lazy(() => import('./pages/TopicDetail'));
const Login          = lazy(() => import('./pages/Login'));
const Register       = lazy(() => import('./pages/Register'));
const Dashboard      = lazy(() => import('./pages/Dashboard'));
const Bookmarks      = lazy(() => import('./pages/Bookmarks'));
const Profile        = lazy(() => import('./pages/Profile'));
const About          = lazy(() => import('./pages/About'));
const Privacy        = lazy(() => import('./pages/Privacy'));
const Terms          = lazy(() => import('./pages/Terms'));
const Contact        = lazy(() => import('./pages/Contact'));
const NotFound       = lazy(() => import('./pages/NotFound'));

// ── Suspense fallback ────────────────────────────────────────────────────────
function PageLoader() {
  return (
    <div className="page-loader">
      <Spinner size={32} />
    </div>
  );
}

function App() {
  const [paletteOpen, setPaletteOpen] = useState(false);

  // Ctrl+K / Cmd+K — global shortcut to open Command Palette
  const openPalette = useCallback(() => setPaletteOpen(true), []);
  useKeyboard('k', openPalette, { ctrlOrMeta: true });

  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <ScrollToTop />
          {/* Skip to main content for keyboard/screen-reader users */}
          <a className="skip-to-main" href="#main-content">Skip to main content</a>
          <div className="app-layout">
            <Navbar onOpenPalette={() => setPaletteOpen(true)} />
            <main className="main-content" id="main-content">
              <ErrorBoundary>
                <Suspense fallback={<PageLoader />}>
                  <Routes>
                    {/* PubliThe first one is a dynamic import.c */}
                    <Route path="/" element={<Landing />} />
                    <Route path="/companies" element={<Companies />} />
                    <Route path="/company/:slug" element={<CompanyDetail />} />
                    <Route path="/questions/:slug" element={<QuestionDetail />} />
                    <Route path="/search" element={<Search />} />
                    <Route path="/topics" element={<Topics />} />
                    <Route path="/topics/:topic" element={<TopicDetail />} />
                    <Route path="/about" element={<About />} />
                    <Route path="/privacy" element={<Privacy />} />
                    <Route path="/privacy-policy" element={<Privacy />} />
                    <Route path="/terms" element={<Terms />} />
                    <Route path="/terms-of-service" element={<Terms />} />
                    <Route path="/contact" element={<Contact />} />
                    <Route path="/support" element={<Contact />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />

                    {/* Protected */}
                    <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                    <Route path="/bookmarks" element={<ProtectedRoute><Bookmarks /></ProtectedRoute>} />
                    <Route path="/profile"   element={<ProtectedRoute><Profile /></ProtectedRoute>} />

                    {/* 404 */}
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </Suspense>
              </ErrorBoundary>
            </main>
            <Footer />
            <CommandPalette isOpen={paletteOpen} onClose={() => setPaletteOpen(false)} />
          </div>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
