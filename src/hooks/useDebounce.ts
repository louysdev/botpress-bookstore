import { useState, useEffect } from 'react';

/**
 * Generic debounce hook.
 * Returns the debounced value that updates only after the delay has elapsed
 * since the last change to `value`.
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}
