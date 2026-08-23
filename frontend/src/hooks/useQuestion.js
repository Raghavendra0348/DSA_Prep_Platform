import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useQuestionMutations } from './useQuestionMutations';
import { getQuestion } from '../api/questions';
import { QUERY_KEYS } from '../lib/queryKeys';

/**
 * Question detail hook — TanStack Query powered.
 *
 * - Question data cached by slug
 * - Status, bookmark, and note mutations delegated to useQuestionMutations
 * - Notes textarea state is kept local (user sees their own input instantly)
 */
export function useQuestion(slug) {
  const [notesSaving, setNotesSaving] = useState(false);
  const [notesSaved,  setNotesSaved]  = useState(false);
  const [notes,       setNotes]       = useState('');
  const [notesInit,   setNotesInit]   = useState(false);

  const { data, isPending, isError, error } = useQuery({
    queryKey: QUERY_KEYS.question(slug),
    queryFn:  async () => {
      const res = await getQuestion(slug);
      return res.question ?? res;
    },
    staleTime: 1000 * 60 * 5,
  });

  // Seed notes from server once on first load (useEffect — not during render)
  useEffect(() => {
    if (data) {
      setNotes(data.userNote ?? data.notes ?? '');
      setNotesInit(true);
    }
  // Only re-seed if the question itself changes (navigate to a different slug)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data?.id]);

  const { mutateStatus, mutateBookmark, mutateNote, statusPending, bookmarkPending } =
    useQuestionMutations(slug);

  const handleNotesSave = async () => {
    if (!data) return;
    setNotesSaving(true);
    try {
      mutateNote(data.id, notes);
      setNotesSaved(true);
      setTimeout(() => setNotesSaved(false), 2000);
    } finally {
      setNotesSaving(false);
    }
  };

  return {
    question:      data ?? null,
    loading:       isPending,
    error:         isError ? (error?.message ?? 'Failed to load question') : null,
    notes,         setNotes,
    notesSaving,
    notesSaved,
    handleNotesSave,
    handleStatusChange: (newStatus) => {
      if (data) mutateStatus(data.id, newStatus);
    },
    handleBookmark: () => {
      if (data) mutateBookmark(data.id);
    },
    statusPending,
    bookmarkPending,
  };
}
