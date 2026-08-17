import { useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getCompanyProblems, getCompanyStats } from '../api/company';
import { upsertProgress } from '../api/progress';
import { toggleBookmark as apiToggleBookmark } from '../api/bookmarks';
import { QUERY_KEYS } from '../lib/queryKeys';

/**
 * Company detail hook — now powered by TanStack Query.
 *
 * Advantages over the old manual pattern:
 * - Stats and problems are cached independently; navigating back is instant
 * - Optimistic UI for status + bookmark mutations, auto-rollback on error
 * - Cache invalidation after mutation syncs sidebar stats without extra fetch
 */
export function useCompany(slug, params = {}) {
  const qc = useQueryClient();

  // ── Read filter parameters directly from input props (URL SearchParams) ──
  const period     = params.period     || 'all';
  const difficulty = params.difficulty || '';
  const sortBy     = params.sortBy     || 'frequency';
  const page       = params.page       || 1;

  // ── Queries ───────────────────────────────────────────────────────────────
  const statsQuery = useQuery({
    queryKey: QUERY_KEYS.company.stats(slug),
    queryFn:  async () => {
      const res = await getCompanyStats(slug);
      return { company: res.company, stats: res.stats ?? {} };
    },
    staleTime: 1000 * 60 * 5,
  });

  const problemParams = { period, difficulty: difficulty || undefined, sortBy, page, limit: 50 };

  const problemsQuery = useQuery({
    queryKey: QUERY_KEYS.company.problems(slug, problemParams),
    queryFn:  async () => {
      const res = await getCompanyProblems(slug, problemParams);
      return {
        problems:   res.questions ?? res.problems ?? [],
        pagination: res.pagination ?? {},
        company:    res.company,
      };
    },
    staleTime: 1000 * 60 * 10, // 10 minutes cache — switching filters is instant (0ms)
    gcTime: 1000 * 60 * 30,
  });

  // ── Optimistic status update ──────────────────────────────────────────────
  const statusMutation = useMutation({
    mutationFn: ({ questionId, status }) => upsertProgress({ questionId, status }),
    onMutate: async ({ questionId, status }) => {
      const key = QUERY_KEYS.company.problems(slug, problemParams);
      await qc.cancelQueries({ queryKey: key });
      const prev = qc.getQueryData(key);
      qc.setQueryData(key, old => ({
        ...old,
        problems: old?.problems?.map(p =>
          p.id === questionId ? { ...p, status } : p
        ) ?? [],
      }));
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) qc.setQueryData(QUERY_KEYS.company.problems(slug, problemParams), ctx.prev);
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.dashboard() });
    },
  });

  // ── Optimistic bookmark toggle ────────────────────────────────────────────
  const bookmarkMutation = useMutation({
    mutationFn: ({ questionId }) => apiToggleBookmark(questionId),
    onMutate: async ({ questionId }) => {
      const key = QUERY_KEYS.company.problems(slug, problemParams);
      await qc.cancelQueries({ queryKey: key });
      const prev = qc.getQueryData(key);
      qc.setQueryData(key, old => ({
        ...old,
        problems: old?.problems?.map(p =>
          p.id === questionId ? { ...p, bookmarked: !p.bookmarked } : p
        ) ?? [],
      }));
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) qc.setQueryData(QUERY_KEYS.company.problems(slug, problemParams), ctx.prev);
    },
  });

  const updateStatus  = useCallback((questionId, status) =>
    statusMutation.mutate({ questionId, status }), [statusMutation]);

  const toggleBookmark = useCallback((questionId) =>
    bookmarkMutation.mutate({ questionId }), [bookmarkMutation]);

  return {
    companyInfo:  statsQuery.data?.company ?? problemsQuery.data?.company ?? null,
    stats:        statsQuery.data?.stats   ?? {},
    problems:     problemsQuery.data?.problems   ?? [],
    pagination:   problemsQuery.data?.pagination ?? {},
    loading:      problemsQuery.isPending || problemsQuery.isFetching,
    isFetching:   problemsQuery.isFetching,
    statsLoading: statsQuery.isPending,
    error:        problemsQuery.isError ? (problemsQuery.error?.message ?? 'Failed') : null,
    period,
    difficulty,
    sortBy,
    page,
    updateStatus,
    toggleBookmark,
  };
}
