import { useCallback } from 'react';

/**
 * Helper to create a nested state updater.
 * Usage: const update = useNestedUpdate(setInput);
 *        update('income', 'salary1Net', 15000);
 */
export function createNestedUpdater<T extends Record<string, any>>(
  setter: (fn: (prev: T) => T) => void
) {
  return <K extends keyof T>(
    section: K,
    field: keyof T[K],
    value: T[K][keyof T[K]]
  ) => {
    setter((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value,
      },
    }));
  };
}
