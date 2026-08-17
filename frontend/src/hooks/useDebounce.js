import { useState, useEffect } from 'react';

/**
 * Debounces a value — returns the value only after `delay` ms of no changes.
 * Centralizes debounce logic so it doesn't need to live inside each component.
 *
 * @param {*} value - The value to debounce.
 * @param {number} delay - Debounce delay in milliseconds.
 * @returns {*} The debounced value.
 */
export function useDebounce(value, delay = 300) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}
