export interface CalculationHistory {
  id: string;
  type: 'mortgage' | 'financial-checkup' | 'deal' | 'renovation' | 'property-visit' | 'transaction-timeline' | 'urban-renewal';
  title: string;
  result: string;
  timestamp: Date;
  input?: any;
}

export function saveCalculation(history: Omit<CalculationHistory, 'id' | 'timestamp'>) {
  const stored = getCalculationHistory();
  const newItem: CalculationHistory = {
    ...history,
    id: crypto.randomUUID(),
    timestamp: new Date(),
  };
  stored.unshift(newItem);
  
  // Keep only last 20
  const trimmed = stored.slice(0, 20);
  localStorage.setItem('calculator-history', JSON.stringify(trimmed));
  
  return newItem;
}

export function getCalculationHistory(): CalculationHistory[] {
  try {
    const stored = localStorage.getItem('calculator-history');
    if (!stored) return [];
    
    const parsed = JSON.parse(stored);
    // Convert timestamp strings back to Date objects
    return parsed.map((item: any) => ({
      ...item,
      timestamp: new Date(item.timestamp),
    }));
  } catch {
    return [];
  }
}

export function deleteCalculation(id: string) {
  const stored = getCalculationHistory();
  const filtered = stored.filter(item => item.id !== id);
  localStorage.setItem('calculator-history', JSON.stringify(filtered));
}

export function clearHistory() {
  localStorage.removeItem('calculator-history');
}
