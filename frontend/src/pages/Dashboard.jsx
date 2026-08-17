import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, CircleDot, Star, BookOpen, ArrowRight, RefreshCw } from 'lucide-react';
import { useDashboard } from '../hooks/useDashboard';
import { useAuth } from '../hooks/useAuth';
import StatCard from '../components/ui/StatCard';
import ProgressBar from '../components/ui/ProgressBar';
import DifficultyBadge from '../components/ui/DifficultyBadge';
import ProgressRing from '../components/ui/ProgressRing';
import Skeleton from '../components/ui/Skeleton';
import EmptyState from '../components/ui/EmptyState';
import './Dashboard.css';

export default function Dashboard() {
  const { user } = useAuth();
  const { dashboardData, loading, error, isRefetching, refresh } = useDashboard();

  useEffect(() => {
    document.title = 'Dashboard — DSA Prep';
  }, []);

  if (loading) {
    return (
      <div className="dashboard container">
        <Skeleton width={200} height={28} />
        <div className="dash-stats-grid" style={{ marginTop: 24 }}>
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="card" style={{ padding: 20 }}>
              <Skeleton width={40} height={40} style={{ borderRadius: 10 }} />
              <Skeleton width={60} height={28} style={{ marginTop: 12 }} />
              <Skeleton width={80} height={14} style={{ marginTop: 6 }} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard container">
        <EmptyState message={error} />
      </div>
    );
  }

  const overview       = dashboardData?.overview       || {};
  const difficulty     = dashboardData?.difficulty     || {};
  const topCompanies   = dashboardData?.topCompanies   || [];
  const topTopics      = dashboardData?.topTopics      || [];
  const recentActivity = dashboardData?.recentActivity || [];

  const solved    = overview.totalSolved    || 0;
  const attempted = overview.totalAttempted || 0;
  const bookmarks = overview.totalBookmarks || 0;
  const total     = overview.totalQuestions || 0;
  const easy      = difficulty.easy         || 0;
  const medium    = difficulty.medium       || 0;
  const hard      = difficulty.hard         || 0;

  return (
    <div className="dashboard container animate-in">
      <div className="dash-header">
        <h1>Welcome, {user?.name || 'User'}</h1>
        <button
          className={`dash-refresh-btn ${isRefetching ? 'spinning' : ''}`}
          onClick={() => refresh()}
          title="Refresh stats"
          disabled={isRefetching}
        >
          <RefreshCw size={16} />
          {isRefetching ? 'Updating...' : 'Refresh'}
        </button>
      </div>

      {/* ── Overview Stat Cards (With Count-Up Animation) ────────────────────── */}
      <div className="dash-stats-grid">
        <StatCard
          icon={CheckCircle2}
          value={solved}
          label="Solved"
          color="var(--easy, #00b8a3)"
        />
        <StatCard
          icon={CircleDot}
          value={attempted}
          label="Attempted"
          color="var(--medium, #ffa116)"
        />
        <StatCard
          icon={Star}
          value={bookmarks}
          label="Bookmarks"
          color="#e3b341"
        />
        <StatCard
          icon={BookOpen}
          value={total}
          label="Total Questions"
          color="var(--accent, #58a6ff)"
        />
      </div>

      {/* ── Difficulty Breakdown & Overall Progress ──────────────────────────── */}
      <div className="dash-row">
        <div className="card dash-difficulty-card">
          <h2>Difficulty Breakdown</h2>
          <div className="dash-difficulty-bars" style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 16 }}>
            <ProgressBar label="Easy" value={easy} max={total} color="var(--easy, #00b8a3)" />
            <ProgressBar label="Medium" value={medium} max={total} color="var(--medium, #ffa116)" />
            <ProgressBar label="Hard" value={hard} max={total} color="var(--hard, #ef4743)" />
          </div>
        </div>

        <div className="card dash-progress-card">
          <h2>Overall Progress</h2>
          <div className="dash-progress-center">
            <ProgressRing solved={solved} total={total || 1} size={110} strokeWidth={9} />
            <p className="dash-progress-text">{solved} / {total} solved</p>
          </div>
        </div>
      </div>

      {/* ── Top Companies + Topics ─────────────────────────────────────────── */}
      <div className="dash-row">
        {topCompanies.length > 0 && (
          <div className="card dash-list-card">
            <h2>Top Companies</h2>
            <div className="dash-list">
              {topCompanies.slice(0, 5).map((c, i) => (
                <Link key={i} to={`/company/${c.slug}`} className="dash-list-item">
                  <span>{c.name}</span>
                  <span className="dash-list-count">{c.solvedCount || 0} solved</span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {topTopics.length > 0 && (
          <div className="card dash-list-card">
            <h2>Top Topics</h2>
            <div className="dash-list">
              {topTopics.slice(0, 5).map((t, i) => (
                <Link
                  key={i}
                  to={`/topics/${(t.name || t.topic || '').toLowerCase().replace(/\s+/g, '-')}`}
                  className="dash-list-item"
                >
                  <span>{t.name || t.topic}</span>
                  <span className="dash-list-count">{t.solvedCount || 0} solved</span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Recent Activity ────────────────────────────────────────────────── */}
      {recentActivity.length > 0 && (
        <div className="card dash-activity-card">
          <h2>Recent Activity</h2>
          <div className="dash-activity-list">
            {recentActivity.slice(0, 10).map((item, i) => (
              <div key={i} className="dash-activity-item">
                <div className="dash-activity-main">
                  <span className="dash-activity-title">{item.title || item.question?.title}</span>
                  <DifficultyBadge difficulty={item.difficulty || item.question?.difficulty} />
                </div>
                <span className="dash-activity-time">
                  {item.updatedAt ? new Date(item.updatedAt).toLocaleDateString() : ''}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {solved === 0 && attempted === 0 && (
        <EmptyState
          message="Start solving problems to see your stats here"
          action={
            <Link to="/companies" className="btn btn-primary">
              Browse Companies <ArrowRight size={16} />
            </Link>
          }
        />
      )}
    </div>
  );
}
