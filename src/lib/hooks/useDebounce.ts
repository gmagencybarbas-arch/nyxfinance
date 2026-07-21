"use client";

import { useState, useEffect, useCallback } from "react";

/**
 * Debounces a value. Useful for search inputs, filters, or any input that
 * triggers heavy computations or API calls.
 */
export function useDebounce<T>(value: T, delayMs: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);

  return debouncedValue;
}

/**
 * Returns a debounced callback. The callback will run only after the
 * specified delay has passed since the last invocation.
 */
export function useDebouncedCallback<T extends (...args: unknown[]) => void>(
  callback: T,
  delayMs: number
): T {
  const timeoutRef = { current: null as ReturnType<typeof setTimeout> | null };
  const callbackRef = useCallback(callback, [callback]);

  const debounced = useCallback(
    ((...args: Parameters<T>) => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        timeoutRef.current = null;
        callbackRef(...args);
      }, delayMs);
    }) as T,
    [delayMs, callbackRef]
  );

  useEffect(() => () => { if (timeoutRef.current) clearTimeout(timeoutRef.current); }, []);

  return debounced;
}
