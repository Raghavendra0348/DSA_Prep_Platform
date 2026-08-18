import { useSyncExternalStore, useCallback } from 'react';

/**
 * Returns true if the viewport currently matches the given media query.
 * Updates automatically on resize.
 *
 * @param {string} query - CSS media query string, e.g. '(max-width: 768px)'
 * @returns {boolean}
 *
 * @example
 * const isMobile = useMediaQuery('(max-width: 768px)');
 */
export function useMediaQuery(query) {
  const subscribe = useCallback((callback) => {
    if (typeof window === 'undefined') return () => {};
    const mql = window.matchMedia(query);
    mql.addEventListener('change', callback);
    return () => mql.removeEventListener('change', callback);
  }, [query]);

  const getSnapshot = useCallback(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia(query).matches;
  }, [query]);

  const getServerSnapshot = () => false;

  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

// ── Predefined breakpoints for convenience ────────────────────────────────────
export const breakpoints = {
  mobile:  '(max-width: 640px)',
  tablet:  '(max-width: 1024px)',
  desktop: '(min-width: 1025px)',
  touch:   '(hover: none) and (pointer: coarse)',
};
