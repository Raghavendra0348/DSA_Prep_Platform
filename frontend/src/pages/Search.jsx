import { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Search as SearchIcon, X, Layers, Code2, BookOpen, Building2,
  ExternalLink, Clock, Trash2, ArrowUpDown,
  Flame, ChevronRight, SearchX, Loader2, ArrowUpRight
} from 'lucide-react';

import { useSearch } from '../hooks/useSearch';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import { getBookmarks, toggleBookmark as apiToggleBookmark } from '../api/bookmarks';
import { QUERY_KEYS } from '../lib/queryKeys';
import { getClassification, TIER_INFO } from '../data/companyClassification';

import DifficultyBadge from '../components/ui/DifficultyBadge';
import TopicChip from '../components/ui/TopicChip';
import Skeleton from '../components/ui/Skeleton';
import CompanyLogo from '../components/ui/CompanyLogo';
import BookmarkBtn from '../components/ui/BookmarkBtn';
import HighlightMatch from '../components/ui/HighlightMatch';

import './Search.css';

const RECENT_KEY = 'dsa_recent_searches';
const MAX_RECENTS = 8;

const CATEGORIES = [
  { value: 'all',       label: 'All',       Icon: Layers },
  { value: 'questions', label: 'Questions', Icon: Code2 },
  { value: 'topics',    label: 'Topics',    Icon: BookOpen },
  { value: 'companies', label: 'Companies', Icon: Building2 },
];

const DIFFICULTIES = [
  { value: '',       label: 'All Difficulties' },
  { value: 'EASY',   label: 'Easy',   colorClass: 'diff-easy' },
  { value: 'MEDIUM', label: 'Medium', colorClass: 'diff-medium' },
  { value: 'HARD',   label: 'Hard',   colorClass: 'diff-hard' },
];

const SORT_OPTIONS = [
  { value: 'relevance',  label: 'Best Match' },
  { value: 'easy_first', label: 'Difficulty: Easy first' },
  { value: 'hard_first', label: 'Difficulty: Hard first' },
  { value: 'companies',  label: 'Most Asked by Companies' },
];

const TRENDING_COMPANIES = [
  { name: 'Google',    slug: 'google' },
  { name: 'Amazon',    slug: 'amazon' },
  { name: 'Microsoft', slug: 'microsoft' },
  { name: 'Meta',      slug: 'meta' },
  { name: 'Apple',     slug: 'apple' },
  { name: 'Uber',      slug: 'uber' },
];

const TRENDING_TOPICS = [
  'Dynamic Programming',
  'Binary Search',
  'Tree',
  'Graph',
  'Two Pointers',
  'Sliding Window',
  'Array',
  'Linked List',
];

