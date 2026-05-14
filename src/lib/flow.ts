import { load } from './storage';
import type { BudgetSaved, BudgetResultsSaved, MortgageSaved, MortgageResultsSaved } from '@/types/saved-state';

export interface BudgetResults {
  maxPropertyValue: number;
  maxMortgage: number;
  monthlyPayment: number;
  equity: number;
  purchaseTax: number;
  sideCosts: number;
  monthlyIncome: number;
}

export interface MortgageResults {
  totalMonthlyPayment: number;
  weightedRate: number;
  totalPrincipal: number;
  monthlyIncome: number;
}

export function getBudgetResults(): BudgetResults | null {
  const inputs = load<BudgetSaved>('budget');
  const results = load<BudgetResultsSaved>('budget_results');
  if (!inputs || !results) return null;
  return {
    maxPropertyValue: results.maxPropertyValue,
    maxMortgage: results.maxMortgage,
    monthlyPayment: results.monthlyPayment,
    equity: inputs.equity,
    purchaseTax: results.purchaseTax,
    sideCosts: results.sideCosts,
    monthlyIncome: inputs.monthlyIncome,
  };
}

export function getMortgageResults(): MortgageResults | null {
  const inputs = load<MortgageSaved>('mortgage');
  const results = load<MortgageResultsSaved>('mortgage_results');
  if (!inputs || !results) return null;
  return {
    totalMonthlyPayment: results.totalMonthlyPayment,
    weightedRate: results.weightedAverageInterest,
    totalPrincipal: inputs.tracks?.reduce((s, t) => s + (t.principal || 0), 0) || 0,
    monthlyIncome: inputs.monthlyIncome,
  };
}
