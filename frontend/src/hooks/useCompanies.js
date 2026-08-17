import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getCompanies } from '../api/companies';
import { QUERY_KEYS } from '../lib/queryKeys';

/**
 * Company list via TanStack Query with local filter + sort.
 * - Server-state (fetch/cache) handled by React Query
 * - Client-state (search/sort) stays in useState (instant, no network needed)
 */
export function useCompanies(initialSort = 'name-asc') {
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState(initialSort);

  const { data, isPending, isError, error, refetch } = useQuery({
    queryKey: QUERY_KEYS.companies(),
    queryFn:  async () => {
      const res = await getCompanies();
      return res.companies ?? res;
    },
    staleTime: 1000 * 60 * 5, // companies list changes rarely
  });

  const companies = data ?? [];

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
      if (sortBy === 'name-asc')        return a.name.localeCompare(b.name);
      if (sortBy === 'name-desc')       return b.name.localeCompare(a.name);
      if (sortBy === 'questions-desc')  return (b.questionCount || 0) - (a.questionCount || 0);
      if (sortBy === 'questions-asc')   return (a.questionCount || 0) - (b.questionCount || 0);
      return 0;
    });

    return result;
  }, [companies, search, sortBy]);

  return {
    companies:  filteredAndSorted,
    totalCount: companies.length,
    loading:    isPending,
    error:      isError ? (error?.message ?? 'Failed to load companies') : null,
    search,
    setSearch,
    sortBy,
    setSortBy,
    refetch,
  };
}
