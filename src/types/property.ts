export interface Property {
  id: string;
  name: string;
  askingPrice: number;
  notes: string;
  createdAt: Date;
  linkedCalculations: LinkedCalculation[];
}

export interface LinkedCalculation {
  type: 'quick-check' | 'property-visit' | 'deal';
  title: string;
  result: string;
  timestamp: Date;
}
