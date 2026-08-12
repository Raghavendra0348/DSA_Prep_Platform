import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { ArrowLeft, ExternalLink } from 'lucide-react';
import { getCompanyProblems, getCompanyStats } from '../api/company';
import { upsertProgress } from '../api/progress';
import { toggleBookmark as apiToggleBookmark } from '../api/bookmarks';
import { useAuth } from '../hooks/useAuth';
import PeriodTabs from '../components/shared/PeriodTabs';
import FilterBar from '../components/shared/FilterBar';
import Pagination from '../components/shared/Pagination';
import DifficultyBadge from '../components/ui/DifficultyBadge';
import TopicChip from '../components/ui/TopicChip';
import FrequencyBar from '../components/ui/FrequencyBar';
import StatusBadge from '../components/ui/StatusBadge';
import BookmarkBtn from '../components/ui/BookmarkBtn';
import Skeleton from '../components/ui/Skeleton';
import EmptyState from '../components/ui/EmptyState';
import './CompanyDetail.css';

export default function CompanyDetail() {
  const { slug } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();

  // Filters from URL
  const period     = searchParams.get('period') || 'all';
  const difficulty = searchParams.get('difficulty') || '';
  const sortBy     = searchParams.get('sortBy') || 'frequency';
  const page       = Number(searchParams.get('page')) || 1;

  // State
  const [stats, setStats] = useState(null);
  const [problems, setProblems] = useState([]);
  const [pagination, setPagination] = useState({});
  const [companyName, setCompanyName] = useState('');
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Cache previously fetched tab data
  const cacheRef = useRef({});

  // Update URL params without full re-render
  const updateParams = useCallback((updates) => {
    setSearchParams(prev => {
      const params = new URLSearchParams(prev);
      Object.entries(updates).forEach(([k, v]) => {
        if (v === null || v === undefined || v === '' || v === 'all' && k === 'period') {
          params.delete(k);
        } else {
          params.set(k, v);
        }
      });
      // Reset page on filter change (unless we're setting page itself)
      if (!('page' in updates)) params.delete('page');
      return params;
    }, { replace: true });
  }, [setSearchParams]);

  // Fetch company stats (tab counts)
  useEffect(() => {
    async function loadStats() {
      setStatsLoading(true);
      try {
        const data = await getCompanyStats(slug);
        setStats(data.stats);
      } catch (err) {
        console.error('Stats load failed:', err);
      } finally {
        setStatsLoading(false);
      }
    }
    loadStats();
  }, [slug]);

  // Fetch problems when filters change
  useEffect(() => {
    const cacheKey = `${period}|${difficulty}|${sortBy}|${page}`;

    // Check cache
    if (cacheRef.current[cacheKey]) {
      const cached = cacheRef.current[cacheKey];
      setProblems(cached.problems);
      setPagination(cached.pagination);
      setCompanyName(cached.company);
      setLoading(false);
      return;
    }

    async function loadProblems() {
      setLoading(true);
      setError(null);
      try {
        const data = await getCompanyProblems(slug, {
          period: period || 'all',
          difficulty: difficulty || undefined,
          sortBy,
          page,
          limit: 50,
        });
        setProblems(data.problems);
        setPagination(data.pagination);
        setCompanyName(data.company);
        document.title = `${data.company} — DSA Prep`;

        // Cache
        cacheRef.current[cacheKey] = {
          problems: data.problems,
          pagination: data.pagination,
          company: data.company,
        };
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    loadProblems();
  }, [slug, period, difficulty, sortBy, page]);

  // ── Status toggle (optimistic) ──────────────────────────────────────────
  const handleStatusChange = async (problemId, newStatus) => {
    if (!user) return;

    // Optimistic update
    setProblems(prev =>
      prev.map(p => p.id === problemId ? { ...p, status: newStatus } : p)
    );

    try {
      await upsertProgress({ questionId: problemId, status: newStatus });
    } catch (err) {
      console.error('Status update failed:', err);
      // Revert on failure - refetch
      const data = await getCompanyProblems(slug, { period, difficulty, sortBy, page, limit: 50 });
      setProblems(data.problems);
    }

    // Invalidate cache since status changed
    cacheRef.current = {};
  };

  // ── Bookmark toggle (optimistic) ────────────────────────────────────────
  const handleBookmark = async (problemId) => {
    if (!user) return;

    setProblems(prev =>
      prev.map(p => p.id === problemId ? { ...p, bookmarked: !p.bookmarked } : p)
    );

    try {
      await apiToggleBookmark(problemId);
    } catch (err) {
      console.error('Bookmark toggle failed:', err);
      setProblems(prev =>
        prev.map(p => p.id === problemId ? { ...p, bookmarked: !p.bookmarked } : p)
      );
    }
  };

  const difficultyArr = difficulty ? difficulty.split(',') : [];

  return (
    <div className="company-detail container">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="company-header">
        <Link to="/companies" className="back-link">
          <ArrowLeft size={18} /> Companies
        </Link>
        <h1>{companyName || slug}</h1>
        {stats?.all && (
          <p className="company-meta">
            {stats.all.total} problems • {stats.all.topTopics?.slice(0, 5).map(t => (
              <TopicChip key={t} topic={t} />
            ))}
          </p>
        )}
      </div>

      {/* ── Period Tabs ────────────────────────────────────────────────────── */}
      <PeriodTabs
        active={period || 'all'}
        onChange={(p) => updateParams({ period: p })}
        stats={stats || {}}
      />

      {/* ── Filter Bar ─────────────────────────────────────────────────────── */}
      <FilterBar
        difficulty={difficultyArr}
        sortBy={sortBy}
        onDifficultyChange={(d) => updateParams({ difficulty: d.join(',') })}
        onSortChange={(s) => updateParams({ sortBy: s })}
      />

      {/* ── Problem Table ──────────────────────────────────────────────────── */}
      {loading ? (
        <div className="problem-table-skeleton">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="problem-row-skeleton">
              <Skeleton width={24} height={14} />
              <Skeleton width="40%" height={16} />
              <Skeleton width={60} height={22} style={{ borderRadius: 999 }} />
              <Skeleton width={80} height={8} />
              <Skeleton width={40} height={14} />
              <Skeleton width={20} height={20} style={{ borderRadius: 4 }} />
            </div>
          ))}
        </div>
      ) : error ? (
        <EmptyState message={`Failed to load: ${error}`} />
      ) : problems.length === 0 ? (
        <EmptyState message="No problems match your filters" />
      ) : (
        <>
          <div className="problem-table">
            <div className="problem-table-header">
              <span className="col-num">#</span>
              <span className="col-title">Title</span>
              <span className="col-diff">Difficulty</span>
              <span className="col-freq">Frequency</span>
              <span className="col-accept">Accept %</span>
              <span className="col-topics">Topics</span>
              {user && <span className="col-status">Status</span>}
              {user && <span className="col-bookmark">★</span>}
            </div>

            {problems.map((problem, idx) => (
              <div key={problem.id} className="problem-row">
                <span className="col-num">
                  {(pagination.page - 1) * (pagination.limit || 50) + idx + 1}
                </span>

                <div className="col-title">
                  <span className="problem-title">{problem.title}</span>
                  {problem.link && (
                    <a
                      href={problem.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="problem-link"
                      title="Open on LeetCode"
                    >
                      <ExternalLink size={13} />
                    </a>
                  )}
                </div>

                <span className="col-diff">
                  <DifficultyBadge difficulty={problem.difficulty} />
                </span>

                <span className="col-freq">
                  <FrequencyBar value={problem.frequency} />
                </span>

                <span className="col-accept">
                  {problem.acceptanceRate?.toFixed(1)}%
                </span>

                <div className="col-topics">
                  {(problem.topics || []).slice(0, 2).map(t => (
                    <TopicChip key={t} topic={t} />
                  ))}
                  {problem.topics?.length > 2 && (
                    <span className="chip chip-more">+{problem.topics.length - 2}</span>
                  )}
                </div>

                {user && (
                  <span className="col-status">
                    <StatusBadge
                      status={problem.status || 'not-started'}
                      onClick={(newStatus) => handleStatusChange(problem.id, newStatus)}
                    />
                  </span>
                )}

                {user && (
                  <span className="col-bookmark">
                    <BookmarkBtn
                      active={problem.bookmarked}
                      onClick={() => handleBookmark(problem.id)}
                    />
                  </span>
                )}
              </div>
            ))}
          </div>

          <Pagination
            page={pagination.page || 1}
            totalPages={pagination.totalPages || 1}
            onChange={(p) => updateParams({ page: p })}
          />
        </>
      )}
    </div>
  );
}
