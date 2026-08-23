import { useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getTopicProblems } from '../api/topics';
import { upsertProgress } from '../api/progress';
import { toggleBookmark as apiToggleBookmark } from '../api/bookmarks';
import { QUERY_KEYS } from '../lib/queryKeys';

/**
 * Topic detail hook — TanStack Query powered.
 *
 * - Problems are cached per (topic + difficulty + page) key
 * - Status + bookmark mutations are optimistic with auto-rollback
 * - After marking solved, dashboard stats are invalidated
 */
export function useTopicDetail(topic, params = {}) {
  const qc = useQueryClient();
  const difficulty = params.difficulty || '';
  const page       = params.page       || 1;

  const problemParams = {
    difficulty: difficulty || undefined,
    page,
    limit: 50,
  };

  const key = QUERY_KEYS.topicDetail(topic);
  // Use the full parameterised key so each filter combo is cached independently
  const queryKey = [...key, problemParams];

  const { data, isPending, isFetching, isError, error } = useQuery({
    queryKey,
    queryFn: async () => {
      const res = await getTopicProblems(topic, problemParams);
      return {
        problems:   res.problems   ?? res.questions ?? [],
        pagination: res.pagination ?? { page: 1, totalPages: 1, total: res.total ?? 0 },
        topicName:  res.topic      ?? topic,
        stats:      res.stats      ?? null,
      };
    },
    staleTime: 1000 * 60 * 5, // 5 min — switching difficulty filter hits cache instantly
    gcTime:    1000 * 60 * 20,
  });

  // ── Optimistic status update ────────────────────────────────────────────
  const statusMutation = useMutation({
    mutationFn: ({ questionId, status }) => upsertProgress({ questionId, status }),
    onMutate: async ({ questionId, status }) => {
      await qc.cancelQueries({ queryKey });
      const prev = qc.getQueryData(queryKey);
      qc.setQueryData(queryKey, old => ({
        ...old,
        problems: old?.problems?.map(p =>
          p.id === questionId ? { ...p, status } : p
        ) ?? [],
      }));
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) qc.setQueryData(queryKey, ctx.prev);
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.dashboard() });
    },
  });

  // ── Optimistic bookmark toggle ────────────────────────────────────────
  const bookmarkMutation = useMutation({
    mutationFn: ({ questionId }) => apiToggleBookmark(questionId),
    onMutate: async ({ questionId }) => {
      await qc.cancelQueries({ queryKey });
      const prev = qc.getQueryData(queryKey);
      qc.setQueryData(queryKey, old => ({
        ...old,
        problems: old?.problems?.map(p =>
          p.id === questionId ? { ...p, bookmarked: !p.bookmarked } : p
        ) ?? [],
      }));
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) qc.setQueryData(queryKey, ctx.prev);
    },
  });

  const updateStatus   = useCallback((questionId, status) =>
    statusMutation.mutate({ questionId, status }), [statusMutation]);

  const toggleBookmark = useCallback((questionId) =>
    bookmarkMutation.mutate({ questionId }), [bookmarkMutation]);

  return {
    problems:     data?.problems   ?? [],
    pagination:   data?.pagination ?? {},
    topicName:    data?.topicName  ?? topic,
    stats:        data?.stats      ?? null,
    loading:      isPending,
    isFetching,
    error:        isError ? (error?.message ?? 'Failed to load topic') : null,
    updateStatus,
    toggleBookmark,
  };
}
