import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Tags } from 'lucide-react';
import { getTopics } from '../api/topics';
import SearchInput from '../components/shared/SearchInput';
import Skeleton from '../components/ui/Skeleton';
import EmptyState from '../components/ui/EmptyState';
import './Topics.css';

// Color palette for topic cards — rotates through these
const TOPIC_COLORS = [
  'rgba(88, 166, 255, 0.12)',
  'rgba(163, 113, 247, 0.12)',
  'rgba(0, 184, 163, 0.12)',
  'rgba(255, 161, 22, 0.12)',
  'rgba(239, 71, 67, 0.12)',
  'rgba(63, 185, 80, 0.12)',
  'rgba(219, 171, 9, 0.12)',
  'rgba(121, 184, 255, 0.12)',
];

export default function Topics() {
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [error, setError] = useState(null);

  useEffect(() => {
    document.title = 'Topics — DSA Prep';
    async function load() {
      try {
        const data = await getTopics();
        setTopics(data.topics || data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const filtered = useMemo(() => {
    if (!search) return topics;
    const q = search.toLowerCase();
    return topics.filter(t =>
      (t.name || t.topic || '').toLowerCase().includes(q)
    );
  }, [topics, search]);

  return (
    <div className="topics-page container">
      <div className="topics-header">
        <h1>DSA Topics</h1>
        <p className="topics-subtitle">
          Explore {topics.length} topics and their problems
        </p>
      </div>

      <div className="topics-search">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Filter topics..."
          debounceMs={150}
        />
      </div>

      {loading ? (
        <div className="topics-grid">
          {Array.from({ length: 16 }).map((_, i) => (
            <div key={i} className="card topic-card-skeleton">
              <Skeleton width="60%" height={18} />
              <Skeleton width="40%" height={14} style={{ marginTop: 8 }} />
            </div>
          ))}
        </div>
      ) : error ? (
        <EmptyState message={error} />
      ) : filtered.length === 0 ? (
        <EmptyState message={`No topics match "${search}"`} />
      ) : (
        <div className="topics-grid">
          {filtered.map((topic, idx) => {
            const name = topic.name || topic.topic;
            const slug = name.toLowerCase().replace(/\s+/g, '-');
            const count = topic.questionCount || topic.problemCount || 0;
            const color = TOPIC_COLORS[idx % TOPIC_COLORS.length];

            return (
              <Link
                key={name}
                to={`/topics/${slug}`}
                className="card topic-card"
              >
                <div className="topic-card-accent" style={{ background: color }}>
                  <Tags size={20} />
                </div>
                <div className="topic-card-info">
                  <h3 className="topic-card-name">{name}</h3>
                  <span className="topic-card-count">{count} problems</span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
