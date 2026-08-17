import { useQuery } from '@tanstack/react-query';
import { getDashboard } from '../api/dashboard';
import { QUERY_KEYS } from '../lib/queryKeys';

/**
 * Dashboard data via TanStack Query.
 * - Auto-cached for 3 min (global default)
 * - Refetches on reconnect (user returns from offline)
 * - Returns isRefetching so UI can show a subtle refresh indicator
 */
export function useDashboard() {
  const { data, isPending, isError, error, isRefetching, refetch } = useQuery({
    queryKey: QUERY_KEYS.dashboard(),
    queryFn:  getDashboard,
    staleTime: 1000 * 60 * 2, // dashboard refreshes every 2 min
  });

  return {
    dashboardData:  data ?? null,
    loading:        isPending,
    isRefetching,
    error:          isError ? (error?.message ?? 'Failed to load dashboard') : null,
    refresh:        refetch,
  };
}
