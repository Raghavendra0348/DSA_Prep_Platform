import { useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  CheckCircle2,
  Star,
  BookOpen,
  ArrowRight,
  RefreshCw,
  Flame,
  Layers,
  Clock,
  ChevronRight,
  BarChart3,
  Compass,
  Building2,
  Sparkles,
  ArrowUpRight,
} from 'lucide-react';
import { useDashboard } from '../hooks/useDashboard';
import { useAuth } from '../hooks/useAuth';
import { useCountUp } from '../hooks/useCountUp';
import DifficultyBadge from '../components/ui/DifficultyBadge';
import CompanyLogo from '../components/ui/CompanyLogo';
import ProgressBar from '../components/ui/ProgressBar';
import Skeleton from '../components/ui/Skeleton';
import EmptyState from '../components/ui/EmptyState';
import './Dashboard.css';

// ── Multi-Difficulty Concentric Radial Gauge (LeetCode Style) ───────────────
function MultiDifficultyRing({ solved = 0, total = 1, easy = 0, medium = 0, hard = 0 }) {
  const size = 160;
  const strokeWidth = 10;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  // Compute proportional arc lengths based on solved distribution
  const totalSolved = Math.max(solved, 1);
  const easyRatio   = easy / totalSolved;
  const medRatio    = medium / totalSolved;
  const hardRatio   = hard / totalSolved;

  const pct = total > 0 ? Math.min((solved / total) * 100, 100) : 0;
  const totalOffset = circumference - (pct / 100) * circumference;

  // Segment stroke dash offsets
  const easyLen = circumference * easyRatio * (pct / 100);
  const medLen  = circumference * medRatio * (pct / 100);
  const hardLen = circumference * hardRatio * (pct / 100);

  return (
    <div className="dash-donut-wrap" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="dash-donut-svg">
        {/* Background Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255, 255, 255, 0.08)"
          strokeWidth={strokeWidth}
        />

        {/* Easy Segment (Cyan/Green) */}
        {easyLen > 0 && (
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="#00b8a3"
            strokeWidth={strokeWidth}
            strokeDasharray={`${easyLen} ${circumference}`}
            strokeDashoffset="0"
            strokeLinecap="round"
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
            className="dash-arc-easy"
          />
        )}

        {/* Medium Segment (Orange/Amber) */}
        {medLen > 0 && (
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="#ffa116"
            strokeWidth={strokeWidth}
            strokeDasharray={`${medLen} ${circumference}`}
            strokeDashoffset={-easyLen}
            strokeLinecap="round"
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
            className="dash-arc-medium"
          />
        )}

        {/* Hard Segment (Rose/Red) */}
        {hardLen > 0 && (
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="#ef4743"
            strokeWidth={strokeWidth}
            strokeDasharray={`${hardLen} ${circumference}`}
            strokeDashoffset={-(easyLen + medLen)}
            strokeLinecap="round"
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
            className="dash-arc-hard"
          />
        )}
      </svg>

      {/* Center Label */}
      <div className="dash-donut-center">
        <span className="dash-donut-val text-code">{solved}</span>
        <span className="dash-donut-lbl">Solved</span>
        <span className="dash-donut-sub">of {total}</span>
      </div>
    </div>
  );
}

