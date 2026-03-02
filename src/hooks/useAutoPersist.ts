import { useState, useEffect, useCallback, useRef } from 'react';

const DEBOUNCE_MS = 500;

function getStorageKey(key: string): string {
  return `calc-inputs:${key}`;
}

/**
 * Hook that auto-persists state to localStorage with debouncing.
 * On mount, loads saved state. On change, saves after 500ms debounce.
 */
export function useAutoPersist<T>(
  key: string,
  initialState: T
): [T, (updater: T | ((prev: T) => T)) => void, () => void] {
  const storageKey = getStorageKey(key);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [state, setStateInternal] = useState<T>(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored !== null) {
        return JSON.parse(stored) as T;
      }
    } catch {
      // JSON parse error — fall through to initialState
    }
    return initialState;
  });

  // Keep a ref to the latest state so the debounced save always writes the
  // most recent value, even if multiple setState calls happen within the
  // debounce window.
  const stateRef = useRef<T>(state);

  const scheduleSave = useCallback(
    (value: T) => {
      stateRef.current = value;

      if (timerRef.current !== null) {
        clearTimeout(timerRef.current);
      }

      timerRef.current = setTimeout(() => {
        try {
          localStorage.setItem(storageKey, JSON.stringify(stateRef.current));
        } catch {
          // Storage full or unavailable — silently ignore
        }
        timerRef.current = null;
      }, DEBOUNCE_MS);
    },
    [storageKey]
  );

  const setState = useCallback(
    (updater: T | ((prev: T) => T)) => {
      setStateInternal((prev) => {
        const next =
          typeof updater === 'function'
            ? (updater as (prev: T) => T)(prev)
            : updater;
        scheduleSave(next);
        return next;
      });
    },
    [scheduleSave]
  );

  const resetState = useCallback(() => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    try {
      localStorage.removeItem(storageKey);
    } catch {
      // Storage unavailable — silently ignore
    }
    stateRef.current = initialState;
    setStateInternal(initialState);
  }, [storageKey, initialState]);

  // Clean up the debounce timer on unmount and flush pending save
  useEffect(() => {
    return () => {
      if (timerRef.current !== null) {
        clearTimeout(timerRef.current);
        try {
          localStorage.setItem(storageKey, JSON.stringify(stateRef.current));
        } catch {
          // Storage unavailable — silently ignore
        }
      }
    };
  }, [storageKey]);

  return [state, setState, resetState];
}
