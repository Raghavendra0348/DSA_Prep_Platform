import { useQuery } from '@tanstack/react-query';
import { search as apiSearch } from '../api/search';
import { QUERY_KEYS } from '../lib/queryKeys';
import { useDebounce } from './useDebounce';
import { useState } from 'react';

/**
 * Search hook via TanStack Query.
 * - Debounced query prevents excess requests
 * - Enabled only when query length >= 2
 * - Results are cached per (query, type, difficulty) key
 */
export function useSearch(initialQuery = '', initialType = 'all') {
  const [query,      setQuery]      = useState(initialQuery);
  const [type,       setType]       = useState(initialType);
  const [difficulty, setDifficulty] = useState('');

  const debouncedQuery = useDebounce(query, 280);

  const enabled = debouncedQuery.trim().length >= 2;

  const { data, isPending, isError, error } = useQuery({
    queryKey: QUERY_KEYS.search(debouncedQuery, type, difficulty),
    queryFn:  async () => {
      const res = await apiSearch(
        debouncedQuery.trim(),
        type === 'all' ? undefined : type,
        difficulty || undefined
      );
      return {
        questions: Array.isArray(res?.questions?.results) ? res.questions.results
                 : Array.isArray(res?.questions)          ? res.questions : [],
        topics:    Array.isArray(res?.topics?.results)    ? res.topics.results
                 : Array.isArray(res?.topics)             ? res.topics    : [],
        companies: Array.isArray(res?.companies?.results) ? res.companies.results
                 : Array.isArray(res?.companies)          ? res.companies : [],
      };
    },
    enabled,
    staleTime: 1000 * 60 * 1, // 1 min for search results
  });

  const empty = { questions: [], companies: [], topics: [] };

  return {
    query,      setQuery,
    type,       setType,
    difficulty, setDifficulty,
    results: enabled ? (data ?? empty) : empty,
    loading: enabled && isPending,
    error:   isError ? (error?.message ?? 'Search failed') : null,
  };
}
