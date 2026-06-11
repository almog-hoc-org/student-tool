import { load } from './storage';

export interface BudgetResults {
  maxPropertyValue: number;
  maxMortgage: number;
  maxMortgageByCashflow: number;
  monthlyPayment: number;
  equity: number;
  purchaseTax: number;
  sideCosts: number;
  monthlyIncome: number;
  currentRent: number;
  livingExpenses: number;
  freeCashFlow: number;
  maxAffordableMortgagePayment: number;
  maxPropertyByEquity: number;
  recommendedPropertyValue: number;
}

export interface MortgageResults {
  totalMonthlyPayment: number;
  weightedRate: number;
  totalPrincipal: number;
  monthlyIncome: number;
  freeCashFlow: number;
}

export function getBudgetResults(): BudgetResults | null {
  const inputs = load<Partial<BudgetResults> & { equity: number; monthlyIncome: number }>('budget');
  const results = load<BudgetResults>('budget_results');
  if (!inputs || !results) return null;
  return {
    maxPropertyValue: results.maxPropertyValue,
    maxMortgage: results.maxMortgage,
    maxMortgageByCashflow: results.maxMortgageByCashflow,
    monthlyPayment: results.monthlyPayment,
    equity: inputs.equity,
    purchaseTax: results.purchaseTax,
    sideCosts: results.sideCosts,
    monthlyIncome: inputs.monthlyIncome,
    currentRent: inputs.currentRent ?? 0,
    livingExpenses: inputs.livingExpenses ?? 0,
    freeCashFlow: results.freeCashFlow,
    maxAffordableMortgagePayment: results.maxAffordableMortgagePayment,
    maxPropertyByEquity: results.maxPropertyByEquity,
    recommendedPropertyValue: results.recommendedPropertyValue,
  };
}

export interface BusinessPlanData {
  purchasePrice: number;
  equityInvested: number;
  mortgageAmount: number;
  mortgageMonthlyPayment: number;
  mortgageInterestRate: number;
  mortgageYears: number;
  touched: boolean;
}

/**
 * The journey runs budget → business plan → mortgage; the mortgage builder
 * should prefer the actual deal numbers from the business plan over the
 * theoretical budget ceiling.
 */
export function getBusinessPlanData(): BusinessPlanData | null {
  const inputs = load<{
    purchasePrice?: number;
    equityInvested?: number;
    mortgageAmount?: number;
    mortgageMonthlyPayment?: number;
    mortgageInterestRate?: number;
    mortgageYears?: number;
    touched?: boolean;
  }>('business_plan');
  if (!inputs || !inputs.purchasePrice || inputs.purchasePrice <= 0) return null;
  const equityInvested = inputs.equityInvested ?? 0;
  return {
    purchasePrice: inputs.purchasePrice,
    equityInvested,
    mortgageAmount: inputs.mortgageAmount ?? Math.max(0, inputs.purchasePrice - equityInvested),
    mortgageMonthlyPayment: inputs.mortgageMonthlyPayment ?? 0,
    mortgageInterestRate: inputs.mortgageInterestRate ?? 5,
    mortgageYears: inputs.mortgageYears ?? 25,
    touched: !!inputs.touched,
  };
}

export function getMortgageResults(): MortgageResults | null {
  const inputs = load<{ tracks?: { principal?: number }[]; monthlyIncome?: number; freeCashFlow?: number }>('mortgage');
  const results = load<{ totalMonthlyPayment: number; weightedAverageInterest: number }>('mortgage_results');
  if (!inputs || !results) return null;
  return {
    totalMonthlyPayment: results.totalMonthlyPayment,
    weightedRate: results.weightedAverageInterest,
    totalPrincipal: inputs.tracks?.reduce((s, t) => s + (t.principal || 0), 0) || 0,
    monthlyIncome: inputs.monthlyIncome ?? inputs.freeCashFlow ?? 0,
    freeCashFlow: inputs.freeCashFlow ?? inputs.monthlyIncome ?? 0,
  };
}
