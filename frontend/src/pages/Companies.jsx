import { useState, useEffect, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Building2, ArrowUpDown } from 'lucide-react';
import { getCompanies } from '../api/companies';
import SearchInput from '../components/shared/SearchInput';
import Skeleton from '../components/ui/Skeleton';
import EmptyState from '../components/ui/EmptyState';
import './Companies.css';

const SORT_OPTIONS = [
  { value: 'az',        label: 'A → Z' },
  { value: 'za',        label: 'Z → A' },
  { value: 'questions', label: 'Most Questions' },
];

export default function Companies() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sort, setSort] = useState('az');

  const query = searchParams.get('q') || '';

  useEffect(() => {
    document.title = 'Companies — DSA Prep';
    async function load() {
      try {
        const data = await getCompanies();
        setCompanies(data.companies || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handleSearch = (q) => {
    if (q) {
      setSearchParams({ q });
    } else {
      setSearchParams({});
    }
  };

  // Client-side filter + sort
  const filtered = useMemo(() => {
    let list = companies;

    // Search filter
    if (query) {
      const q = query.toLowerCase();
      list = list.filter(c => c.name.toLowerCase().includes(q));
    }

    // Sort
    list = [...list].sort((a, b) => {
      if (sort === 'az') return a.name.localeCompare(b.name);
      if (sort === 'za') return b.name.localeCompare(a.name);
      if (sort === 'questions') return (b.questionCount || 0) - (a.questionCount || 0);
      return 0;
    });

    return list;
  }, [companies, query, sort]);

  return (
    <div className="companies-page container">
      <div className="companies-header">
        <h1>Companies</h1>
        <p className="companies-subtitle">
          Browse {companies.length} companies and their LeetCode questions
        </p>
      </div>

      {/* Search + Sort */}
      <div className="companies-controls">
        <SearchInput
          value={query}
          onChange={handleSearch}
          placeholder="Search companies..."
          debounceMs={150}
        />
        <div className="companies-sort">
          <ArrowUpDown size={14} />
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="filter-select"
          >
            {SORT_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="companies-grid">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="card company-card-skeleton">
              <Skeleton width="70%" height={20} />
              <Skeleton width="40%" height={14} style={{ marginTop: 8 }} />
              <div style={{ display: 'flex', gap: 6, marginTop: 16 }}>
                <Skeleton width={50} height={22} style={{ borderRadius: 6 }} />
                <Skeleton width={60} height={22} style={{ borderRadius: 6 }} />
                <Skeleton width={45} height={22} style={{ borderRadius: 6 }} />
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <EmptyState message={`Failed to load companies: ${error}`} />
      ) : filtered.length === 0 ? (
        <EmptyState message={`No companies match "${query}"`} />
      ) : (
        <div className="companies-grid">
          {filtered.map(company => (
            <Link
              key={company.slug}
              to={`/company/${company.slug}`}
              className="card company-card"
            >
              <div className="company-card-icon">
                <Building2 size={20} />
              </div>
              <h3 className="company-card-name">{company.name}</h3>
              <span className="company-card-count">
                {company.questionCount} problems
              </span>
              <div className="company-card-topics">
                {(company.topTopics || []).slice(0, 4).map(t => (
                  <span key={t} className="chip">{t}</span>
                ))}
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Result count */}
      {!loading && !error && query && (
        <p className="companies-result-count">
          Showing {filtered.length} of {companies.length} companies
        </p>
      )}
    </div>
  );
}
