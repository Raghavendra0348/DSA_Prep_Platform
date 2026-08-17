/**
 * Centralized query key factory.
 * Using arrays ensures fine-grained cache invalidation.
 * Shared between all useQuery calls and mutation invalidations.
 */
export const QUERY_KEYS = {
  // ── Dashboard ────────────────────────────────────────────────────────────
  dashboard: () => ['dashboard'],

  // ── Companies ────────────────────────────────────────────────────────────
  companies: () => ['companies'],

  // ── Company ──────────────────────────────────────────────────────────────
  company: {
    stats:    (slug)   => ['company', slug, 'stats'],
    problems: (slug, params) => ['company', slug, 'problems', params],
  },

  // ── Topics ───────────────────────────────────────────────────────────────
  topics:      ()     => ['topics'],
  topicDetail: (slug) => ['topic', slug],

  // ── Search ───────────────────────────────────────────────────────────────
  search: (query, type, difficulty) => ['search', query, type, difficulty],

  // ── Question ─────────────────────────────────────────────────────────────
  question: (slug) => ['question', slug],

  // ── Bookmarks ────────────────────────────────────────────────────────────
  bookmarks: (params) => ['bookmarks', params],

  // ── Progress ─────────────────────────────────────────────────────────────
  progress: () => ['progress'],
};
