import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ExternalLink, Star } from 'lucide-react';
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
    } catch (err) {
      // Re-fetch on failure
      const data = await getBookmarks({ page, limit: 30 });
      setBookmarks(data.bookmarks || []);
    }
  };

  return (
    <div className="bookmarks-page container">
      <h1>Bookmarks</h1>
      <p className="bookmarks-subtitle">Your saved problems for quick access</p>

      {loading ? (
        <div className="bookmarks-list">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="card" style={{ padding: 14, marginBottom: 8 }}>
              <Skeleton width="50%" height={16} />
              <Skeleton width="30%" height={14} style={{ marginTop: 8 }} />
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
          <div className="bookmarks-list">
            {bookmarks.map((bm, i) => {
              const q = bm.question || bm;
              const qId = bm.questionId || q.id;
              return (
                <div key={qId || i} className="card bookmark-row">
                  <div className="bookmark-main">
                    <Link to={`/questions/${q.slug}`} className="bookmark-title">
                      {q.title}
                    </Link>
                    <DifficultyBadge difficulty={q.difficulty} />
                    {q.link && (
                      <a href={q.link} target="_blank" rel="noopener noreferrer" className="bookmark-ext">
                        <ExternalLink size={13} />
                      </a>
                    )}
                  </div>
                  <div className="bookmark-meta">
                    {(q.topics || []).slice(0, 3).map(t => (
                      <TopicChip key={t} topic={t} />
                    ))}
                  </div>
                  <button
                    className="btn btn-ghost btn-sm bookmark-remove"
                    onClick={() => handleUnbookmark(qId)}
                  >
                    Remove
                  </button>
                </div>
              );
            })}
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
