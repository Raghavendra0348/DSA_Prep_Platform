import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import {
  Search, Building2, BookOpen, Code2,
  LayoutDashboard, Bookmark, User, X, Command,
} from 'lucide-react';
import { search as apiSearch } from '../../api/search';
import { useDebounce } from '../../hooks/useDebounce';
import './CommandPalette.css';

/**
 * Global command palette — triggered by Ctrl+K / Cmd+K.
 * Searches companies, topics, and questions in real time.
 * Wire it into App.jsx or Navbar.jsx.
 */
export default function CommandPalette({ isOpen, onClose }) {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const inputRef = useRef(null);
  const debouncedQuery = useDebounce(query, 220);

  // Focus input on open
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setResults(null);
      setSelectedIdx(0);
      setTimeout(() => inputRef.current?.focus(), 40);
    }
  }, [isOpen]);

  // Fetch results
  useEffect(() => {
    if (!debouncedQuery.trim() || debouncedQuery.trim().length < 2) {
      setResults(null);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    apiSearch(debouncedQuery.trim(), 'all', undefined, 5)
      .then(data => { if (!cancelled) { setResults(data); setSelectedIdx(0); } })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [debouncedQuery]);

  // Flatten results into a navigable list
  const flatItems = buildFlatItems(results, query);

  // Keyboard navigation
  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Escape') { onClose(); return; }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIdx(i => (i + 1) % Math.max(flatItems.length, 1));
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIdx(i => (i - 1 + Math.max(flatItems.length, 1)) % Math.max(flatItems.length, 1));
    }
    if (e.key === 'Enter' && flatItems[selectedIdx]) {
      navigate(flatItems[selectedIdx].path);
      onClose();
    }
  }, [flatItems, selectedIdx, navigate, onClose]);

  const handleSelect = (path) => {
    navigate(path);
    onClose();
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="cp-root" role="presentation" onKeyDown={handleKeyDown}>
      {/* Backdrop */}
      <div className="cp-backdrop" onClick={onClose} aria-hidden="true" />

      {/* Panel */}
      <div className="cp-panel" role="dialog" aria-label="Command palette" aria-modal="true">
        {/* Search input */}
        <div className="cp-input-wrap">
          <Search size={17} className="cp-search-icon" aria-hidden="true" />
          <input
            ref={inputRef}
            type="text"
            className="cp-input"
            placeholder="Search companies, topics, questions..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            autoComplete="off"
            spellCheck={false}
            aria-autocomplete="list"
          />
          {query && (
            <button className="cp-clear" onClick={() => setQuery('')} aria-label="Clear search">
              <X size={14} />
            </button>
          )}
          <kbd className="cp-esc-hint">ESC</kbd>
        </div>

        {/* Divider */}
        <div className="cp-divider" />

        {/* Results */}
        <div className="cp-results" role="listbox">
          {!query.trim() && <QuickActions onSelect={handleSelect} />}
          {query.trim().length >= 2 && loading && <div className="cp-loading">Searching...</div>}
          {query.trim().length >= 2 && !loading && flatItems.length === 0 && (
            <div className="cp-empty">No results for "{query}"</div>
          )}
          {flatItems.length > 0 && (
            <ResultGroups
              results={results}
              flatItems={flatItems}
              selectedIdx={selectedIdx}
              onSelect={handleSelect}
              onHover={setSelectedIdx}
            />
          )}
        </div>

        {/* Footer hint */}
        <div className="cp-footer">
          <span><kbd>↑</kbd><kbd>↓</kbd> Navigate</span>
          <span><kbd>↵</kbd> Open</span>
          <span><kbd>ESC</kbd> Close</span>
        </div>
      </div>
    </div>,
    document.body
  );
}

// ── Quick Actions (shown when no query) ───────────────────────────────────────
function QuickActions({ onSelect }) {
  const actions = [
    { label: 'Companies',  path: '/companies',  icon: Building2 },
    { label: 'Topics',     path: '/topics',     icon: BookOpen },
    { label: 'Dashboard',  path: '/dashboard',  icon: LayoutDashboard },
    { label: 'Bookmarks',  path: '/bookmarks',  icon: Bookmark },
    { label: 'Profile',    path: '/profile',    icon: User },
    { label: 'Search All', path: '/search',     icon: Search },
  ];

  return (
    <div className="cp-section">
      <p className="cp-section-label">Quick Navigate</p>
      {actions.map((a) => (
        <button key={a.path} className="cp-item" onClick={() => onSelect(a.path)}>
          <a.icon size={15} className="cp-item-icon" aria-hidden="true" />
          <span className="cp-item-title">{a.label}</span>
        </button>
      ))}
    </div>
  );
}

// ── Result Groups ─────────────────────────────────────────────────────────────
function ResultGroups({ results, flatItems, selectedIdx, onSelect, onHover }) {
  const questions = results?.questions?.results ?? results?.questions ?? [];
  const companies = results?.companies?.results ?? results?.companies ?? [];
  const topics    = results?.topics?.results    ?? results?.topics    ?? [];

  let globalIdx = 0;

  const renderItem = (item, path, icon, meta) => {
    const idx = globalIdx++;
    const isSelected = idx === selectedIdx;
    return (
      <button
        key={path + item.id + item.slug + item.name}
        className={`cp-item ${isSelected ? 'cp-item-selected' : ''}`}
        onClick={() => onSelect(path)}
        onMouseEnter={() => onHover(idx)}
        role="option"
        aria-selected={isSelected}
      >
        <span className="cp-item-icon-wrap" aria-hidden="true">{icon}</span>
        <span className="cp-item-body">
          <span className="cp-item-title">{item.title || item.name}</span>
          {meta && <span className="cp-item-meta">{meta}</span>}
        </span>
      </button>
    );
  };

  return (
    <>
      {questions.length > 0 && (
        <div className="cp-section">
          <p className="cp-section-label">Questions</p>
          {questions.slice(0, 4).map(q =>
            renderItem(q, `/questions/${q.slug}`,
              <Code2 size={14} />,
              q.difficulty
            )
          )}
        </div>
      )}
      {companies.length > 0 && (
        <div className="cp-section">
          <p className="cp-section-label">Companies</p>
          {companies.slice(0, 3).map(c =>
            renderItem(c, `/company/${c.slug}`,
              <Building2 size={14} />,
              `${c.questionCount || 0} problems`
            )
          )}
        </div>
      )}
      {topics.length > 0 && (
        <div className="cp-section">
          <p className="cp-section-label">Topics</p>
          {topics.slice(0, 3).map(t =>
            renderItem(t, `/topics/${(t.slug || t.name || '').toLowerCase().replace(/\s+/g, '-')}`,
              <BookOpen size={14} />,
              `${t.questionCount || t.problemCount || 0} problems`
            )
          )}
        </div>
      )}
    </>
  );
}

// ── Helper: flatten results for keyboard nav ──────────────────────────────────
function buildFlatItems(results, query) {
  if (!results || !query.trim()) return [];
  const items = [];
  const questions = results?.questions?.results ?? results?.questions ?? [];
  const companies = results?.companies?.results ?? results?.companies ?? [];
  const topics    = results?.topics?.results    ?? results?.topics    ?? [];
  questions.slice(0, 4).forEach(q => items.push({ path: `/questions/${q.slug}` }));
  companies.slice(0, 3).forEach(c => items.push({ path: `/company/${c.slug}` }));
  topics.slice(0, 3).forEach(t => items.push({ path: `/topics/${(t.slug || t.name || '').toLowerCase().replace(/\s+/g, '-')}` }));
  return items;
}