// ── Main Dashboard Component ────────────────────────────────────────────────
export default function Dashboard() {
  const { user } = useAuth();
  const { dashboardData, loading, error, isRefetching, refresh } = useDashboard();

  useEffect(() => {
    document.title = 'Dashboard — DSA Prep';
  }, []);

  const overview       = dashboardData?.overview       || {};
  const difficulty     = dashboardData?.difficulty     || {};
  const topCompanies   = dashboardData?.topCompanies   || [];
  const topTopics      = dashboardData?.topTopics      || [];
  const recentActivity = dashboardData?.recentActivity || [];

  const solved    = overview.totalSolved    || 0;
  const bookmarks = overview.totalBookmarks || 0;
  const total     = overview.totalQuestions || 0;
  const easy      = difficulty.easy         || 0;
  const medium    = difficulty.medium       || 0;
  const hard      = difficulty.hard         || 0;

  const animSolved    = useCountUp(solved, 800);
  const animBookmarks = useCountUp(bookmarks, 800);
  const animTotal     = useCountUp(total, 800);

  const completionPct = total > 0 ? ((solved / total) * 100).toFixed(1) : '0.0';
  const easyPct   = solved > 0 ? Math.round((easy / solved) * 100) : 0;
  const mediumPct = solved > 0 ? Math.round((medium / solved) * 100) : 0;
  const hardPct   = solved > 0 ? Math.round((hard / solved) * 100) : 0;

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  }, []);

  if (loading) {
    return (
      <div className="dash-ui container">
        <div className="dash-ui-skeleton-top">
          <Skeleton width={320} height={38} />
          <Skeleton width={200} height={20} style={{ marginTop: 10 }} />
        </div>
        <div className="dash-ui-skeleton-grid" style={{ marginTop: 32 }}>
          <Skeleton width="100%" height={340} style={{ borderRadius: 16 }} />
          <Skeleton width="100%" height={340} style={{ borderRadius: 16 }} />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dash-ui container">
        <EmptyState
          message={error}
          action={
            <button className="btn btn-primary" onClick={() => refresh()}>
              <RefreshCw size={15} /> Retry
            </button>
          }
        />
      </div>
    );
  }

  return (
    <motion.div
      className="dash-ui container"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
    >
      {/* ── 1. User Header & Status Banner ─────────────────────────────────── */}
      <div className="dash-ui-hero">
        <div className="dash-ui-hero-left">
          <div className="dash-ui-avatar">
            <span>{(user?.name || 'U').charAt(0).toUpperCase()}</span>
            <span className="dash-ui-avatar-status" />
          </div>
          <div className="dash-ui-hero-text">
            <div className="dash-ui-hero-badges">
              <span className="dash-ui-badge-greeting">
                <Sparkles size={12} /> {greeting}
              </span>
              
            </div>
            <h1 className="dash-ui-title">{user?.name || 'Software Engineer'}</h1>
            <p className="dash-ui-desc">
              {solved === 0
                ? 'Your interview dashboard is ready. Pick your first target company below!'
                : `You've solved ${solved} questions across top tech companies. Ready for your next challenge?`}
            </p>
          </div>
        </div>

        <div className="dash-ui-hero-actions">
          <button
            className={`dash-ui-btn-refresh ${isRefetching ? 'spinning' : ''}`}
            onClick={() => refresh()}
            title="Sync stats"
            disabled={isRefetching}
          >
            <RefreshCw size={14} />
            <span>{isRefetching ? 'Syncing...' : 'Sync'}</span>
          </button>
          <Link to="/companies" className="dash-ui-btn-explore">
            <Building2 size={15} />
            <span>Explore 429+ Companies</span>
            <ArrowUpRight size={15} />
          </Link>
        </div>
      </div>

      {/* ── 2. Top Stats Bar ───────────────────────────────────────────────── */}
      <div className="dash-ui-stats-bar">
        <div className="dash-ui-stat-box stat-box-solved">
          <div className="dash-ui-stat-icon">
            <CheckCircle2 size={22} />
          </div>
          <div className="dash-ui-stat-meta">
            <span className="dash-ui-stat-val text-code">{animSolved.toLocaleString()}</span>
            <span className="dash-ui-stat-lbl">Problems Solved</span>
          </div>
          <span className="dash-ui-stat-tag tag-solved">{completionPct}% Done</span>
        </div>

        <Link to="/bookmarks" className="dash-ui-stat-box stat-box-bookmarks">
          <div className="dash-ui-stat-icon">
            <Star size={22} />
          </div>
          <div className="dash-ui-stat-meta">
            <span className="dash-ui-stat-val text-code">{animBookmarks.toLocaleString()}</span>
            <span className="dash-ui-stat-lbl">Saved Bookmarks</span>
          </div>
          <span className="dash-ui-stat-arrow">
            <ChevronRight size={16} />
          </span>
        </Link>

        <Link to="/topics" className="dash-ui-stat-box stat-box-total">
          <div className="dash-ui-stat-icon">
            <BookOpen size={22} />
          </div>
          <div className="dash-ui-stat-meta">
            <span className="dash-ui-stat-val text-code">{animTotal.toLocaleString()}</span>
            <span className="dash-ui-stat-lbl">Question Catalog</span>
          </div>
          <span className="dash-ui-stat-tag tag-total">429+ Companies</span>
        </Link>
      </div>

      {/* ── 3. Workspace Layout (Asymmetric 2 Columns) ─────────────────────── */}
      <div className="dash-ui-grid">
        {/* Left Column (Primary Analytics & Activity) */}
        <div className="dash-ui-col-main">
          {/* Progress Mastery Panel */}
          <div className="dash-ui-panel dash-ui-progress-panel">
            <div className="dash-ui-panel-head">
              <div>
                <span className="dash-ui-section-tag">PROGRESS RADAR</span>
                <h2>Problem Solving Mastery</h2>
              </div>
              <span className="dash-ui-flame-badge">
                <Flame size={14} /> {solved} Solved
              </span>
            </div>

            <div className="dash-ui-radar-body">
              {/* Donut Chart */}
              <div className="dash-ui-donut-container">
                <MultiDifficultyRing
                  solved={solved}
                  total={total || 1}
                  easy={easy}
                  medium={medium}
                  hard={hard}
                />
              </div>

              {/* Difficulty Tracks */}
              <div className="dash-ui-diff-tracks">
                {/* Easy Row */}
                <div className="dash-ui-diff-bar-item">
                  <div className="dash-ui-diff-bar-head">
                    <span className="dash-ui-diff-pill pill-easy">
                      <span className="diff-dot dot-easy" /> Easy
                    </span>
                    <span className="dash-ui-diff-score">
                      <strong>{easy}</strong> solved <span className="diff-pct">({easyPct}%)</span>
                    </span>
                  </div>
                  <ProgressBar
                    value={easy}
                    max={solved || 1}
                    color="#00b8a3"
                    showCount={false}
                    height={5}
                    animated
                  />
                </div>

                {/* Medium Row */}
                <div className="dash-ui-diff-bar-item">
                  <div className="dash-ui-diff-bar-head">
                    <span className="dash-ui-diff-pill pill-medium">
                      <span className="diff-dot dot-medium" /> Medium
                    </span>
                    <span className="dash-ui-diff-score">
                      <strong>{medium}</strong> solved <span className="diff-pct">({mediumPct}%)</span>
                    </span>
                  </div>
                  <ProgressBar
                    value={medium}
                    max={solved || 1}
                    color="#ffa116"
                    showCount={false}
                    height={5}
                    animated
                  />
                </div>

                {/* Hard Row */}
                <div className="dash-ui-diff-bar-item">
                  <div className="dash-ui-diff-bar-head">
                    <span className="dash-ui-diff-pill pill-hard">
                      <span className="diff-dot dot-hard" /> Hard
                    </span>
                    <span className="dash-ui-diff-score">
                      <strong>{hard}</strong> solved <span className="diff-pct">({hardPct}%)</span>
                    </span>
                  </div>
                  <ProgressBar
                    value={hard}
                    max={solved || 1}
                    color="#ef4743"
                    showCount={false}
                    height={5}
                    animated
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Recent Activity Timeline */}
          <div className="dash-ui-panel dash-ui-activity-panel">
            <div className="dash-ui-panel-head">
              <div>
                <span className="dash-ui-section-tag">SUBMISSIONS</span>
                <h2>Recent Practice Feed</h2>
              </div>
              {recentActivity.length > 0 && (
                <span className="dash-ui-feed-meta">
                  <Clock size={13} /> {recentActivity.length} recent sessions
                </span>
              )}
            </div>

            {recentActivity.length > 0 ? (
              <div className="dash-ui-activity-list">
                {recentActivity.slice(0, 8).map((item, idx) => {
                  const title = item.title || item.question?.title || 'Unknown Question';
                  const slug  = item.slug || item.question?.slug;
                  const diff  = item.difficulty || item.question?.difficulty || 'MEDIUM';
                  const dateStr = item.updatedAt
                    ? new Date(item.updatedAt).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                      })
                    : 'Recent';

                  return (
                    <div key={item.questionId || slug || idx} className="dash-ui-activity-row">
                      <div className="dash-ui-act-left">
                        <span className="dash-ui-act-check">
                          <CheckCircle2 size={15} />
                        </span>
                        <div className="dash-ui-act-title-wrap">
                          {slug ? (
                            <Link to={`/questions/${slug}`} className="dash-ui-act-title">
                              {title}
                            </Link>
                          ) : (
                            <span className="dash-ui-act-title">{title}</span>
                          )}
                          <span className="dash-ui-act-date">{dateStr}</span>
                        </div>
                      </div>

                      <div className="dash-ui-act-right">
                        <DifficultyBadge difficulty={diff} />
                        {slug && (
                          <Link to={`/questions/${slug}`} className="dash-ui-act-solve">
                            <span>Solve</span>
                            <ArrowRight size={12} />
                          </Link>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="dash-ui-empty-box">
                <Compass size={36} />
                <p>No practice activity yet. Select a company or topic to start solving.</p>
                <Link to="/companies" className="btn btn-primary btn-sm">
                  Browse Companies
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Right Column (Sidebar: Companies, Topics, Quick Launch) */}
        <div className="dash-ui-col-side">
          {/* Target Company Mastery */}
          <div className="dash-ui-panel">
            <div className="dash-ui-panel-head">
              <div>
                <span className="dash-ui-section-tag">COMPANIES</span>
                <h2>Target Companies</h2>
              </div>
              <Link to="/companies" className="dash-ui-link-action">
                View All <ChevronRight size={14} />
              </Link>
            </div>

            {topCompanies.length > 0 ? (
              <div className="dash-ui-company-list">
                {topCompanies.slice(0, 5).map((comp, idx) => (
                  <Link
                    key={comp.slug || idx}
                    to={`/company/${comp.slug}`}
                    className="dash-ui-company-item"
                  >
                    <div className="dash-ui-comp-left">
                      <span className="dash-ui-comp-rank">{idx + 1}</span>
                      <CompanyLogo slug={comp.slug} name={comp.name} size={30} />
                      <span className="dash-ui-comp-name">{comp.name}</span>
                    </div>
                    <div className="dash-ui-comp-right">
                      <span className="dash-ui-comp-count">
                        <strong>{comp.solvedCount || 0}</strong> solved
                      </span>
                      <ChevronRight size={14} className="dash-ui-comp-arrow" />
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="dash-ui-empty-side">
                <Building2 size={28} />
                <p>Solve company-tagged questions to track your company progress.</p>
              </div>
            )}
          </div>

          {/* Algorithm Patterns / Topics */}
          <div className="dash-ui-panel">
            <div className="dash-ui-panel-head">
              <div>
                <span className="dash-ui-section-tag">PATTERNS</span>
                <h2>Topic Mastery</h2>
              </div>
              <Link to="/topics" className="dash-ui-link-action">
                All Topics <ChevronRight size={14} />
              </Link>
            </div>

            {topTopics.length > 0 ? (
              <div className="dash-ui-topic-list">
                {topTopics.slice(0, 5).map((top, idx) => {
                  const name = top.name || top.topic || 'General';
                  const slug = name.toLowerCase().replace(/\s+/g, '-');
                  return (
                    <Link
                      key={slug || idx}
                      to={`/topics/${slug}`}
                      className="dash-ui-topic-item"
                    >
                      <div className="dash-ui-topic-left">
                        <div className="dash-ui-topic-icon">
                          <BarChart3 size={14} />
                        </div>
                        <span className="dash-ui-topic-name">{name}</span>
                      </div>
                      <span className="dash-ui-topic-count">
                        <strong>{top.solvedCount || 0}</strong>
                      </span>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <div className="dash-ui-empty-side">
                <Layers size={28} />
                <p>Master specific data structure topics and patterns.</p>
              </div>
            )}
          </div>

         
        </div>
      </div>
    </motion.div>
  );
}
