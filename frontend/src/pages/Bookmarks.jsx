import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Star, Bookmark, Search, Trash2 } from 'lucide-react';
import LeetCodeIcon from '../components/ui/LeetCodeIcon';
import { getBookmarks, toggleBookmark as apiToggleBookmark } from '../api/bookmarks';
import DifficultyBadge from '../components/ui/DifficultyBadge';
import TopicChip from '../components/ui/TopicChip';
import Pagination from '../components/shared/Pagination';
import Skeleton from '../components/ui/Skeleton';
import EmptyState from '../components/ui/EmptyState';
import './Bookmarks.css';

export default function Bookmarks() {
  const [bookmarks, setBookmarks] = useState([]);
  const [pagination, setPagination] = useState({});
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('default');

  useEffect(() => {
    document.title = 'Bookmarks — DSA Prep';
  }, []);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const data = await getBookmarks({ page, limit: 30 });
        setBookmarks(data.bookmarks || []);
        setPagination(data.pagination || {});
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [page]);

  const handleUnbookmark = async (questionId) => {
    setBookmarks(prev => prev.filter(b => (b.questionId || b.question?.id || b.id) !== questionId));
    try {
      await apiToggleBookmark(questionId);
    } catch {
      const data = await getBookmarks({ page, limit: 30 });
      setBookmarks(data.bookmarks || []);
    }
  };

  // Derived stats
  const stats = useMemo(() => {
    const all = bookmarks.map(bm => bm.question || bm);
    const d = (v) => (v || '').toLowerCase();
    return {
      total: all.length,
      easy:   all.filter(q => d(q.difficulty) === 'easy').length,
      medium: all.filter(q => d(q.difficulty) === 'medium').length,
      hard:   all.filter(q => d(q.difficulty) === 'hard').length,
    };
  }, [bookmarks]);

  // Filtered + sorted list
  const filtered = useMemo(() => {
    let list = bookmarks.map((bm, i) => ({ bm, q: bm.question || bm, origIndex: i }));
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(({ q: question }) => question.title?.toLowerCase().includes(q));
    }
    if (sort === 'az') list.sort((a, b) => (a.q.title || '').localeCompare(b.q.title || ''));
    if (sort === 'za') list.sort((a, b) => (b.q.title || '').localeCompare(a.q.title || ''));
    if (sort === 'diff') {
      const d = (v) => (v || '').toLowerCase();
      const order = { easy: 0, medium: 1, hard: 2 };
      list.sort((a, b) => (order[d(a.q.difficulty)] ?? 3) - (order[d(b.q.difficulty)] ?? 3));
    }
    return list;
  }, [bookmarks, search, sort]);

  return (
    <div className="bookmarks-page container">

      {/* ── Hero Header ─────────────────────────────────────────────── */}
      <div className="bookmarks-hero">
        <div className="bookmarks-hero-left">
          <span className="bookmarks-hero-badge">
            <Bookmark size={11} />
            Saved Problems
          </span>
          <h1>Bookmarks</h1>
          <p className="bookmarks-subtitle">Your curated list of saved problems</p>
        </div>

        {!loading && !error && bookmarks.length > 0 && (
          <div className="bookmarks-stats-row">
            <div className="bookmarks-stat-pill">
              <span className="bookmarks-stat-pill-value">{stats.total}</span>
              <span className="bookmarks-stat-pill-label">Total</span>
            </div>
            <div className="bookmarks-stat-pill" style={{ '--stat-color': 'var(--easy)' }}>
              <span className="bookmarks-stat-pill-value" style={{ color: 'var(--easy)' }}>{stats.easy}</span>
              <span className="bookmarks-stat-pill-label">Easy</span>
            </div>
            <div className="bookmarks-stat-pill">
              <span className="bookmarks-stat-pill-value" style={{ color: 'var(--medium)' }}>{stats.medium}</span>
              <span className="bookmarks-stat-pill-label">Medium</span>
            </div>
            <div className="bookmarks-stat-pill">
              <span className="bookmarks-stat-pill-value" style={{ color: 'var(--hard)' }}>{stats.hard}</span>
              <span className="bookmarks-stat-pill-label">Hard</span>
            </div>
          </div>
        )}
      </div>

      {/* ── Loading skeletons ────────────────────────────────────────── */}
      {loading ? (
        <div className="bookmarks-list">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bookmark-card" style={{ animationDelay: `${i * 0.05}s` }}>
              <Skeleton width={26} height={26} style={{ borderRadius: '50%', flexShrink: 0 }} />
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <Skeleton width="55%" height={15} />
                <Skeleton width="30%" height={13} />
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <EmptyState message={error} />
      ) : bookmarks.length === 0 ? (
        <EmptyState
          icon={Star}
          message="No bookmarks yet. Star problems while studying."
          action={
            <Link to="/companies" className="btn btn-primary">Browse Companies</Link>
          }
        />
      ) : (
        <>
          {/* ── Controls ──────────────────────────────────────────────── */}
          <div className="bookmarks-controls">
            <div className="bookmarks-search-wrap">
              <Search className="bookmarks-search-icon" size={15} />
              <input
                className="bookmarks-search"
                type="text"
                placeholder="Filter bookmarks…"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <select
              className="bookmarks-sort"
              value={sort}
              onChange={e => setSort(e.target.value)}
              aria-label="Sort bookmarks"
            >
              <option value="default">Order saved</option>
              <option value="az">A → Z</option>
              <option value="za">Z → A</option>
              <option value="diff">By difficulty</option>
            </select>
          </div>

          {/* ── Result info ───────────────────────────────────────────── */}
          <div className="bookmarks-result-info">
            <span>
              Showing <strong>{filtered.length}</strong> of <strong>{bookmarks.length}</strong> bookmarks
            </span>
            {search && (
              <button
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: 'var(--accent)' }}
                onClick={() => setSearch('')}
              >
                Clear filter
              </button>
            )}
          </div>

          {/* ── Column Header Row ──────────────────────────────────── */}
          <div className="bookmark-col-header">
            <span className="bm-col-num">#</span>
            <span className="bm-col-problem">Problem</span>
            <span className="bm-col-diff">Difficulty</span>
            <span className="bm-col-lc">LeetCode</span>
            <span className="bm-col-topics">Topics</span>
            <span className="bm-col-actions"></span>
          </div>

          {/* ── List ──────────────────────────────────────────────────── */}
          <div className="bookmarks-list">
            {filtered.length === 0 ? (
              <EmptyState message={`No bookmarks match "${search}"`} />
            ) : (
              filtered.map(({ bm, q, origIndex }) => {
                const qId = bm.questionId || q.id;
                return (
                  <div
                    key={qId || origIndex}
                    className="bookmark-card"
                    data-difficulty={(q.difficulty || '').toLowerCase()}
                  >
                    <span className="bookmark-index bm-col-num">{origIndex + 1}</span>

                    <div className="bookmark-main bm-col-problem">
                      <Link to={`/questions/${q.slug}`} className="bookmark-title">
                        {q.title}
                      </Link>
                    </div>

                    <div className="bm-col-diff">
                      <DifficultyBadge difficulty={q.difficulty} />
                    </div>

                    <div className="bm-col-lc">
                      {q.link ? (
                        <a
                          href={q.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="leetcode-clean-icon-link"
                          title="Solve on LeetCode"
                        >
                          <LeetCodeIcon size={17} />
                        </a>
                      ) : (
                        <span className="bm-no-link">—</span>
                      )}
                    </div>

                    <div className="bookmark-meta bm-col-topics">
                      {(q.topics || []).slice(0, 3).map(t => (
                        <TopicChip key={t} topic={t} />
                      ))}
                    </div>

                    <div className="bookmark-actions bm-col-actions">
                      <button
                        className="bookmark-remove"
                        onClick={() => handleUnbookmark(qId)}
                        title="Remove bookmark"
                      >
                        <Trash2 size={12} />
                        Remove
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <Pagination
            page={pagination.page || page}
            totalPages={pagination.totalPages || 1}
            onChange={setPage}
          />
        </>
      )}
    </div>
  );
}