export default function Search() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();

  const urlQ    = searchParams.get('q') || '';
  const urlType = searchParams.get('type') || 'all';
  const urlDiff = searchParams.get('diff') || '';
  const urlSort = searchParams.get('sort') || 'relevance';

  const inputRef = useRef(null);

  // ── Search State Hook ──────────────────────────────────────────────────────
  const {
    query, setQuery,
    type, setType,
    difficulty, setDifficulty,
    sort, setSort,
    results, loading, error,
  } = useSearch(urlQ, urlType, urlDiff, urlSort);

  // ── Recent Searches State ──────────────────────────────────────────────────
  const [recentSearches, setRecentSearches] = useState(() => {
    try {
      const stored = localStorage.getItem(RECENT_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const saveRecentSearch = useCallback((term) => {
    const trimmed = term.trim();
    if (!trimmed || trimmed.length < 2) return;
    setRecentSearches(prev => {
      const next = [trimmed, ...prev.filter(item => item.toLowerCase() !== trimmed.toLowerCase())].slice(0, MAX_RECENTS);
      try {
        localStorage.setItem(RECENT_KEY, JSON.stringify(next));
      } catch {
        // ignore quota errors
      }
      return next;
    });
  }, []);

  const removeRecentSearch = (termToRemove, e) => {
    e.stopPropagation();
    setRecentSearches(prev => {
      const next = prev.filter(t => t !== termToRemove);
      try {
        localStorage.setItem(RECENT_KEY, JSON.stringify(next));
      } catch {
        // Ignore localStorage quota errors
      }
      return next;
    });
  };

  const clearAllRecentSearches = () => {
    setRecentSearches([]);
    try {
      localStorage.removeItem(RECENT_KEY);
    } catch {
      // Ignore localStorage access errors
    }
  };

  // ── Bookmarks integration ──────────────────────────────────────────────────
  const { data: bookmarkData } = useQuery({
    queryKey: ['user-search-bookmarks'],
    queryFn: () => getBookmarks({ limit: 100 }),
    enabled: !!user,
    staleTime: 1000 * 60 * 3,
  });

  const [optimisticBookmarks, setOptimisticBookmarks] = useState({});

  const bookmarkedSet = useMemo(() => {
    const set = new Set();
    if (bookmarkData?.bookmarks) {
      bookmarkData.bookmarks.forEach(b => {
        const id = b.questionId ?? b.question?.id ?? b.id;
        if (id) set.add(id);
      });
    }
    Object.entries(optimisticBookmarks).forEach(([idStr, val]) => {
      const id = Number(idStr);
      if (val) set.add(id);
      else set.delete(id);
    });
    return set;
  }, [bookmarkData, optimisticBookmarks]);

  const handleToggleBookmark = async (qItem, e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      toast.info('Please sign in to bookmark problems');
      return;
    }

    const qId = qItem.id;
    if (!qId) return;

    const isCurrentlyBookmarked = bookmarkedSet.has(qId);
    const nextState = !isCurrentlyBookmarked;

    // Optimistic toggle
    setOptimisticBookmarks(prev => ({ ...prev, [qId]: nextState }));

    try {
      await apiToggleBookmark(qId);
      qc.invalidateQueries({ queryKey: QUERY_KEYS.bookmarks({}) });
      qc.invalidateQueries({ queryKey: ['user-search-bookmarks'] });
      toast.success(nextState ? 'Added to bookmarks' : 'Removed from bookmarks');
    } catch {
      // Revert on error
      setOptimisticBookmarks(prev => ({ ...prev, [qId]: isCurrentlyBookmarked }));
      toast.error('Failed to update bookmark');
    }
  };

  // ── Sync URL Params ────────────────────────────────────────────────────────
  const updateUrlParams = useCallback((newQ, newType, newDiff, newSort) => {
    const params = new URLSearchParams();
    if (newQ && newQ.trim().length >= 2) params.set('q', newQ.trim());
    if (newType && newType !== 'all')    params.set('type', newType);
    if (newDiff)                        params.set('diff', newDiff);
    if (newSort && newSort !== 'relevance') params.set('sort', newSort);

    setSearchParams(params, { replace: true });
  }, [setSearchParams]);

  // Page title
  useEffect(() => {
    document.title = query.trim() ? `Search: "${query.trim()}" — DSA Prep` : 'Search Problems, Topics & Companies — DSA Prep';
  }, [query]);

  // Save to recent searches when query stabilizes
  useEffect(() => {
    if (query.trim().length >= 2) {
      const timer = setTimeout(() => {
        saveRecentSearch(query.trim());
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, [query, saveRecentSearch]);

  // ── Keyboard Navigation & Global Shortcut ──────────────────────────────────
  const [selectedResultIndex, setSelectedResultIndex] = useState(-1);

  const flatResultItems = useMemo(() => {
    const list = [];
    const questions = results?.questions ?? [];
    const topics    = results?.topics ?? [];
    const companies = results?.companies ?? [];

    if (type === 'all' || type === 'questions') {
      questions.forEach(q => list.push({ type: 'question', url: `/questions/${q.slug}` }));
    }
    if (type === 'all' || type === 'topics') {
      topics.forEach(t => list.push({ type: 'topic', url: `/topics/${(t.slug || t.name || '').toLowerCase().replace(/\s+/g, '-')}` }));
    }
    if (type === 'all' || type === 'companies') {
      companies.forEach(c => list.push({ type: 'company', url: `/company/${c.slug}` }));
    }
    return list;
  }, [results, type]);

  const handleClearInput = useCallback(() => {
    setQuery('');
    setSelectedResultIndex(-1);
    updateUrlParams('', type, difficulty, sort);
    inputRef.current?.focus();
  }, [setQuery, updateUrlParams, type, difficulty, sort]);

  useEffect(() => {
    const handleGlobalKeyDown = (e) => {
      const activeTag = document.activeElement?.tagName?.toLowerCase();
      const isInputActive = activeTag === 'input' || activeTag === 'textarea';

      // Press '/' to focus search field from anywhere
      if (e.key === '/' && !isInputActive) {
        e.preventDefault();
        inputRef.current?.focus();
        return;
      }

      // Escape to clear search or blur
      if (e.key === 'Escape') {
        if (query) {
          handleClearInput();
        } else {
          inputRef.current?.blur();
        }
        return;
      }

      // Results navigation with Arrow keys
      if (flatResultItems.length > 0) {
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          setSelectedResultIndex(prev => (prev + 1) % flatResultItems.length);
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          setSelectedResultIndex(prev => (prev - 1 + flatResultItems.length) % flatResultItems.length);
        } else if (e.key === 'Enter' && selectedResultIndex >= 0 && flatResultItems[selectedResultIndex]) {
          e.preventDefault();
          navigate(flatResultItems[selectedResultIndex].url);
        }
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [query, flatResultItems, selectedResultIndex, navigate, handleClearInput]);

  // ── Input and Filter Event Handlers ────────────────────────────────────────
  const handleInputChange = (e) => {
    const val = e.target.value;
    setQuery(val);
    setSelectedResultIndex(-1);
    updateUrlParams(val, type, difficulty, sort);
  };

  const handleSelectQuery = (term) => {
    setQuery(term);
    setSelectedResultIndex(-1);
    saveRecentSearch(term);
    updateUrlParams(term, type, difficulty, sort);
    inputRef.current?.focus();
  };

  const handleTypeChange = (newType) => {
    setType(newType);
    setSelectedResultIndex(-1);
    updateUrlParams(query, newType, difficulty, sort);
  };

  const handleDifficultyChange = (newDiff) => {
    const nextVal = difficulty === newDiff ? '' : newDiff;
    setDifficulty(nextVal);
    setSelectedResultIndex(-1);
    updateUrlParams(query, type, nextVal, sort);
  };

  const handleSortChange = (newSort) => {
    setSort(newSort);
    setSelectedResultIndex(-1);
    updateUrlParams(query, type, difficulty, newSort);
  };

  // Result counts
  const { questions = [], topics = [], companies = [] } = results;
  const totalResultsCount = questions.length + topics.length + companies.length;
  const hasActiveQuery = query.trim().length >= 2;

  // Counter helper for category tabs
  const getCategoryCount = (catValue) => {
    if (!hasActiveQuery) return null;
    switch (catValue) {
      case 'questions': return questions.length;
      case 'topics':    return topics.length;
      case 'companies': return companies.length;
      case 'all':       return totalResultsCount;
      default:          return null;
    }
  };

  let renderedItemCounter = 0;

  return (
    <div className="search-page container">
      {/* Background ambient glow effect */}
      <div className="search-ambient-glow" aria-hidden="true" />

      {/* ── Search Hero ────────────────────────────────────────────────────── */}
      <div className="search-hero">
        

        <h1 className="search-title">Explore Problems, Topics & Companies</h1>
       

        {/* Command Bar Input */}
        <div className={`search-command-bar ${hasActiveQuery ? 'has-query' : ''}`}>
          <div className="search-icon-wrap">
            {loading ? (
              <Loader2 size={20} className="search-spinner" />
            ) : (
              <SearchIcon size={20} className="search-main-icon" />
            )}
          </div>

          <input
            ref={inputRef}
            type="text"
            className="search-field"
            placeholder="Search problems, topics, companies..."
            value={query}
            onChange={handleInputChange}
            autoComplete="off"
            spellCheck={false}
          />

          <div className="search-bar-actions">
            {query && (
              <button
                type="button"
                className="search-clear-btn"
                onClick={handleClearInput}
                title="Clear search (Esc)"
                aria-label="Clear search"
              >
                <X size={16} />
              </button>
            )}
            <kbd className="search-shortcut-kbd" title="Press / to focus">/</kbd>
          </div>
        </div>

        {/* Category Toggles */}
        <div className="search-category-tabs">
          {CATEGORIES.map(cat => {
            const Icon = cat.Icon;
            const count = getCategoryCount(cat.value);
            const isActive = type === cat.value;

            return (
              <button
                key={cat.value}
                type="button"
                className={`search-cat-tab ${isActive ? 'active' : ''}`}
                onClick={() => handleTypeChange(cat.value)}
              >
                <Icon size={15} className="search-cat-icon" />
                <span>{cat.label}</span>
                {count !== null && (
                  <span className={`search-cat-count ${isActive ? 'count-active' : ''}`}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Secondary Filters Bar (Difficulty & Sort for Questions) */}
        {hasActiveQuery && (type === 'all' || type === 'questions') && (
          <div className="search-filters-bar">
            {/* Difficulty Pills */}
            <div className="search-diff-group" role="group" aria-label="Filter by difficulty">
              <span className="search-filter-label">Difficulty:</span>
              {DIFFICULTIES.map(d => (
                <button
                  key={d.value}
                  type="button"
                  className={`search-filter-chip ${d.colorClass || ''} ${difficulty === d.value ? 'active' : ''}`}
                  onClick={() => handleDifficultyChange(d.value)}
                >
                  {d.label}
                </button>
              ))}
            </div>

            {/* Sort Group */}
            <div className="search-sort-group">
              <ArrowUpDown size={14} className="search-sort-icon" />
              <label htmlFor="search-sort-select" className="sr-only">Sort by</label>
              <select
                id="search-sort-select"
                className="search-sort-select"
                value={sort}
                onChange={e => handleSortChange(e.target.value)}
              >
                {SORT_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      {/* ── Main Content Area ──────────────────────────────────────────────── */}
      <div className="search-content">
        {/* Zero-Query State: Discover & Recent Searches */}
        {!hasActiveQuery ? (
          <div className="search-discovery">
            {/* Recent Searches */}
            {recentSearches.length > 0 && (
              <div className="discovery-section">
                <div className="discovery-section-header">
                  <div className="discovery-title-wrap">
                    <Clock size={16} className="discovery-icon text-muted" />
                    <span className="discovery-title">Recent Searches</span>
                  </div>
                  <button
                    type="button"
                    className="discovery-clear-action"
                    onClick={clearAllRecentSearches}
                  >
                    <Trash2 size={13} />
                    <span>Clear history</span>
                  </button>
                </div>

                <div className="recent-chips-list">
                  {recentSearches.map(term => (
                    <div key={term} className="recent-chip">
                      <button
                        type="button"
                        className="recent-chip-label"
                        onClick={() => handleSelectQuery(term)}
                      >
                        {term}
                      </button>
                      <button
                        type="button"
                        className="recent-chip-remove"
                        onClick={(e) => removeRecentSearch(term, e)}
                        title={`Remove ${term}`}
                        aria-label={`Remove ${term}`}
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Trending Companies */}
            <div className="discovery-section">
              <div className="discovery-section-header">
                <div className="discovery-title-wrap">
                  <Flame size={16} className="discovery-icon text-amber" />
                  <span className="discovery-title">Top Interview Companies</span>
                </div>
                <Link to="/companies" className="discovery-view-all">
                  <span>View all</span>
                  <ChevronRight size={14} />
                </Link>
              </div>

              <div className="trending-companies-grid">
                {TRENDING_COMPANIES.map(company => (
                  <Link
                    key={company.slug}
                    to={`/company/${company.slug}`}
                    className="trending-company-card"
                  >
                    <CompanyLogo slug={company.slug} name={company.name} size={32} />
                    <span className="trending-company-name">{company.name}</span>
                    <ArrowUpRight size={14} className="trending-arrow-icon" />
                  </Link>
                ))}
              </div>
            </div>

            {/* Top Topics */}
            <div className="discovery-section">
              <div className="discovery-section-header">
                <div className="discovery-title-wrap">
                  <BookOpen size={16} className="discovery-icon text-accent" />
                  <span className="discovery-title">Popular Topics</span>
                </div>
                <Link to="/topics" className="discovery-view-all">
                  <span>View all</span>
                  <ChevronRight size={14} />
                </Link>
              </div>

              <div className="trending-topics-wrap">
                {TRENDING_TOPICS.map(topic => {
                  const topicSlug = topic.toLowerCase().replace(/\s+/g, '-');
                  return (
                    <Link
                      key={topic}
                      to={`/topics/${topicSlug}`}
                      className="trending-topic-pill"
                    >
                      <span className="trending-topic-dot" />
                      <span>{topic}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        ) : loading && totalResultsCount === 0 ? (
          /* Loading Skeleton State */
          <div className="search-skeletons-list">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="card search-card-skeleton">
                <div className="skeleton-row-top">
                  <Skeleton width="65%" height={20} />
                  <Skeleton width="70px" height={22} borderRadius="12px" />
                </div>
                <div className="skeleton-row-meta">
                  <Skeleton width="80px" height={16} borderRadius="4px" />
                  <Skeleton width="90px" height={16} borderRadius="4px" />
                  <Skeleton width="120px" height={16} borderRadius="4px" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          /* Error State */
          <div className="search-error-state card">
            <SearchX size={36} className="error-state-icon" />
            <h3>Search error</h3>
            <p>{error}</p>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => handleSelectQuery(query)}
            >
              Retry search
            </button>
          </div>
        ) : totalResultsCount === 0 ? (
          /* No Results Found State */
          <div className="search-empty-state card">
            <div className="empty-icon-bubble">
              <SearchX size={32} className="empty-search-icon" />
            </div>
            <h3 className="empty-title">No results found for "{query}"</h3>
            <p className="empty-description">
              We couldn't find matching questions, topics, or companies. Try adjusting your search query or removing filters.
            </p>

            <div className="empty-actions">
              {difficulty && (
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => handleDifficultyChange('')}
                >
                  Clear difficulty filter ({difficulty})
                </button>
              )}
              {type !== 'all' && (
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => handleTypeChange('all')}
                >
                  Search in All categories
                </button>
              )}
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={handleClearInput}
              >
                Clear search query
              </button>
            </div>

            <div className="empty-suggestions">
              <span className="empty-suggestions-label">Try searching for:</span>
              <div className="empty-suggestions-chips">
                {['Dynamic Programming', 'Binary Search', 'Google', 'Two Sum', 'Amazon'].map(s => (
                  <button
                    key={s}
                    type="button"
                    className="suggestion-chip"
                    onClick={() => handleSelectQuery(s)}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* Results Render Container */
          <div className="search-results-flow">
            {/* ── Questions Section ────────────────────────────────────────── */}
            {questions.length > 0 && (type === 'all' || type === 'questions') && (
              <section className="search-group-section" aria-labelledby="questions-header">
                <div className="search-group-header">
                  <div className="group-title-wrap">
                    <Code2 size={18} className="group-icon text-accent" />
                    <h2 id="questions-header" className="group-title">Questions</h2>
                    <span className="group-count-badge">{questions.length}</span>
                  </div>
                  {type === 'all' && questions.length > 6 && (
                    <button
                      type="button"
                      className="group-see-more"
                      onClick={() => handleTypeChange('questions')}
                    >
                      <span className="see-more-text-desktop">Show only questions</span>
                      <span className="see-more-text-mobile">See all</span>
                      <ChevronRight size={14} />
                    </button>
                  )}
                </div>

                <div className="search-questions-list">
                  {(type === 'all' ? questions.slice(0, 8) : questions).map(qItem => {
                    const itemIndex = renderedItemCounter++;
                    const isSelected = itemIndex === selectedResultIndex;
                    const isBookmarked = bookmarkedSet.has(qItem.id);

                    return (
                      <div
                        key={qItem.id || qItem.slug}
                        className={`card search-question-card ${isSelected ? 'keyboard-selected' : ''}`}
                      >
                        <Link
                          to={`/questions/${qItem.slug}`}
                          className="search-question-main-link"
                        >
                          <div className="search-question-top">
                            <span className="search-question-title">
                              <HighlightMatch text={qItem.title} query={query} />
                            </span>
                            <DifficultyBadge difficulty={qItem.difficulty} />
                          </div>

                          <div className="search-question-meta">
                            {/* Topics */}
                            <div className="search-question-topics">
                              {(qItem.topics || []).slice(0, 3).map(t => (
                                <TopicChip key={t} topic={t} />
                              ))}
                              {(qItem.topics || []).length > 3 && (
                                <span className="search-more-topics-badge">
                                  +{qItem.topics.length - 3}
                                </span>
                              )}
                            </div>

                            {/* Companies snippet */}
                            {qItem.companies && qItem.companies.length > 0 ? (
                              <div className="search-question-companies">
                                <span className="company-tag-intro">Asked by:</span>
                                {qItem.companies.slice(0, 3).map(c => (
                                  <span key={c.slug || c.name} className="search-company-chip">
                                    {c.name}
                                  </span>
                                ))}
                                {qItem.companies.length > 3 && (
                                  <span className="search-company-more">
                                    +{qItem.companies.length - 3} more
                                  </span>
                                )}
                              </div>
                            ) : qItem.companyCount ? (
                              <div className="search-question-companies">
                                <span className="search-company-chip">
                                  Asked by {qItem.companyCount} {qItem.companyCount === 1 ? 'company' : 'companies'}
                                </span>
                              </div>
                            ) : null}
                          </div>
                        </Link>

                        {/* Action buttons on card right */}
                        <div className="search-question-actions">
                          {qItem.link && (
                            <a
                              href={qItem.link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="search-leetcode-link"
                              title="Open problem on LeetCode"
                              aria-label="Open problem on LeetCode"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <ExternalLink size={16} />
                            </a>
                          )}

                          <BookmarkBtn
                            active={isBookmarked}
                            onClick={(e) => handleToggleBookmark(qItem, e)}
                            size={17}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* ── Companies Section ────────────────────────────────────────── */}
            {companies.length > 0 && (type === 'all' || type === 'companies') && (
              <section className="search-group-section" aria-labelledby="companies-header">
                <div className="search-group-header">
                  <div className="group-title-wrap">
                    <Building2 size={18} className="group-icon text-amber" />
                    <h2 id="companies-header" className="group-title">Companies</h2>
                    <span className="group-count-badge">{companies.length}</span>
                  </div>
                  {type === 'all' && companies.length > 6 && (
                    <button
                      type="button"
                      className="group-see-more"
                      onClick={() => handleTypeChange('companies')}
                    >
                      <span className="see-more-text-desktop">Show only companies</span>
                      <span className="see-more-text-mobile">See all</span>
                      <ChevronRight size={14} />
                    </button>
                  )}
                </div>

                <div className="search-companies-grid">
                  {(type === 'all' ? companies.slice(0, 6) : companies).map(cItem => {
                    const itemIndex = renderedItemCounter++;
                    const isSelected = itemIndex === selectedResultIndex;
                    const cls = getClassification(cItem.slug);
                    const tierMeta = TIER_INFO[cls.tier];

                    return (
                      <Link
                        key={cItem.slug || cItem.name}
                        to={`/company/${cItem.slug}`}
                        className={`card search-company-card ${isSelected ? 'keyboard-selected' : ''}`}
                      >
                        <div className="search-company-card-top">
                          <CompanyLogo slug={cItem.slug} name={cItem.name} size={40} />
                          {cls.tier > 0 && (
                            <span
                              className="search-tier-badge"
                              style={{ borderColor: tierMeta.color, color: tierMeta.color }}
                            >
                              {tierMeta.label}
                            </span>
                          )}
                        </div>

                        <div className="search-company-info">
                          <span className="search-company-name">
                            <HighlightMatch text={cItem.name} query={query} />
                          </span>
                          <span className="search-company-count">
                            {cItem.questionCount || 0} problems
                          </span>
                        </div>

                        <div className="search-company-hover-action">
                          <span>Explore</span>
                          <ChevronRight size={14} className="hover-arrow" />
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </section>
            )}

            {/* ── Topics Section ───────────────────────────────────────────── */}
            {topics.length > 0 && (type === 'all' || type === 'topics') && (
              <section className="search-group-section" aria-labelledby="topics-header">
                <div className="search-group-header">
                  <div className="group-title-wrap">
                    <BookOpen size={18} className="group-icon text-emerald" />
                    <h2 id="topics-header" className="group-title">Topics</h2>
                    <span className="group-count-badge">{topics.length}</span>
                  </div>
                  {type === 'all' && topics.length > 6 && (
                    <button
                      type="button"
                      className="group-see-more"
                      onClick={() => handleTypeChange('topics')}
                    >
                      <span className="see-more-text-desktop">Show only topics</span>
                      <span className="see-more-text-mobile">See all</span>
                      <ChevronRight size={14} />
                    </button>
                  )}
                </div>

                <div className="search-topics-grid">
                  {(type === 'all' ? topics.slice(0, 6) : topics).map(tItem => {
                    const itemIndex = renderedItemCounter++;
                    const isSelected = itemIndex === selectedResultIndex;
                    const topicSlug = (tItem.slug || tItem.name || '').toLowerCase().replace(/\s+/g, '-');
                    const count = (tItem.questionCount ?? tItem.problemCount) || 0;

                    return (
                      <Link
                        key={tItem.name || tItem.slug}
                        to={`/topics/${topicSlug}`}
                        className={`card search-topic-card ${isSelected ? 'keyboard-selected' : ''}`}
                      >
                        <div className="search-topic-icon-wrap">
                          <BookOpen size={18} className="topic-card-icon" />
                        </div>

                        <div className="search-topic-body">
                          <span className="search-topic-name">
                            <HighlightMatch text={tItem.name} query={query} />
                          </span>
                          <span className="search-topic-count">
                            {count} {count === 1 ? 'problem' : 'problems'}
                          </span>
                        </div>

                        <div className="search-topic-hover-arrow">
                          <ChevronRight size={16} />
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </section>
            )}

            {/* Keyboard shortcut guide at the bottom */}
            <div className="search-keyboard-footer">
              <span className="kb-hint"><kbd>↑</kbd><kbd>↓</kbd> Navigate</span>
              <span className="kb-hint"><kbd>↵</kbd> Select</span>
              <span className="kb-hint"><kbd>/</kbd> Focus search</span>
              <span className="kb-hint"><kbd>ESC</kbd> Clear</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
