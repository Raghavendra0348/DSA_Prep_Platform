import { useState, useEffect } from 'react';
import { search as apiSearch } from '../api/search';

export function useSearch(initialQuery = '', initialType = 'all') {
  const [query, setQuery] = useState(initialQuery);
  const [type, setType] = useState(initialType);
  const [difficulty, setDifficulty] = useState('');
  const [results, setResults] = useState({ questions: [], companies: [], topics: [] });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!query.trim() || query.trim().length < 2) {
      setResults({ questions: [], companies: [], topics: [] });
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await apiSearch(query.trim(), type === 'all' ? undefined : type, difficulty || undefined);
        setResults({
          questions: Array.isArray(data?.questions?.results) ? data.questions.results : Array.isArray(data?.questions) ? data.questions : [],
          topics: Array.isArray(data?.topics?.results) ? data.topics.results : Array.isArray(data?.topics) ? data.topics : [],
          companies: Array.isArray(data?.companies?.results) ? data.companies.results : Array.isArray(data?.companies) ? data.companies : [],
        });
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query, type, difficulty]);

  return {
    query,
    setQuery,
    type,
    setType,
    difficulty,
    setDifficulty,
    results,
    loading,
    error,
  };
}
