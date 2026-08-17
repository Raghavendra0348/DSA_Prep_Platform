import { useState, useEffect, useMemo } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { ArrowLeft, Search, CheckCircle2, Flame, Layers } from 'lucide-react';
import { getTopicProblems } from '../api/topics';
import { upsertProgress } from '../api/progress';
import { toggleBookmark as apiToggleBookmark } from '../api/bookmarks';
import { useAuth } from '../hooks/useAuth';
import DifficultyBadge from '../components/ui/DifficultyBadge';
import StatusBadge from '../components/ui/StatusBadge';
import BookmarkBtn from '../components/ui/BookmarkBtn';
import LeetCodeIcon from '../components/ui/LeetCodeIcon';
import Pagination from '../components/shared/Pagination';
import Skeleton from '../components/ui/Skeleton';
import EmptyState from '../components/ui/EmptyState';
import './TopicDetail.css';

const DIFFICULTIES = [
  { key: 'EASY',   label: 'Easy',   color: '#3fb950', bg: 'rgba(63, 185, 80, 0.12)' },
  { key: 'MEDIUM', label: 'Medium', color: '#d29922', bg: 'rgba(210, 153, 34, 0.12)' },
  { key: 'HARD',   label: 'Hard',   color: '#f85149', bg: 'rgba(248, 81, 73, 0.12)' },
];

