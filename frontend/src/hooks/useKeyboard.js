import { useEffect } from 'react';

/**
 * Registers a global keyboard shortcut.
 * Fires `handler` when the specified key combo is pressed.
 *
 * @param {string} key - Key to listen for (e.g. 'k', 'Escape', '?').
 * @param {Function} handler - Callback. Receives the KeyboardEvent.
 * @param {{ ctrl?: boolean, meta?: boolean, shift?: boolean, alt?: boolean }} modifiers
 */
export function useKeyboard(key, handler, modifiers = {}) {
  useEffect(() => {
    if (!handler) return;

    function onKeyDown(e) {
      const { ctrl = false, meta = false, shift = false, alt = false } = modifiers;

      if (ctrl && !e.ctrlKey) return;
      if (meta && !e.metaKey) return;
      if (shift && !e.shiftKey) return;
      if (alt && !e.altKey) return;

      // Support both ctrl and meta (Cmd on Mac) with ctrlOrMeta
      if (modifiers.ctrlOrMeta && !(e.ctrlKey || e.metaKey)) return;

      if (e.key === key) {
        handler(e);
      }
    }

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [key, handler, modifiers]);
}
