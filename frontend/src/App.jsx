import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './App.css';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import ProtectedRoute from './components/shared/ProtectedRoute';
import ScrollToTop from './components/shared/ScrollToTop';
import Spinner from './components/ui/Spinner';

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
  return (
    <BrowserRouter>
      <AuthProvider>
        <ScrollToTop />
        <div className="app-layout">
          <Navbar />
          <main className="main-content">
            <Suspense fallback={<PageLoader />}>
              <Routes>
                {/* Public */}
                <Route path="/" element={<Landing />} />
                <Route path="/companies" element={<Companies />} />
                <Route path="/company/:slug" element={<CompanyDetail />} />
                <Route path="/questions/:slug" element={<QuestionDetail />} />
                <Route path="/search" element={<Search />} />
                <Route path="/topics" element={<Topics />} />
                <Route path="/topics/:topic" element={<TopicDetail />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />

                {/* Protected */}
                <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                <Route path="/bookmarks" element={<ProtectedRoute><Bookmarks /></ProtectedRoute>} />
                <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />

                {/* 404 */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </main>
          <Footer />
        </div>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
