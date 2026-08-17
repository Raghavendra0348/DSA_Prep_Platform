import { useMutation, useQueryClient } from '@tanstack/react-query';
import { upsertProgress, updateNotes } from '../api/progress';
import { toggleBookmark as apiToggleBookmark } from '../api/bookmarks';
import { QUERY_KEYS } from '../lib/queryKeys';

/**
 * Centralized question mutations with optimistic UI.
 * Import these in QuestionDetail, CompanyDetail, Bookmarks, etc.
 *
 * Usage:
 *   const { mutateStatus, mutateBookmark, mutateNote } = useQuestionMutations(slug);
 */
export function useQuestionMutations(questionSlug) {
  const qc = useQueryClient();
  const questionKey = QUERY_KEYS.question(questionSlug);

  // ── Optimistic helpers ────────────────────────────────────────────────────
  const patchQuestion = (updater) => {
    qc.setQueryData(questionKey, old => old ? { ...old, ...updater(old) } : old);
  };

  // ── Status mutation ───────────────────────────────────────────────────────
  const statusMutation = useMutation({
    mutationFn: ({ questionId, status }) => upsertProgress({ questionId, status }),
    onMutate: async ({ status }) => {
      await qc.cancelQueries({ queryKey: questionKey });
      const prev = qc.getQueryData(questionKey);
      patchQuestion(() => ({ status }));
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) qc.setQueryData(questionKey, ctx.prev);
    },
    onSettled: () => {
      // Invalidate dashboard so streak/stats update
      qc.invalidateQueries({ queryKey: QUERY_KEYS.dashboard() });
    },
  });

  // ── Bookmark mutation ─────────────────────────────────────────────────────
  const bookmarkMutation = useMutation({
    mutationFn: ({ questionId }) => apiToggleBookmark(questionId),
    onMutate: async () => {
      await qc.cancelQueries({ queryKey: questionKey });
      const prev = qc.getQueryData(questionKey);
      patchQuestion(old => ({ bookmarked: !old.bookmarked }));
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) qc.setQueryData(questionKey, ctx.prev);
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.bookmarks({}) });
    },
  });

  // ── Note mutation (no optimistic needed — user sees their own input) ──────
  const noteMutation = useMutation({
    mutationFn: ({ questionId, note }) => updateNotes(questionId, note),
    onSuccess: (_data, { note }) => {
      patchQuestion(() => ({ userNote: note }));
    },
  });

  return {
    mutateStatus:   (questionId, status) => statusMutation.mutate({ questionId, status }),
    mutateBookmark: (questionId) => bookmarkMutation.mutate({ questionId }),
    mutateNote:     (questionId, note) => noteMutation.mutate({ questionId, note }),
    statusPending:   statusMutation.isPending,
    bookmarkPending: bookmarkMutation.isPending,
    notePending:     noteMutation.isPending,
  };
}
