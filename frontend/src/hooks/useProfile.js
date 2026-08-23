import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getMe, updateProfile, changePassword } from '../api/user';
import { useAuth } from './useAuth';

const PROFILE_KEY = ['profile', 'me'];

/**
 * Profile hook — TanStack Query powered.
 *
 * - Profile data cached under ['profile', 'me']
 * - updateProfile mutation syncs the auth context (navbar name updates instantly)
 * - changePassword mutation clears no cache — it's a pure write
 * - Both mutations expose isPending + error for form feedback
 */
export function useProfile() {
  const qc = useQueryClient();
  const { updateUser } = useAuth();

  // ── Fetch current user profile ────────────────────────────────────────
  const { data, isPending, isError, error } = useQuery({
    queryKey: PROFILE_KEY,
    queryFn: async () => {
      const res = await getMe();
      return res.user ?? res;
    },
    staleTime: 1000 * 60 * 5, // 5 min
  });

  // ── Update name / avatar mutation ────────────────────────────────────
  const updateMutation = useMutation({
    mutationFn: (payload) => updateProfile(payload),
    onSuccess: (res) => {
      const updated = res.user ?? res;
      // Optimistically update the cache
      qc.setQueryData(PROFILE_KEY, updated);
      // Sync the navbar / auth context so the name updates everywhere
      updateUser(updated);
    },
  });

  // ── Change password mutation ──────────────────────────────────────────
  const passwordMutation = useMutation({
    mutationFn: ({ currentPassword, newPassword }) =>
      changePassword({ currentPassword, newPassword }),
  });

  return {
    profile:         data ?? null,
    loading:         isPending,
    error:           isError ? (error?.message ?? 'Failed to load profile') : null,

    // Update profile
    updateProfile:      (payload) => updateMutation.mutateAsync(payload),
    updatePending:      updateMutation.isPending,
    updateError:        updateMutation.error?.message ?? '',

    // Change password
    changePassword:     (payload) => passwordMutation.mutateAsync(payload),
    passwordPending:    passwordMutation.isPending,
    passwordError:      passwordMutation.error?.message ?? '',
    passwordSuccess:    passwordMutation.isSuccess,
  };
}
