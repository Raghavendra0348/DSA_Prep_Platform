import { useState, useEffect, useRef, useCallback } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import {
  
  Code2, Menu, X, LayoutDashboard, Bookmark, User, LogOut,
  Building2, BookOpen, Search, ChevronDown, Sparkles, Command,
  ArrowRight
} from 'lucide-react';
import { search as apiSearch } from '../../api/search';
import LeetCodeIcon from '../ui/LeetCodeIcon';
import './Navbar.css';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // Quick Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  const dropdownRef = useRef(null);
  const searchRef = useRef(null);
  const searchInputRef = useRef(null);
  const debounceRef = useRef(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setSearchOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Keyboard shortcut Cmd+K focuses the search bar
  useEffect(() => {
    function handleKeyDown(e) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
        setSearchOpen(true);
      }
      if (e.key === 'Escape') {
        setDropdownOpen(false);
        setMenuOpen(false);
        setSearchOpen(false);
        setSearchQuery('');
        searchInputRef.current?.blur();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [menuOpen]);

  // Debounced search call
  const handleSearchInput = useCallback((e) => {
    const val = e.target.value;
    setSearchQuery(val);
    setSearchOpen(true);

    clearTimeout(debounceRef.current);
    if (val.trim().length < 2) {
      setSearchResults(null);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const data = await apiSearch(val.trim(), 'all', undefined, 6);
        setSearchResults(data);
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setSearchLoading(false);
      }
    }, 280);
  }, []);

  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults(null);
    setSearchOpen(false);
  };

  const handleResultClick = (path) => {
    navigate(path);
    clearSearch();
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim().length >= 2) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      clearSearch();
    }
  };

  const handleLogout = async () => {
    await logout();
    setDropdownOpen(false);
    setMenuOpen(false);
    navigate('/');
  };

  // Flatten search results
  const questions = Array.isArray(searchResults?.questions?.results)
    ? searchResults.questions.results
    : Array.isArray(searchResults?.questions) ? searchResults.questions : [];
  const topics = Array.isArray(searchResults?.topics?.results)
    ? searchResults.topics.results
    : Array.isArray(searchResults?.topics) ? searchResults.topics : [];
  const companies = Array.isArray(searchResults?.companies?.results)
    ? searchResults.companies.results
    : Array.isArray(searchResults?.companies) ? searchResults.companies : [];

  const hasResults = questions.length > 0 || topics.length > 0 || companies.length > 0;
  const showDropdown = searchOpen && searchQuery.trim().length >= 2;

  return (
    <header className="navbar-header">
      <nav className="navbar">
        <div className="navbar-inner container">

          {/* ── Brand Logo ──────────────────────────────────────────────── */}
          <Link to="/" className="navbar-brand" onClick={() => setMenuOpen(false)}>
            <Code2 size={20} className="brand-icon" />
            <div className="brand-text">
              <span className="brand-name">DSA<span className="brand-accent">Prep</span></span>
            </div>
          </Link>

          {/* ── Center: Nav Links + Search Bar ──────────────────────────── */}
          <div className="navbar-center">
            <div className="nav-links-desktop">
              <NavLink to="/companies" className="nav-link">
                <Building2 size={16} />
                <span>Companies</span>
              </NavLink>
              <NavLink to="/topics" className="nav-link">
                <BookOpen size={16} />
                <span>Topics</span>
              </NavLink>
              {user && (
                <NavLink to="/dashboard" className="nav-link">
                  <LayoutDashboard size={16} />
                  <span>Dashboard</span>
                </NavLink>
              )}
            </div>

            {/* Powered Quick Search Bar */}
            <div className="navbar-search-wrap" ref={searchRef}>
              <form className="navbar-search-form" onSubmit={handleSearchSubmit}>
                <Search size={14} className="navbar-search-icon" />
                <input
                  ref={searchInputRef}
                  type="text"
                  className="navbar-search-input"
                  placeholder="Quick Search..."
                  value={searchQuery}
                  onChange={handleSearchInput}
                  onFocus={() => setSearchOpen(true)}
                  autoComplete="off"
                  spellCheck={false}
                />
                {searchQuery ? (
                  <button type="button" className="search-clear-btn" onClick={clearSearch}>
                    <X size={13} />
                  </button>
                ) : (
                  <span className="search-btn-shortcut">
                    <Command size={10} />K
                  </span>
                )}
              </form>

              {/* Search Dropdown Results */}
              {showDropdown && (
                <div className="search-dropdown">
                  {searchLoading ? (
                    <div className="search-dropdown-loading">
                      <span className="search-spinner" />
                      <span>Searching...</span>
                    </div>
                  ) : !hasResults ? (
                    <div className="search-dropdown-empty">No results for "{searchQuery}"</div>
                  ) : (
                    <>
                      {questions.length > 0 && (
                        <div className="search-dropdown-section">
                          <p className="search-dropdown-label">Questions</p>
                          {questions.slice(0, 4).map(q => (
                            <button
                              key={q.id || q.slug}
                              className="search-dropdown-item"
                              onClick={() => handleResultClick(`/questions/${q.slug}`)}
                            >
                              <LeetCodeIcon size={15} className="search-item-lc-icon" />
                              <span className="search-item-title">{q.title}</span>
                              <span className={`search-item-diff diff-${q.difficulty?.toLowerCase()}`}>
                                {q.difficulty}
                              </span>
                            </button>
                          ))}
                        </div>
                      )}

                      {companies.length > 0 && (
                        <div className="search-dropdown-section">
                          <p className="search-dropdown-label">Companies</p>
                          {companies.slice(0, 3).map(c => (
                            <button
                              key={c.slug || c.name}
                              className="search-dropdown-item"
                              onClick={() => handleResultClick(`/company/${c.slug}`)}
                            >
                              <Building2 size={14} className="search-item-icon" />
                              <span className="search-item-title">{c.name}</span>
                              <span className="search-item-meta">{c.questionCount} problems</span>
                            </button>
                          ))}
                        </div>
                      )}

                      {topics.length > 0 && (
                        <div className="search-dropdown-section">
                          <p className="search-dropdown-label">Topics</p>
                          {topics.slice(0, 3).map(t => (
                            <button
                              key={t.name || t.slug}
                              className="search-dropdown-item"
                              onClick={() => handleResultClick(`/topics/${(t.slug || t.name || '').toLowerCase().replace(/\s+/g, '-')}`)}
                            >
                              <BookOpen size={14} className="search-item-icon" />
                              <span className="search-item-title">{t.name}</span>
                              <span className="search-item-meta">{(t.questionCount ?? t.problemCount) || 0} problems</span>
                            </button>
                          ))}
                        </div>
                      )}

                      <button
                        className="search-dropdown-all"
                        onClick={() => { navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`); clearSearch(); }}
                      >
                        <span>View all results for "{searchQuery}"</span>
                        <ArrowRight size={14} />
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* ── Right: Auth / Profile ────────────────────────────────────── */}
          <div className="navbar-right">
            {user ? (
              <div className="user-menu" ref={dropdownRef}>
                <button
                  className={`user-menu-trigger ${dropdownOpen ? 'active' : ''}`}
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  aria-label="User menu"
                  aria-expanded={dropdownOpen}
                >
                  <div className="user-avatar">
                    {user.name?.charAt(0).toUpperCase()}
                  </div>
                  <span className="user-name">{user.name}</span>
                  <ChevronDown size={14} className={`dropdown-arrow ${dropdownOpen ? 'open' : ''}`} />
                </button>

                {dropdownOpen && (
                  <div className="user-dropdown">
                    <div className="dropdown-user-header">
                      <div className="dropdown-avatar-large">
                        {user.name?.charAt(0).toUpperCase()}
                      </div>
                      <div className="dropdown-user-info">
                        <p className="dropdown-user-name">{user.name}</p>
                        <p className="dropdown-user-email">{user.email}</p>
                      </div>
                    </div>
                    <div className="dropdown-divider" />
                    <Link to="/dashboard" className="dropdown-item" onClick={() => setDropdownOpen(false)}>
                      <LayoutDashboard size={16} /><span>Dashboard</span>
                    </Link>
                    <Link to="/bookmarks" className="dropdown-item" onClick={() => setDropdownOpen(false)}>
                      <Bookmark size={16} /><span>Bookmarks</span>
                    </Link>
                    <Link to="/profile" className="dropdown-item" onClick={() => setDropdownOpen(false)}>
                      <User size={16} /><span>Profile Settings</span>
                    </Link>
                    <div className="dropdown-divider" />
                    <button className="dropdown-item logout" onClick={handleLogout}>
                      <LogOut size={16} /><span>Log Out</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="auth-buttons">
                <Link to="/login" className="btn-nav-ghost">Log In</Link>
                <Link to="/register" className="btn-nav-primary">
                  <Sparkles size={14} /><span>Get Started</span>
                </Link>
              </div>
            )}

            {/* Mobile Hamburger */}
            <button
              className="navbar-toggle"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            >
              {menuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>

        {/* ── Mobile Navigation Drawer ─────────────────────────────────── */}
        {menuOpen && (
          <>
            <div className="mobile-drawer-backdrop" onClick={() => setMenuOpen(false)} aria-hidden="true" />
            <div className="mobile-drawer">
            <div className="mobile-drawer-content">
              {/* <form
                className="mobile-search-form"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (searchQuery.trim()) {
                    navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
                    setMenuOpen(false);
                  }
                }}
              >
                <Search size={16} />
                <input
                  type="text"
                  className="mobile-search-input"
                  placeholder="Search problems, companies, topics..."
                  value={searchQuery}
                  onChange={handleSearchInput}
                  autoComplete="off"
                />
              </form> */}

              <div className="mobile-nav-group">
                <p className="mobile-group-title">Navigation</p>
                <NavLink to="/companies" className="mobile-nav-link" onClick={() => setMenuOpen(false)}>
                  <Building2 size={18} /><span>Companies</span>
                </NavLink>
                <NavLink to="/topics" className="mobile-nav-link" onClick={() => setMenuOpen(false)}>
                  <BookOpen size={18} /><span>Topics</span>
                </NavLink>
                {user && (
                  <NavLink to="/dashboard" className="mobile-nav-link" onClick={() => setMenuOpen(false)}>
                    <LayoutDashboard size={18} /><span>Dashboard</span>
                  </NavLink>
                )}
              </div>

              {user ? (
                <div className="mobile-nav-group">
                  <p className="mobile-group-title">Account ({user.name})</p>
                  <NavLink to="/bookmarks" className="mobile-nav-link" onClick={() => setMenuOpen(false)}>
                    <Bookmark size={18} /><span>Bookmarks</span>
                  </NavLink>
                  <NavLink to="/profile" className="mobile-nav-link" onClick={() => setMenuOpen(false)}>
                    <User size={18} /><span>Profile</span>
                  </NavLink>
                  <button className="mobile-nav-link mobile-logout" onClick={handleLogout}>
                    <LogOut size={18} /><span>Log Out</span>
                  </button>
                </div>
              ) : (
                <div className="mobile-auth-actions">
                  <Link to="/login" className="btn-mobile-ghost" onClick={() => setMenuOpen(false)}>Log In</Link>
                  <Link to="/register" className="btn-mobile-primary" onClick={() => setMenuOpen(false)}>
                    <Sparkles size={16} /><span>Get Started</span>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </nav>
    </header>
  );
}
