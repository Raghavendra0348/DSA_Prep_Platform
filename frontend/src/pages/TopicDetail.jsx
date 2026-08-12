import { useState, useEffect } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { ArrowLeft, ExternalLink } from 'lucide-react';
import { getTopicProblems } from '../api/topics';
import { upsertProgress } from '../api/progress';
import { toggleBookmark as apiToggleBookmark } from '../api/bookmarks';
import { useAuth } from '../hooks/useAuth';
import DifficultyBadge from '../components/ui/DifficultyBadge';
import StatusBadge from '../components/ui/StatusBadge';
import BookmarkBtn from '../components/ui/BookmarkBtn';
import Pagination from '../components/shared/Pagination';
import Skeleton from '../components/ui/Skeleton';
import EmptyState from '../components/ui/EmptyState';
import './TopicDetail.css';

const DIFFICULTIES = ['EASY', 'MEDIUM', 'HARD'];

export default function TopicDetail() {
  const { topic } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();

  const difficulty = searchParams.get('difficulty') || '';
  const page = Number(searchParams.get('page')) || 1;

  const [problems, setProblems] = useState([]);
  const [pagination, setPagination] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeDiff, setActiveDiff] = useState(difficulty ? difficulty.split(',') : []);

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

  const toggleDifficulty = (diff) => {
    const next = activeDiff.includes(diff)
      ? activeDiff.filter(d => d !== diff)
      : [...activeDiff, diff];
    setActiveDiff(next);
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
    catch { /* revert would go here */ }
  };

  const handleBookmark = async (problemId) => {
    if (!user) return;
    setProblems(prev => prev.map(p => p.id === problemId ? { ...p, bookmarked: !p.bookmarked } : p));
    try { await apiToggleBookmark(problemId); }
    catch { setProblems(prev => prev.map(p => p.id === problemId ? { ...p, bookmarked: !p.bookmarked } : p)); }
  };

  return (
    <div className="topic-detail container">
      <Link to="/topics" className="back-link">
        <ArrowLeft size={18} /> Topics
      </Link>

      <h1>{topicName}</h1>
      {pagination.total != null && (
        <p className="topic-detail-meta">{pagination.total} problems</p>
      )}

      {/* Difficulty filter */}
      <div className="topic-filters">
        {DIFFICULTIES.map(diff => (
          <button
            key={diff}
            className={`filter-toggle filter-${diff.toLowerCase()} ${activeDiff.includes(diff) ? 'active' : ''}`}
            onClick={() => toggleDifficulty(diff)}
          >
            {diff}
          </button>
        ))}
      </div>

      {/* Problem list */}
      {loading ? (
        <div className="topic-problem-list">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="card" style={{ padding: 14, marginBottom: 8 }}>
              <Skeleton width="50%" height={16} />
              <Skeleton width="30%" height={14} style={{ marginTop: 6 }} />
            </div>
          ))}
        </div>
      ) : error ? (
        <EmptyState message={error} />
      ) : problems.length === 0 ? (
        <EmptyState message="No problems match your filters" />
      ) : (
        <>
          <div className="topic-problem-list">
            {problems.map((problem, idx) => (
              <div key={problem.id || idx} className="card topic-problem-row">
                <div className="topic-problem-main">
                  <span className="topic-problem-title">{problem.title}</span>
                  <DifficultyBadge difficulty={problem.difficulty} />
                  {problem.link && (
                    <a href={problem.link} target="_blank" rel="noopener noreferrer" className="problem-ext-link">
                      <ExternalLink size={13} />
                    </a>
                  )}
                </div>
                <div className="topic-problem-actions">
                  {user && (
                    <>
                      <StatusBadge
                        status={problem.status || 'not-started'}
                        onClick={(s) => handleStatusChange(problem.id, s)}
                      />
                      <BookmarkBtn
                        active={problem.bookmarked}
                        onClick={() => handleBookmark(problem.id)}
                      />
                    </>
                  )}
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
