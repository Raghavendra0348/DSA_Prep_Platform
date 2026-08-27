import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getBookmarks, toggleBookmark as apiToggleBookmark } from '../api/bookmarks';
import { QUERY_KEYS } from '../lib/queryKeys';

/**
 * Bookmarks hook — TanStack Query powered.
 *
 * - Paginated fetch, cached per page
 * - Remove bookmark is optimistic (instant removal from list, refetch on error)
 * - After unbookmark, invalidates to stay in sync with question detail page
 */
export function useBookmarks(page = 1) {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [sort,   setSort]   = useState('default');

  const queryKey = QUERY_KEYS.bookmarks({ page, limit: 30 });

  const { data, isPending, isError, error } = useQuery({
    queryKey,
    queryFn: async () => {
      const res = await getBookmarks({ page, limit: 30 });
      return {
        bookmarks:  res.bookmarks  ?? [],
        pagination: res.pagination ?? {},
      };
    },
    staleTime: 1000 * 60 * 2, // 2 min — bookmarks change on toggle
  });

  // ── Optimistic unbookmark ─────────────────────────────────────────────
  const removeMutation = useMutation({
    mutationFn: (questionId) => apiToggleBookmark(questionId),
    onMutate: async (questionId) => {
      const dashKey = QUERY_KEYS.dashboard();
      await Promise.all([
        qc.cancelQueries({ queryKey }),
        qc.cancelQueries({ queryKey: dashKey }),
      ]);

      const prev = qc.getQueryData(queryKey);
      const prevDash = qc.getQueryData(dashKey);

      qc.setQueryData(queryKey, old => ({
        ...old,
        bookmarks: old?.bookmarks?.filter(bm => {
          const id = bm.questionId ?? bm.question?.id ?? bm.id;
          return id !== questionId;
        }) ?? [],
      }));

      if (prevDash?.stats) {
        qc.setQueryData(dashKey, old => {
          if (!old?.stats) return old;
          return {
            ...old,
            stats: {
              ...old.stats,
              totalBookmarks: Math.max(0, (old.stats.totalBookmarks ?? 1) - 1),
            },
          };
        });
      }

      return { prev, prevDash };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) qc.setQueryData(queryKey, ctx.prev);
      if (ctx?.prevDash) qc.setQueryData(QUERY_KEYS.dashboard(), ctx.prevDash);
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.bookmarks({}) });
      qc.invalidateQueries({ queryKey: QUERY_KEYS.dashboard() });
    },
  });


  const rawBookmarks = data?.bookmarks ?? [];

  // Derived stats
  const stats = useMemo(() => {
    const all = rawBookmarks.map(bm => bm.question || bm);
    const d = (v) => (v || '').toLowerCase();
    return {
      total:  all.length,
      easy:   all.filter(q => d(q.difficulty) === 'easy').length,
      medium: all.filter(q => d(q.difficulty) === 'medium').length,
      hard:   all.filter(q => d(q.difficulty) === 'hard').length,
    };
  }, [rawBookmarks]);

  // Filtered + sorted list
  const filtered = useMemo(() => {
    let list = rawBookmarks.map((bm, i) => ({ bm, q: bm.question || bm, origIndex: i }));
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(({ q: question }) => question.title?.toLowerCase().includes(q));
    }
    if (sort === 'az')   list.sort((a, b) => (a.q.title || '').localeCompare(b.q.title || ''));
    if (sort === 'za')   list.sort((a, b) => (b.q.title || '').localeCompare(a.q.title || ''));
    if (sort === 'diff') {
      const d = (v) => (v || '').toLowerCase();
      const order = { easy: 0, medium: 1, hard: 2 };
      list.sort((a, b) => (order[d(a.q.difficulty)] ?? 3) - (order[d(b.q.difficulty)] ?? 3));
    }
    return list;
  }, [rawBookmarks, search, sort]);

  return {
    bookmarks:     rawBookmarks,
    filtered,
    pagination:    data?.pagination ?? {},
    stats,
    loading:       isPending,
    error:         isError ? (error?.message ?? 'Failed to load bookmarks') : null,
    search,        setSearch,
    sort,          setSort,
    removeBookmark: (questionId) => removeMutation.mutate(questionId),
  };
}
