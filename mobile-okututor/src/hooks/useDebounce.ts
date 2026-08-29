import { useEffect, useState } from "react";

/**
 * Returns a debounced copy of `value`. Changes propagate only after the
 * value has been stable for `delayMs`.
 */
export function useDebounce<T>(value: T, delayMs = 400): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);

  return debounced;
}