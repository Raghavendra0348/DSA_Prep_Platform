import { QueryClient } from '@tanstack/react-query';

/**
 * Shared QueryClient singleton.
 * Configured with sensible defaults for a DSA prep platform:
 *  - staleTime: 3 min  — lists don't need aggressive refetching
 *  - gcTime:    10 min — keep cache longer to avoid re-fetching on navigate-back
 *  - retry: 1          — one retry on error (avoids hammering a down server)
 *  - refetchOnWindowFocus: false — avoid surprise refetches during typing
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime:           1000 * 60 * 3,   // 3 minutes
      gcTime:              1000 * 60 * 10,  // 10 minutes
      retry:               1,
      refetchOnWindowFocus: false,
      refetchOnReconnect:   true,
    },
    mutations: {
      retry: 0,
    },
  },
});
