import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Search as SearchIcon } from 'lucide-react';
import { search as apiSearch } from '../api/search';
import DifficultyBadge from '../components/ui/DifficultyBadge';
import TopicChip from '../components/ui/TopicChip';
import Skeleton from '../components/ui/Skeleton';
import EmptyState from '../components/ui/EmptyState';
import './Search.css';

const TYPES = [
  { value: 'all',       label: 'All' },
  { value: 'questions', label: 'Questions' },
  { value: 'topics',    label: 'Topics' },
  { value: 'companies', label: 'Companies' },
];

export default function Search() {
  const [searchParams, setSearchParams] = useSearchParams();
  const q    = searchParams.get('q') || '';
  const type = searchParams.get('type') || 'all';

  const [query, setQuery] = useState(q);
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    document.title = q ? `Search: ${q} — DSA Prep` : 'Search — DSA Prep';
  }, [q]);

  // Debounced search
  useEffect(() => {
    if (!q || q.length < 2) { setResults(null); return; }

    const timer = setTimeout(async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await apiSearch(q, type);
        setResults(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [q, type]);

  const handleInputChange = (e) => {
    const val = e.target.value;
    setQuery(val);
    if (val.trim().length >= 2) {
      setSearchParams({ q: val.trim(), ...(type !== 'all' && { type }) });
    } else {
      setSearchParams({});
    }
  };

  const handleTypeChange = (newType) => {
    setSearchParams(prev => {
      const params = new URLSearchParams(prev);
      if (newType === 'all') params.delete('type');
      else params.set('type', newType);
      return params;
    });
  };

  const questions = results?.questions || results?.results || [];
  const topics    = results?.topics || [];
  const companies = results?.companies || [];

  return (
    <div className="search-page container">
      <div className="search-hero">
        <h1>Search</h1>
        <div className="search-large-input">
          <SearchIcon size={22} className="search-large-icon" />
          <input
            type="text"
            className="search-large-field"
            placeholder="Search questions, topics, or companies..."
            value={query}
            onChange={handleInputChange}
            autoFocus
          />
        </div>

        <div className="search-type-toggles">
          {TYPES.map(t => (
            <button
              key={t.value}
              className={`search-type-btn ${type === t.value ? 'active' : ''}`}
              onClick={() => handleTypeChange(t.value)}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Results */}
      <div className="search-results">
        {loading ? (
          <div className="search-skeleton">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="card" style={{ padding: 16 }}>
                <Skeleton width="60%" height={18} />
                <Skeleton width="30%" height={14} style={{ marginTop: 8 }} />
              </div>
            ))}
          </div>
        ) : error ? (
          <EmptyState message={error} />
        ) : !q || q.length < 2 ? (
          <EmptyState
            icon={SearchIcon}
            message="Type at least 2 characters to search"
          />
        ) : results && questions.length === 0 && topics.length === 0 && companies.length === 0 ? (
          <EmptyState message={`No results for "${q}"`} />
        ) : (
          <>
            {/* Questions */}
            {questions.length > 0 && (type === 'all' || type === 'questions') && (
              <div className="search-section">
                <h2 className="search-section-title">
                  Questions <span className="search-count">{questions.length}</span>
                </h2>
                {questions.map(item => (
                  <div key={item.id || item.slug} className="card search-result-card">
                    <div className="search-result-top">
                      <span className="search-result-title">{item.title}</span>
                      <DifficultyBadge difficulty={item.difficulty} />
                    </div>
                    <div className="search-result-meta">
                      {(item.topics || []).slice(0, 3).map(t => (
                        <TopicChip key={t} topic={t} />
                      ))}
                      {item.companies && (
                        <span className="search-result-companies">
                          Asked by {item.companies.length || item.companyCount || 0} companies
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Topics */}
            {topics.length > 0 && (type === 'all' || type === 'topics') && (
              <div className="search-section">
                <h2 className="search-section-title">
                  Topics <span className="search-count">{topics.length}</span>
                </h2>
                <div className="search-topics-grid">
                  {topics.map(t => (
                    <Link
                      key={t.name || t.slug}
                      to={`/topics/${(t.slug || t.name || '').toLowerCase().replace(/\s+/g, '-')}`}
                      className="card search-topic-card"
                    >
                      <span className="search-topic-name">{t.name}</span>
                      <span className="search-topic-count">{t.questionCount || t.problemCount} problems</span>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Companies */}
            {companies.length > 0 && (type === 'all' || type === 'companies') && (
              <div className="search-section">
                <h2 className="search-section-title">
                  Companies <span className="search-count">{companies.length}</span>
                </h2>
                <div className="search-companies-grid">
                  {companies.map(c => (
                    <Link
                      key={c.slug || c.name}
                      to={`/company/${c.slug}`}
                      className="card search-company-card"
                    >
                      <span className="search-company-name">{c.name}</span>
                      <span className="search-company-count">{c.questionCount} problems</span>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
