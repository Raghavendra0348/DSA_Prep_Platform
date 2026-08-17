import { useState, useEffect } from 'react';

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
  const [matches, setMatches] = useState(
    () => typeof window !== 'undefined' && window.matchMedia(query).matches
  );

  useEffect(() => {
    const mql = window.matchMedia(query);
    setMatches(mql.matches);

    const listener = (e) => setMatches(e.matches);
    mql.addEventListener('change', listener);
    return () => mql.removeEventListener('change', listener);
  }, [query]);

  return matches;
}

// ── Predefined breakpoints for convenience ────────────────────────────────────
export const breakpoints = {
  mobile:  '(max-width: 640px)',
  tablet:  '(max-width: 1024px)',
  desktop: '(min-width: 1025px)',
  touch:   '(hover: none) and (pointer: coarse)',
};
