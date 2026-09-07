import { useEffect, useRef } from 'react';

/**
 * Fires `handler` when a click/touch occurs outside the monitored element(s).
 *
 * Supports:
 * - Single ref: `useClickOutside(menuRef, () => setOpen(false))`
 * - Array of refs: `useClickOutside([menuRef, buttonRef], () => setOpen(false))`
 * - Conditional activation: `useClickOutside(menuRef, handler, isOpen)`
 *
 * @param {React.RefObject | React.RefObject[]} refs - Single ref or array of refs to treat as "inside".
 * @param {Function} handler - Callback to fire on outside click.
 * @param {boolean} [enabled=true] - Only attach global listeners when true (e.g. while menu is open).
 */
export function useClickOutside(refs, handler, enabled = true) {
  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  const refsRef = useRef(refs);
  refsRef.current = refs;

  useEffect(() => {
    if (!enabled) return;

    function listener(event) {
      const currentRefs = refsRef.current;
      const refList = Array.isArray(currentRefs) ? currentRefs : [currentRefs];

      // If click/touch was inside ANY of the provided refs, ignore
      const clickedInside = refList.some(r => r?.current && r.current.contains(event.target));
      if (!clickedInside) {
        handlerRef.current?.(event);
      }
    }

    document.addEventListener('mousedown', listener);
    document.addEventListener('touchstart', listener);

    return () => {
      document.removeEventListener('mousedown', listener);
      document.removeEventListener('touchstart', listener);
    };
  }, [enabled]);
}
