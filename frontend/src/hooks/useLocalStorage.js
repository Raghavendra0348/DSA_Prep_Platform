import { useState, useCallback } from 'react';

/**
 * Synced localStorage state. Works like useState but persists to localStorage.
 *
 * @param {string} key - The localStorage key.
 * @param {*} defaultValue - Initial value if nothing is stored.
 * @returns {[*, Function]} [storedValue, setValue]
 */
export function useLocalStorage(key, defaultValue) {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = localStorage.getItem(key);
      return item !== null ? JSON.parse(item) : defaultValue;
    } catch {
      return defaultValue;
    }
  });

  const setValue = useCallback((value) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      if (valueToStore === undefined) {
        localStorage.removeItem(key);
      } else {
        localStorage.setItem(key, JSON.stringify(valueToStore));
      }
    } catch (err) {
      console.warn(`useLocalStorage: failed to write key "${key}"`, err);
    }
  }, [key, storedValue]);

  return [storedValue, setValue];
}
