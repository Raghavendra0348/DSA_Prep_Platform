import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, CircleDot, Star, BookOpen, ArrowRight, RefreshCw } from 'lucide-react';
import { getDashboard } from '../api/dashboard';
import { useAuth } from '../hooks/useAuth';
import DifficultyBadge from '../components/ui/DifficultyBadge';
import ProgressRing from '../components/ui/ProgressRing';
import Skeleton from '../components/ui/Skeleton';
import EmptyState from '../components/ui/EmptyState';
import './Dashboard.css';

export default function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    try {
      const res = await getDashboard();
      setData(res);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    document.title = 'Dashboard — DSA Prep';
    load();
  }, [load]);

  // Refetch silently when the tab/window regains focus
  // so stats update after solving problems on other pages
  useEffect(() => {
    function onFocus() { load(true); }
    function onVisible() {
      if (document.visibilityState === 'visible') load(true);
    }
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [load]);

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

  const overview       = data?.overview       || {};
  const difficulty     = data?.difficulty     || {};
  const topCompanies   = data?.topCompanies   || [];
  const topTopics      = data?.topTopics      || [];
  const recentActivity = data?.recentActivity || [];

  const solved    = overview.totalSolved    || 0;
  const attempted = overview.totalAttempted || 0;
  const bookmarks = overview.totalBookmarks || 0;
  const total     = overview.totalQuestions || 0;
  const easy      = difficulty.easy         || 0;
  const medium    = difficulty.medium       || 0;
  const hard      = difficulty.hard         || 0;

  return (
    <div className="dashboard container">
      <div className="dash-header">
        <h1>Welcome, {user?.name || 'User'} </h1>
        <button
          className={`dash-refresh-btn ${refreshing ? 'spinning' : ''}`}
          onClick={() => load(true)}
          title="Refresh stats"
          disabled={refreshing}
        >
          <RefreshCw size={16} />
          {refreshing ? 'Updating...' : 'Refresh'}
        </button>
      </div>

      {/* ── Overview Stats ─────────────────────────────────────────────────── */}
      <div className="dash-stats-grid">
        <div className="card dash-stat-card dash-stat-solved">
          <CheckCircle2 size={22} />
          <span className="dash-stat-value">{solved}</span>
          <span className="dash-stat-label">Solved</span>
        </div>
        <div className="card dash-stat-card dash-stat-attempted">
          <CircleDot size={22} />
          <span className="dash-stat-value">{attempted}</span>
          <span className="dash-stat-label">Attempted</span>
        </div>
        <div className="card dash-stat-card dash-stat-bookmarks">
          <Star size={22} />
          <span className="dash-stat-value">{bookmarks}</span>
          <span className="dash-stat-label">Bookmarks</span>
        </div>
        <div className="card dash-stat-card dash-stat-total">
          <BookOpen size={22} />
          <span className="dash-stat-value">{total}</span>
          <span className="dash-stat-label">Total</span>
        </div>
      </div>

      {/* ── Difficulty Breakdown ───────────────────────────────────────────── */}
      <div className="dash-row">
        <div className="card dash-difficulty-card">
          <h2>Difficulty Breakdown</h2>
          <div className="dash-difficulty-bars">
            <DiffBar label="Easy" count={easy} total={total} color="var(--easy)" />
            <DiffBar label="Medium" count={medium} total={total} color="var(--medium)" />
            <DiffBar label="Hard" count={hard} total={total} color="var(--hard)" />
          </div>
        </div>

        <div className="card dash-progress-card">
          <h2>Overall Progress</h2>
          <div className="dash-progress-center">
            <ProgressRing solved={solved} total={total || 1} size={100} strokeWidth={8} />
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

function DiffBar({ label, count, total, color }) {
  const pct = total > 0 ? (count / total) * 100 : 0;
  return (
    <div className="dash-diff-row">
      <span className="dash-diff-label" style={{ color }}>{label}</span>
      <div className="dash-diff-track">
        <div className="dash-diff-fill" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="dash-diff-count">{count}</span>
    </div>
  );
}
