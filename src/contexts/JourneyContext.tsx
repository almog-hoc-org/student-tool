import { createContext, useContext, useCallback, useEffect, useState, ReactNode } from 'react';

type CalculatorType = 'financial-checkup' | 'mortgage' | 'deal-business-plan' | 'property-visit' | 'renovation';

type JourneyData = {
  [key in CalculatorType]?: {
    timestamp: number;
    data: Record<string, any>;
  };
};

interface JourneyContextType {
  journeyData: JourneyData;
  saveJourneyData: (type: CalculatorType, data: Record<string, any>) => void;
  getJourneyData: (type: CalculatorType) => Record<string, any> | null;
  clearJourneyData: () => void;
  dismissedSuggestions: string[];
  dismissSuggestion: (id: string) => void;
}

const STORAGE_KEY = 'journey-data';
const DISMISSED_KEY = 'journey-dismissed-suggestions';

function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : fallback;
  } catch {
    return fallback;
  }
}

const JourneyContext = createContext<JourneyContextType>({
  journeyData: {},
  saveJourneyData: () => {},
  getJourneyData: () => null,
  clearJourneyData: () => {},
  dismissedSuggestions: [],
  dismissSuggestion: () => {},
});

export function JourneyProvider({ children }: { children: ReactNode }) {
  const [journeyData, setJourneyData] = useState<JourneyData>(() =>
    loadFromStorage<JourneyData>(STORAGE_KEY, {})
  );
  const [dismissedSuggestions, setDismissedSuggestions] = useState<string[]>(() =>
    loadFromStorage<string[]>(DISMISSED_KEY, [])
  );

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(journeyData));
    } catch {
      // Storage full or unavailable — silently ignore
    }
  }, [journeyData]);

  useEffect(() => {
    try {
      localStorage.setItem(DISMISSED_KEY, JSON.stringify(dismissedSuggestions));
    } catch {
      // Storage full or unavailable — silently ignore
    }
  }, [dismissedSuggestions]);

  const saveJourneyData = useCallback((type: CalculatorType, data: Record<string, any>) => {
    setJourneyData((prev) => ({
      ...prev,
      [type]: {
        timestamp: Date.now(),
        data,
      },
    }));
  }, []);

  const getJourneyData = useCallback(
    (type: CalculatorType): Record<string, any> | null => {
      return journeyData[type]?.data ?? null;
    },
    [journeyData]
  );

  const clearJourneyData = useCallback(() => {
    setJourneyData({});
  }, []);

  const dismissSuggestion = useCallback((id: string) => {
    setDismissedSuggestions((prev) =>
      prev.includes(id) ? prev : [...prev, id]
    );
  }, []);

  return (
    <JourneyContext.Provider
      value={{
        journeyData,
        saveJourneyData,
        getJourneyData,
        clearJourneyData,
        dismissedSuggestions,
        dismissSuggestion,
      }}
    >
      {children}
    </JourneyContext.Provider>
  );
}

export function useJourney() {
  const context = useContext(JourneyContext);
  if (!context) {
    throw new Error('useJourney must be used within a JourneyProvider');
  }
  return context;
}

export type { CalculatorType, JourneyData, JourneyContextType };
