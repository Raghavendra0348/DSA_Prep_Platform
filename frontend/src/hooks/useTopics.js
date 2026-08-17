import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getTopics } from '../api/topics';
import { QUERY_KEYS } from '../lib/queryKeys';

/**
 * Topics list via TanStack Query.
 * Filtering is done client-side (no API round-trip).
 */
export function useTopics() {
  const [search, setSearch] = useState('');

  const { data, isPending, isError, error } = useQuery({
    queryKey: QUERY_KEYS.topics(),
    queryFn:  async () => {
      const res = await getTopics();
      return res.topics ?? res;
    },
    staleTime: 1000 * 60 * 5, // topics change rarely
  });

  const allTopics = data ?? [];

  const filteredTopics = search.trim()
    ? allTopics.filter(t => t.name.toLowerCase().includes(search.toLowerCase()))
    : allTopics;

  return {
    topics:   filteredTopics,
    rawCount: allTopics.length,
    loading:  isPending,
    error:    isError ? (error?.message ?? 'Failed to load topics') : null,
    search,
    setSearch,
  };
}
