import { useEffect } from 'react';

/**
 * Fires `handler` when a click/touch occurs outside `ref` element.
 * @param {React.RefObject} ref - The ref of the element to monitor.
 * @param {Function} handler - Callback to fire on outside click.
 */
export function useClickOutside(ref, handler) {
  useEffect(() => {
    if (!handler) return;

    function listener(event) {
      if (!ref.current || ref.current.contains(event.target)) return;
      handler(event);
    }

    document.addEventListener('mousedown', listener);
    document.addEventListener('touchstart', listener);

    return () => {
      document.removeEventListener('mousedown', listener);
      document.removeEventListener('touchstart', listener);
    };
  }, [ref, handler]);
}