export default function TopicDetail() {
  const { topic } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();

  const difficulty = searchParams.get('difficulty') || '';
  const page = Number(searchParams.get('page')) || 1;

  const activeDiff = useMemo(() => difficulty ? difficulty.split(',').filter(Boolean) : [], [difficulty]);

  const [problems, setProblems] = useState([]);
  const [pagination, setPagination] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const topicName = topic.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

  useEffect(() => {
    document.title = `${topicName} — DSA Prep`;
  }, [topicName]);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const data = await getTopicProblems(topic, {
          difficulty: activeDiff.length > 0 ? activeDiff.join(',') : undefined,
          page,
          limit: 50,
        });
        setProblems(data.problems || data.questions || []);
        setPagination(data.pagination || {});
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [topic, activeDiff, page]);

  const toggleDifficulty = (diffKey) => {
    const next = activeDiff.includes(diffKey)
      ? activeDiff.filter(d => d !== diffKey)
      : [...activeDiff, diffKey];
    setSearchParams(prev => {
      const p = new URLSearchParams(prev);
      if (next.length) p.set('difficulty', next.join(','));
      else p.delete('difficulty');
      p.delete('page');
      return p;
    }, { replace: true });
  };

  const handlePageChange = (p) => {
    setSearchParams(prev => {
      const params = new URLSearchParams(prev);
      if (p > 1) params.set('page', p);
      else params.delete('page');
      return params;
    }, { replace: true });
  };

  const handleStatusChange = async (problemId, newStatus) => {
    if (!user) return;
    setProblems(prev => prev.map(p => p.id === problemId ? { ...p, status: newStatus } : p));
    try { await upsertProgress({ questionId: problemId, status: newStatus }); }
    catch { /* revert if failed */ }
  };

  const handleBookmark = async (problemId) => {
    if (!user) return;
    setProblems(prev => prev.map(p => p.id === problemId ? { ...p, bookmarked: !p.bookmarked } : p));
    try { await apiToggleBookmark(problemId); }
    catch { setProblems(prev => prev.map(p => p.id === problemId ? { ...p, bookmarked: !p.bookmarked } : p)); }
  };

  // Local title filter
  const filteredProblems = useMemo(() => {
    if (!searchQuery) return problems;
    const q = searchQuery.toLowerCase();
    return problems.filter(p => p.title.toLowerCase().includes(q));
  }, [problems, searchQuery]);

  // Counts breakdown
  const diffCounts = useMemo(() => {
    const counts = { EASY: 0, MEDIUM: 0, HARD: 0 };
    problems.forEach(p => {
      const d = (p.difficulty || '').toUpperCase();
      if (counts[d] !== undefined) counts[d]++;
    });
    return counts;
  }, [problems]);

  const solvedCount = useMemo(() => {
    return problems.filter(p => p.status === 'solved' || p.status === 'COMPLETED').length;
  }, [problems]);

  return (
    <div className="topic-detail container">
      {/* Back Link */}
      <Link to="/topics" className="back-link-btn">
        <ArrowLeft size={16} />
        <span>Back to Topics</span>
      </Link>

      {/* ── Topic Banner Header ────────────────────────────────────────── */}
      <div className="topic-banner">
        <div className="topic-banner-main">
          <div className="topic-banner-icon">
            <Layers size={26} />
          </div>
          <div>
            <h1>{topicName}</h1>
            <p className="topic-banner-sub">
              {pagination.total != null ? `${pagination.total} Total Questions` : 'DSA Topic'}
              {user && ` • ${solvedCount} Solved`}
            </p>
          </div>
        </div>

        {/* Stats breakdown */}
        <div className="topic-banner-stats">
          <div className="stat-chip easy">
            <span className="dot"></span> Easy <strong>{diffCounts.EASY}</strong>
          </div>
          <div className="stat-chip medium">
            <span className="dot"></span> Medium <strong>{diffCounts.MEDIUM}</strong>
          </div>
          <div className="stat-chip hard">
            <span className="dot"></span> Hard <strong>{diffCounts.HARD}</strong>
          </div>
        </div>
      </div>

      {/* ── Controls Bar: In-page Search + Difficulty Filters ─────────── */}
      <div className="topic-controls-bar">
        {/* Search inside topic */}
        <div className="topic-search-wrap">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            className="topic-search-input"
            placeholder={`Search in ${topicName}...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button className="clear-search-btn" onClick={() => setSearchQuery('')}>×</button>
          )}
        </div>

        {/* Difficulty Filter Pills */}
        <div className="topic-difficulty-toggles">
          {DIFFICULTIES.map(({ key, label, color }) => {
            const isActive = activeDiff.includes(key);
            return (
              <button
                key={key}
                className={`diff-toggle-btn diff-${key.toLowerCase()} ${isActive ? 'active' : ''}`}
                onClick={() => toggleDifficulty(key)}
                style={{ '--diff-color': color }}
              >
                <span className="diff-dot" />
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Problem Table ──────────────────────────────────────────────── */}
      {loading ? (
        <div className="problem-table-skeleton">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="problem-row-skeleton">
              <Skeleton width={20} height={20} style={{ borderRadius: 4 }} />
              <Skeleton width="55%" height={16} />
              <Skeleton width={20} height={20} style={{ borderRadius: 4 }} />
              <Skeleton width={65} height={22} style={{ borderRadius: 999 }} />
              <Skeleton width={20} height={20} style={{ borderRadius: 4 }} />
            </div>
          ))}
        </div>
      ) : error ? (
        <EmptyState message={error} />
      ) : filteredProblems.length === 0 ? (
        <EmptyState
          message={searchQuery
            ? `No questions match "${searchQuery}" in ${topicName}`
            : "No problems match your filters"
          }
        />
      ) : (
        <>
          <div className="problem-table" key={activeDiff.join('-')}>
            <div className="problem-table-header">
              <span className="col-status-check">STATUS</span>
              <span className="col-title">TITLE</span>
              <span className="col-leetcode">LEETCODE</span>
              <span className="col-diff">DIFFICULTY</span>
              <span className="col-bookmark">SAVED</span>
            </div>

            {filteredProblems.map((problem) => (
              <div key={problem.id} className="problem-row">
                {/* 1. Status Checkbox */}
                <div className="col-status-check">
                  <StatusBadge
                    status={problem.status || 'not-started'}
                    onClick={user ? (s) => handleStatusChange(problem.id, s) : undefined}
                  />
                </div>

                {/* 2. Title */}
                <div className="col-title">
                  <Link to={`/questions/${problem.slug}`} className="problem-title" title={problem.title}>
                    {problem.title}
                  </Link>
                </div>

                {/* 3. LeetCode Clean Icon */}
                <div className="col-leetcode">
                  {problem.link ? (
                    <a
                      href={problem.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="leetcode-clean-icon-link"
                      title="Solve on LeetCode"
                    >
                      <LeetCodeIcon size={18} />
                    </a>
                  ) : (
                    <span className="no-link">—</span>
                  )}
                </div>

                {/* 4. Difficulty */}
                <div className="col-diff">
                  <DifficultyBadge difficulty={problem.difficulty} />
                </div>

                {/* 5. Bookmark Star */}
                <div className="col-bookmark">
                  <BookmarkBtn
                    active={problem.bookmarked}
                    onClick={user ? () => handleBookmark(problem.id) : undefined}
                  />
                </div>
              </div>
            ))}
          </div>

          <Pagination
            page={pagination.page || 1}
            totalPages={pagination.totalPages || 1}
            onChange={handlePageChange}
          />
        </>
      )}
    </div>
  );
}
