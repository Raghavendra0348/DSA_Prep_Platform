import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, ExternalLink, FileText, LogIn } from 'lucide-react';
import { useQuestion } from '../hooks/useQuestion';
import { useAuth } from '../hooks/useAuth';
import AuthModal from '../components/ui/AuthModal';
import DifficultyBadge from '../components/ui/DifficultyBadge';
import TopicChip from '../components/ui/TopicChip';
import StatusBadge from '../components/ui/StatusBadge';
import BookmarkBtn from '../components/ui/BookmarkBtn';
import Skeleton from '../components/ui/Skeleton';
import EmptyState from '../components/ui/EmptyState';
import './QuestionDetail.css';

export default function QuestionDetail() {
  const { slug } = useParams();
  const { user } = useAuth();
  const [authModalOpen, setAuthModalOpen] = useState(false);

  // ── TanStack Query hook ──────────────────────────────────────────────────
  const {
    question,
    loading,
    error,
    notes,         setNotes,
    notesSaving,
    notesSaved,
    handleNotesSave,
    handleStatusChange,
    handleBookmark,
  } = useQuestion(slug);

  useEffect(() => {
    if (question?.title) {
      document.title = `${question.title} — DSA Prep`;
    }
  }, [question?.title]);

  if (loading) {
    return (
      <div className="question-detail container">
        <Skeleton width={120} height={14} />
        <Skeleton width="60%" height={32} style={{ marginTop: 16 }} />
        <Skeleton width={80} height={24} style={{ marginTop: 12, borderRadius: 999 }} />
        <div style={{ display: 'flex', gap: 6, marginTop: 16 }}>
          <Skeleton width={60} height={24} style={{ borderRadius: 6 }} />
          <Skeleton width={70} height={24} style={{ borderRadius: 6 }} />
          <Skeleton width={55} height={24} style={{ borderRadius: 6 }} />
        </div>
        <Skeleton width="100%" height={200} style={{ marginTop: 32, borderRadius: 12 }} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="question-detail container">
        <EmptyState message={error} />
      </div>
    );
  }

  if (!question) return null;

  return (
    <div className="question-detail container">
      <Link to="/companies" className="back-link">
        <ArrowLeft size={18} /> Back
      </Link>

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="qd-header">
        <h1>{question.title}</h1>
        <div className="qd-meta">
          <DifficultyBadge difficulty={question.difficulty} />
          {question.acceptanceRate != null && (
            <span className="qd-acceptance">{question.acceptanceRate?.toFixed(1)}% acceptance</span>
          )}
        </div>
        <div className="qd-topics">
          {(question.topics || []).map(t => (
            <TopicChip key={t} topic={t} />
          ))}
        </div>
      </div>

      {/* ── LeetCode Link ──────────────────────────────────────────────────── */}
      {question.link && (
        <a
          href={question.link}
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-primary qd-leetcode-btn"
        >
          <ExternalLink size={16} /> Solve on LeetCode
        </a>
      )}

      {/* ── Companies that asked this ──────────────────────────────────────── */}
      {question.companies && question.companies.length > 0 && (
        <div className="qd-section">
          <h2>Companies</h2>
          <div className="qd-companies-list">
            {question.companies.map((c, i) => (
              <Link
                key={i}
                to={`/company/${c.slug}`}
                className="card qd-company-item"
              >
                <span className="qd-company-name">{c.name}</span>
                <div className="qd-company-meta">
                  {c.frequency != null && <span>Freq: {c.frequency}</span>}
                  {c.period && <span className="chip">{c.period}</span>}
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* ── User Section (auth only) ───────────────────────────────────────── */}
      {user ? (
        <div className="qd-section qd-user-section">
          <h2>Your Progress</h2>
          <div className="qd-user-controls">
            <div className="qd-control-group">
              <span className="qd-label-text">Status</span>
              <StatusBadge
                status={question.status || 'not-started'}
                onClick={handleStatusChange}
              />
              <span className="qd-status-label">
                {(question.status || 'not-started').replace(/-/g, ' ')}
              </span>
            </div>

            <div className="qd-control-group">
              <span className="qd-label-text">Bookmark</span>
              <BookmarkBtn
                active={question.bookmarked}
                onClick={handleBookmark}
              />
            </div>
          </div>

          {/* Notes */}
          <div className="qd-notes">
            <div className="qd-notes-header">
              <FileText size={16} />
              <label htmlFor="qd-notes-input">Notes</label>
            </div>
            <textarea
              id="qd-notes-input"
              className="input qd-notes-input"
              placeholder="Add your solution notes, approach, complexity analysis..."
              value={notes}
              onChange={(e) => { setNotes(e.target.value); }}
              rows={5}
            />
            <div className="qd-notes-footer">
              <button
                className="btn btn-primary btn-sm"
                onClick={handleNotesSave}
                disabled={notesSaving}
              >
                {notesSaving ? 'Saving...' : notesSaved ? '✓ Saved' : 'Save Notes'}
              </button>
            </div>
          </div>
        </div>
      ) : (
        // Unauthenticated CTA — prompts login
        <div className="qd-section qd-guest-section">
          <button
            className="btn btn-primary qd-login-cta"
            onClick={() => setAuthModalOpen(true)}
          >
            <LogIn size={16} />
            Sign in to track your progress
          </button>
        </div>
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
