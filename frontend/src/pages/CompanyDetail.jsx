import { useState, useMemo } from 'react';
import { useSearchParams, Link, useParams } from 'react-router-dom';
import { ArrowLeft, Bookmark, Link2 } from 'lucide-react';
import { useCompany } from '../hooks/useCompany';
import { useAuth } from '../hooks/useAuth';
import AuthModal from '../components/ui/AuthModal';
import CompanyLogo from '../components/ui/CompanyLogo';
import PeriodTabs from '../components/shared/PeriodTabs';
import FilterBar from '../components/shared/FilterBar';
import Pagination from '../components/shared/Pagination';
import DifficultyBadge from '../components/ui/DifficultyBadge';
import TopicChip from '../components/ui/TopicChip';
import StatusBadge from '../components/ui/StatusBadge';
import BookmarkBtn from '../components/ui/BookmarkBtn';
import ProgressRing from '../components/ui/ProgressRing';
import LeetCodeIcon from '../components/ui/LeetCodeIcon';
import Skeleton from '../components/ui/Skeleton';
import EmptyState from '../components/ui/EmptyState';
import './CompanyDetail.css';

export default function CompanyDetail() {
  const { slug } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [showFilterDrawer, setShowFilterDrawer] = useState(false);
  const [companyBookmarked, setCompanyBookmarked] = useState(false);

  // Read URL params
  const period     = searchParams.get('period') || '30days';
  const difficulty = searchParams.get('difficulty') || '';
  const sortBy     = searchParams.get('sortBy') || 'frequency';
  const page       = Number(searchParams.get('page')) || 1;

  // Powered by TanStack Query useCompany hook
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
        if (v === null || v === undefined || v === '' || (v === '30days' && k === 'period')) {
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

  // Metrics for "Problems in this period"
  const currentPeriodStats = stats?.[period] || stats?.['30days'] || {};
  const totalPeriodProblems = currentPeriodStats.total ?? pagination?.total ?? problems.length;
  const solvedPeriodProblems = useMemo(() => {
    return problems.filter(p => p.status === 'solved').length;
  }, [problems]);
  const successRate = totalPeriodProblems > 0 ? Math.round((solvedPeriodProblems / totalPeriodProblems) * 100) : 0;

  const hasActiveFilters = Boolean(difficulty || sortBy !== 'frequency');

  return (
    <div className="company-detail container">
      {/* ── Top Nav Bar ────────────────────────────────────────────────────── */}
      <div className="company-top-nav">
        <Link to="/companies" className="back-link">
          <ArrowLeft size={16} />
          <span>All Companies</span>
        </Link>
        <button
          type="button"
          className={`company-header-bookmark ${companyBookmarked ? 'active' : ''}`}
          onClick={() => {
            if (!user) {
              setAuthModalOpen(true);
            } else {
              setCompanyBookmarked(prev => !prev);
            }
          }}
          title={companyBookmarked ? 'Company saved' : 'Save company'}
          aria-label="Bookmark company"
        >
          <Bookmark size={18} fill={companyBookmarked ? 'currentColor' : 'none'} />
        </button>
      </div>

      {/* ── Main Company Header Info ───────────────────────────────────────── */}
      <div className="company-header">
        <div className="company-header-main">
          <div className="company-logo-wrapper">
            <CompanyLogo slug={slug} name={companyName} size={58} />
          </div>
          <div className="company-header-info">
            <h1 className="company-title">{companyName}</h1>
            {stats?.all && (
              <span className="company-total-badge">
                <Link2 size={13} className="company-badge-icon" />
                <span>{stats.all.total} problems</span>
              </span>
            )}
          </div>
        </div>

        {/* Topic Chips Row */}
        {stats?.all?.topTopics?.length > 0 && (
          <div className="company-topics-scroll" aria-label="Company top topics">
            {stats.all.topTopics.map(t => (
              <TopicChip key={t} topic={t} />
            ))}
          </div>
        )}
      </div>

      {/* ── Period Filter Cards (30 Days / 3 Months / Filter) ──────────────── */}
      <PeriodTabs
        active={period}
        onChange={(p) => updateParams({ period: p })}
        stats={stats || {}}
        onToggleFilterDrawer={() => setShowFilterDrawer(prev => !prev)}
        hasActiveFilters={hasActiveFilters}
      />

      {/* ── Collapsible Filter Drawer / Bar ────────────────────────────────── */}
      {showFilterDrawer && (
        <div className="filter-drawer-container">
          <FilterBar
            difficulty={difficultyArr}
            sortBy={sortBy}
            onDifficultyChange={(d) => updateParams({ difficulty: d.join(',') })}
            onSortChange={(s) => updateParams({ sortBy: s })}
          />
        </div>
      )}

      {/* ── "Problems in this period" Stats Overview Card ──────────────────── */}
      <div className="period-overview-card">
        <div className="period-overview-header">
          <span>Problems in this period</span>
        </div>
        <div className="period-stats-grid">
          {/* 1. Total Problems */}
          <div className="period-stat-item">
            <span className="period-stat-val val-blue">{totalPeriodProblems}</span>
            <span className="period-stat-label">Total Problems</span>
          </div>

          <div className="period-stat-divider" />

          {/* 2. Solved Problems */}
          <div className="period-stat-item">
            <span className="period-stat-val val-green">{solvedPeriodProblems}</span>
            <span className="period-stat-label">Solved</span>
          </div>

          <div className="period-stat-divider" />

          {/* 3. Success Rate */}
          <div className="period-stat-item stat-progress">
            <div className="period-ring-box">
              <ProgressRing
                solved={solvedPeriodProblems}
                total={totalPeriodProblems || 1}
                size={48}
                strokeWidth={4.5}
              />
            </div>
            <span className="period-stat-label">Success Rate</span>
          </div>
        </div>
      </div>

      {/* ── Section Title: Problems ────────────────────────────────────────── */}
      <div className="problems-section-header">
        <h2>Problems</h2>
      </div>

      {/* ── Problem Table & Mobile Cards ───────────────────────────────────── */}
      {loading ? (
        <div className="problem-table-skeleton">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="problem-row-skeleton">
              <Skeleton width={22} height={22} style={{ borderRadius: '50%' }} />
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                <Skeleton width="60%" height={16} />
                <Skeleton width="35%" height={12} />
              </div>
              <Skeleton width={50} height={20} style={{ borderRadius: 6 }} />
              <Skeleton width={22} height={22} style={{ borderRadius: 4 }} />
            </div>
          ))}
        </div>
      ) : error ? (
        <EmptyState message={`Failed to load: ${error}`} />
      ) : problems.length === 0 ? (
        <EmptyState message="No problems match your filters" />
      ) : (
        <>
          {/* Desktop Table View */}
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
                    onClick={user
                      ? (newStatus) => updateStatus(problem.id, newStatus)
                      : () => setAuthModalOpen(true)
                    }
                  />
                </div>

                {/* 2. Title & Topics (Clean Mobile & Desktop) */}
                <div className="col-title">
                  <Link to={`/questions/${problem.slug}`} className="problem-title" title={problem.title}>
                    {problem.title}
                  </Link>
                  {problem.topics && problem.topics.length > 0 && (
                    <span className="problem-topics-sub">
                      {problem.topics.join(', ')}
                    </span>
                  )}
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

                {/* 5. Desktop Topics Chips */}
                <div className="col-topics">
                  {(problem.topics || []).slice(0, 3).map(t => (
                    <TopicChip key={t} topic={t} />
                  ))}
                  {problem.topics?.length > 3 && (
                    <span className="chip chip-more">+{problem.topics.length - 3}</span>
                  )}
                </div>

                {/* 6. Bookmark */}
                <div className="col-bookmark">
                  <BookmarkBtn
                    active={problem.bookmarked}
                    onClick={user
                      ? () => toggleBookmark(problem.id)
                      : () => setAuthModalOpen(true)
                    }
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

      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        initialMode="login"
        onSuccess={() => setAuthModalOpen(false)}
      />
    </div>
  );
}

