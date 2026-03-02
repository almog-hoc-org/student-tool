import React, { useState, useEffect, useContext, createContext, useCallback } from 'react';

export interface SavedScenario {
  id: string;
  name: string;
  type: 'deal' | 'mortgage' | 'financial-checkup';
  inputs: Record<string, any>;
  results: Record<string, any>;
  notes: string;
  createdAt: number;
}

interface DashboardContextType {
  activeCalculator: string;
  setActiveCalculator: (calc: string) => void;
  savedScenarios: SavedScenario[];
  saveScenario: (scenario: Omit<SavedScenario, 'id' | 'createdAt'>) => void;
  deleteScenario: (id: string) => void;
  getScenariosByType: (type: SavedScenario['type']) => SavedScenario[];
}

const STORAGE_KEY = 'dashboard-state';
const MAX_SCENARIOS = 20;

interface PersistedState {
  activeCalculator: string;
  savedScenarios: SavedScenario[];
}

function loadPersistedState(): PersistedState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as PersistedState;
      return {
        activeCalculator: parsed.activeCalculator || 'financial-checkup',
        savedScenarios: Array.isArray(parsed.savedScenarios) ? parsed.savedScenarios : [],
      };
    }
  } catch {
    // Ignore corrupted data
  }
  return {
    activeCalculator: 'financial-checkup',
    savedScenarios: [],
  };
}

function generateId(): string {
  return Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 9);
}

const DashboardContext = createContext<DashboardContextType>({
  activeCalculator: 'financial-checkup',
  setActiveCalculator: () => {},
  savedScenarios: [],
  saveScenario: () => {},
  deleteScenario: () => {},
  getScenariosByType: () => [],
});

export function DashboardProvider({ children }: { children: React.ReactNode }) {
  const [activeCalculator, setActiveCalculatorState] = useState<string>(
    () => loadPersistedState().activeCalculator
  );
  const [savedScenarios, setSavedScenarios] = useState<SavedScenario[]>(
    () => loadPersistedState().savedScenarios
  );

  // Persist to localStorage whenever state changes
  useEffect(() => {
    const state: PersistedState = {
      activeCalculator,
      savedScenarios,
    };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Storage full or unavailable — fail silently
    }
  }, [activeCalculator, savedScenarios]);

  const setActiveCalculator = useCallback((calc: string) => {
    setActiveCalculatorState(calc);
  }, []);

  const saveScenario = useCallback(
    (scenario: Omit<SavedScenario, 'id' | 'createdAt'>) => {
      setSavedScenarios((prev) => {
        const newScenario: SavedScenario = {
          ...scenario,
          id: generateId(),
          createdAt: Date.now(),
        };
        const updated = [newScenario, ...prev];
        // Enforce maximum of 20 scenarios — drop the oldest
        if (updated.length > MAX_SCENARIOS) {
          return updated.slice(0, MAX_SCENARIOS);
        }
        return updated;
      });
    },
    []
  );

  const deleteScenario = useCallback((id: string) => {
    setSavedScenarios((prev) => prev.filter((s) => s.id !== id));
  }, []);

  const getScenariosByType = useCallback(
    (type: SavedScenario['type']): SavedScenario[] => {
      return savedScenarios.filter((s) => s.type === type);
    },
    [savedScenarios]
  );

  return (
    <DashboardContext.Provider
      value={{
        activeCalculator,
        setActiveCalculator,
        savedScenarios,
        saveScenario,
        deleteScenario,
        getScenariosByType,
      }}
    >
      {children}
    </DashboardContext.Provider>
  );
}

export const useDashboard = () => useContext(DashboardContext);

export default DashboardContext;
