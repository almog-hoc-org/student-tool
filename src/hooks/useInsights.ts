import { useState, useCallback } from 'react';
import { generateInsights, hasAnyData, type Insight } from '@/lib/insights-engine';

export type { Insight } from '@/lib/insights-engine';

export function useInsights() {
  const [insights, setInsights] = useState<Insight[]>([]);
  const [loading, setLoading] = useState(false);

  const analyze = useCallback(() => {
    setInsights(generateInsights());
    setLoading(false);
  }, []);

  return {
    insights,
    loading,
    analyze,
    hasData: hasAnyData(),
  };
}
