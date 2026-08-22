import { useSearchParams, Link, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useCompany } from '../hooks/useCompany';
import { useAuth } from '../hooks/useAuth';
import CompanyLogo from '../components/ui/CompanyLogo';
import PeriodTabs from '../components/shared/PeriodTabs';
import FilterBar from '../components/shared/FilterBar';
import Pagination from '../components/shared/Pagination';
import DifficultyBadge from '../components/ui/DifficultyBadge';
import TopicChip from '../components/ui/TopicChip';
import StatusBadge from '../components/ui/StatusBadge';
import BookmarkBtn from '../components/ui/BookmarkBtn';
import LeetCodeIcon from '../components/ui/LeetCodeIcon';
import Skeleton from '../components/ui/Skeleton';
import EmptyState from '../components/ui/EmptyState';
import './CompanyDetail.css';

export default function CompanyDetail() {
  const { slug } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();

  // Read URL params
  const period     = searchParams.get('period') || 'all';
  const difficulty = searchParams.get('difficulty') || '';
  const sortBy     = searchParams.get('sortBy') || 'frequency';
  const page       = Number(searchParams.get('page')) || 1;

  // Powered by TanStack Query useCompany hook!
  const {
    companyInfo,
    stats,
    problems,
    pagination,
    loading,
    error,
    updateStatus,
    toggleBookmark,
  } = useCompany(slug, { period, difficulty, sortBy, page });

  const updateParams = (updates) => {
    setSearchParams(prev => {
      const params = new URLSearchParams(prev);
      Object.entries(updates).forEach(([k, v]) => {
        if (v === null || v === undefined || v === '' || (v === 'all' && k === 'period')) {
          params.delete(k);
        } else {
          params.set(k, v);
        }
      });
      if (!('page' in updates)) params.delete('page');
      return params;
    }, { replace: true });
  };

  const companyName = typeof companyInfo === 'string' ? companyInfo : (companyInfo?.name || slug);
  const difficultyArr = difficulty ? difficulty.split(',') : [];

  return (
    <div className="company-detail container">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="company-header">
        <Link to="/companies" className="back-link">
          <ArrowLeft size={16} />
          <span>All Companies</span>
        </Link>
        <div className="company-header-main">
          <CompanyLogo slug={slug} name={companyName} size={46} />
          <div className="company-header-info">
            <h1>{companyName}</h1>
            {stats?.all && (
              <div className="company-meta">
                <span className="company-total-badge">{stats.all.total} problems</span>
                {stats.all.topTopics?.length > 0 && (
                  <div className="company-topics-scroll">
                    {stats.all.topTopics.slice(0, 5).map(t => (
                      <TopicChip key={t} topic={t} />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
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
              <Skeleton width={20} height={20} style={{ borderRadius: 4 }} />
              <Skeleton width="55%" height={16} />
              <Skeleton width={20} height={20} style={{ borderRadius: 4 }} />
              <Skeleton width={65} height={22} style={{ borderRadius: 999 }} />
              <Skeleton width={150} height={22} />
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
              <span className="col-status-check">STATUS</span>
              <span className="col-title">TITLE</span>
              <span className="col-leetcode">LEETCODE</span>
              <span className="col-diff">DIFFICULTY</span>
              <span className="col-topics">TOPICS</span>
              <span className="col-bookmark">★</span>
            </div>

            {problems.map((problem) => (
              <div key={problem.id} className="problem-row">
                {/* 1. Status Checkbox */}
                <div className="col-status-check">
                  <StatusBadge
                    status={problem.status || 'not-started'}
                    onClick={user ? (newStatus) => updateStatus(problem.id, newStatus) : undefined}
                  />
                </div>

                {/* 2. Title */}
                <div className="col-title">
                  <Link to={`/questions/${problem.slug}`} className="problem-title" title={problem.title}>
                    {problem.title}
                  </Link>
                </div>

                {/* 3. LeetCode Icon */}
                <div className="col-leetcode">
                  {problem.link ? (
                    <a
                      href={problem.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="leetcode-clean-icon-link"
                      title="Open on LeetCode"
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

                {/* 5. Topics */}
                <div className="col-topics">
                  {(problem.topics || []).slice(0, 3).map(t => (
                    <TopicChip key={t} topic={t} />
                  ))}
                  {problem.topics?.length > 3 && (
                    <span className="chip chip-more">+{problem.topics.length - 3}</span>
                  )}
                </div>

                {/* 6. Bookmark Star */}
                <div className="col-bookmark">
                  <BookmarkBtn
                    active={problem.bookmarked}
                    onClick={user ? () => toggleBookmark(problem.id) : undefined}
                  />
                </div>
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
