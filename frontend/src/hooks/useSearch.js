import { useQuery } from '@tanstack/react-query';
import { search as apiSearch } from '../api/search';
import { QUERY_KEYS } from '../lib/queryKeys';
import { useDebounce } from './useDebounce';
import { useState, useMemo } from 'react';

const DIFF_ORDER = { EASY: 1, MEDIUM: 2, HARD: 3 };

/**
 * Search hook via TanStack Query.
 * - Debounced query prevents excess requests
 * - Enabled only when query length >= 2
 * - Results are cached per (query, type, difficulty) key
 * - Client-side sorting for questions
 */
export function useSearch(
  initialQuery = '',
  initialType = 'all',
  initialDifficulty = '',
  initialSort = 'relevance'
) {
  const [query,      setQuery]      = useState(initialQuery);
  const [type,       setType]       = useState(initialType);
  const [difficulty, setDifficulty] = useState(initialDifficulty);
  const [sort,       setSort]       = useState(initialSort);

  const debouncedQuery = useDebounce(query, 260);

  const enabled = debouncedQuery.trim().length >= 2;

  const { data, isPending, isFetching, isError, error } = useQuery({
    queryKey: QUERY_KEYS.search(debouncedQuery.trim(), type, difficulty),
    queryFn:  async () => {
      const res = await apiSearch(
        debouncedQuery.trim(),
        type === 'all' ? undefined : type,
        difficulty || undefined,
        40 // richer limit for discovery
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
    staleTime: 1000 * 60 * 2, // 2 mins cache
  });

  // Apply sorting to questions
  const results = useMemo(() => {
    const rawResults = enabled ? (data ?? { questions: [], companies: [], topics: [] }) : { questions: [], companies: [], topics: [] };

    if (!rawResults.questions || rawResults.questions.length === 0 || sort === 'relevance') {
      return rawResults;
    }

    const sortedQuestions = [...rawResults.questions].sort((a, b) => {
      if (sort === 'easy_first') {
        const da = DIFF_ORDER[a.difficulty?.toUpperCase()] || 99;
        const db = DIFF_ORDER[b.difficulty?.toUpperCase()] || 99;
        return da - db;
      }
      if (sort === 'hard_first') {
        const da = DIFF_ORDER[a.difficulty?.toUpperCase()] || 0;
        const db = DIFF_ORDER[b.difficulty?.toUpperCase()] || 0;
        return db - da;
      }
      if (sort === 'companies') {
        const ca = a.companyCount || a.companies?.length || 0;
        const cb = b.companyCount || b.companies?.length || 0;
        return cb - ca;
      }
      return 0;
    });

    return {
      ...rawResults,
      questions: sortedQuestions,
    };
  }, [enabled, data, sort]);

  return {
    query,          setQuery,
    type,           setType,
    difficulty,     setDifficulty,
    sort,           setSort,
    results,
    loading:        enabled && (isPending || isFetching),
    error:          isError ? (error?.message ?? 'Search failed') : null,
  };
}

