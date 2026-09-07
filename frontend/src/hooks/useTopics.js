import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getTopics } from '../api/topics';
import { QUERY_KEYS } from '../lib/queryKeys';
import { getTopicCategory } from '../data/topicMetadata';

/**
 * Topics list via TanStack Query with client-side category and query filtering.
 */
export function useTopics(initialCategory = 'all') {
  const [search, setSearch]     = useState('');
  const [category, setCategory] = useState(initialCategory);

  const { data, isPending, isError, error } = useQuery({
    queryKey: QUERY_KEYS.topics(),
    queryFn:  async () => {
      const res = await getTopics();
      return res.topics ?? res ?? [];
    },
    staleTime: 1000 * 60 * 5, // 5 min cache
  });

  const allTopics = useMemo(() => data ?? [], [data]);

  const filteredTopics = useMemo(() => {
    let list = allTopics;

    if (category && category !== 'all') {
      list = list.filter(t => getTopicCategory(t.slug) === category);
    }

    if (search.trim()) {
      const q = search.toLowerCase().trim();
      list = list.filter(t => t.name.toLowerCase().includes(q) || t.slug.includes(q));
    }

    return list;
  }, [allTopics, category, search]);

  const totalProblems = useMemo(() => {
    return allTopics.reduce((acc, t) => acc + (t.problemCount || 0), 0);
  }, [allTopics]);

  return {
    topics:         filteredTopics,
    allTopics,
    rawCount:       allTopics.length,
    totalProblems,
    loading:        isPending,
    error:          isError ? (error?.message ?? 'Failed to load topics') : null,
    search,
    setSearch,
    category,
    setCategory,
  };
}
