import { useState, useEffect, useMemo } from 'react';
import { getCompanies } from '../api/companies';

export function useCompanies(initialSort = 'name-asc') {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState(initialSort);

  useEffect(() => {
    async function load() {
      try {
        const data = await getCompanies();
        setCompanies(data.companies || data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const filteredAndSorted = useMemo(() => {
    let result = [...companies];

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(c =>
        c.name.toLowerCase().includes(q) ||
        (c.slug && c.slug.toLowerCase().includes(q))
      );
    }

    result.sort((a, b) => {
      if (sortBy === 'name-asc') return a.name.localeCompare(b.name);
      if (sortBy === 'name-desc') return b.name.localeCompare(a.name);
      if (sortBy === 'questions-desc') return (b.questionCount || 0) - (a.questionCount || 0);
      if (sortBy === 'questions-asc') return (a.questionCount || 0) - (b.questionCount || 0);
      return 0;
    });

    return result;
  }, [companies, search, sortBy]);

  return {
    companies: filteredAndSorted,
    totalCount: companies.length,
    loading,
    error,
    search,
    setSearch,
    sortBy,
    setSortBy,
  };
}
