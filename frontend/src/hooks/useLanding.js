import { useQuery } from '@tanstack/react-query';
import { getStats } from '../api/stats';
import { getFeaturedCompanies, getCompanySlugs } from '../api/companies';

const FEATURED_SLUGS = [
  'google', 'meta', 'amazon', 'apple', 'microsoft', 'netflix',
  'flipkart', 'paytm', 'swiggy', 'zomato', 'tcs', 'accenture',
];

/**
 * Landing page data hook — TanStack Query powered.
 *
 * Strategy matches the original manual loading approach:
 * - Stats + featured companies: parallel, shown immediately
 * - Company slugs: separate, lower-priority query for search matching
 *
 * All three results are cached so navigate-back is instant.
 * staleTime: 10 min (landing data doesn't change often)
 */
export function useLanding() {
  // ── Stats ────────────────────────────────────────────────────────────
  const statsQuery = useQuery({
    queryKey: ['landing', 'stats'],
    queryFn: async () => {
      const res = await getStats();
      return res.stats ?? res;
    },
    staleTime: 1000 * 60 * 10,
    gcTime:    1000 * 60 * 30,
  });

  // ── Featured companies (12 hardcoded slugs) ──────────────────────────
  const featuredQuery = useQuery({
    queryKey: ['landing', 'featured'],
    queryFn: async () => {
      const res = await getFeaturedCompanies(FEATURED_SLUGS);
      return res.companies ?? [];
    },
    staleTime: 1000 * 60 * 10,
    gcTime:    1000 * 60 * 30,
  });

  // ── All company slugs (for search matching) ──────────────────────────
  // Runs independently — doesn't block the above from rendering.
  const slugsQuery = useQuery({
    queryKey: ['landing', 'slugs'],
    queryFn: async () => {
      const res = await getCompanySlugs();
      return res.companies ?? [];
    },
    staleTime: 1000 * 60 * 10,
    gcTime:    1000 * 60 * 30,
  });

  // Loading = only block on stats + featured (primary content)
  const loading = statsQuery.isPending || featuredQuery.isPending;

  return {
    stats:       statsQuery.data ?? null,
    featured:    featuredQuery.data ?? [],
    allCompanies: slugsQuery.data ?? [],   // may be empty while loading
    loading,
    error: statsQuery.isError
      ? (statsQuery.error?.message ?? 'Failed to load data')
      : null,
  };
}
