/**
 * Shapes of objects persisted under the `tool_*` keys by the calculator pages.
 * Defined manually because the calculators evolved before typed persistence.
 * Keep in sync with the `save(...)` calls in each calculator page.
 */

import type { MortgageTrack } from './mortgage-calculator';

export interface BudgetSaved {
  equity: number;
  monthlyIncome: number;
  monthlyObligations: number;
  buyerType: string;
  mortgageYears: number;
}

export interface BudgetResultsSaved {
  maxPropertyValue: number;
  maxMortgage: number;
  monthlyPayment: number;
  purchaseTax: number;
  sideCosts: number;
}

export interface MortgageSaved {
  tracks: MortgageTrack[];
  monthlyIncome: number;
  isOffPlan: boolean;
  propertyPrice: number;
  madadRate: number;
  madadYears: number;
}

export interface MortgageResultsSaved {
  totalMonthlyPayment: number;
  totalInterestPaid: number;
  weightedAverageInterest: number;
}

export interface CustomAppreciationRates {
  pessimistic: number;
  average: number;
  optimistic: number;
}

export interface BusinessPlanSaved {
  purchasePrice: number;
  sideCosts: number;
  renovationCost: number;
  equityInvested: number;
  mortgageAmount: number;
  mortgageMonthlyPayment: number;
  mortgageInterestRate: number;
  mortgageYears: number;
  expectedMonthlyRent: number;
  annualOperatingCosts: number;
  holdingPeriodYears: number;
  baseAppreciation: number;
  manualMode: boolean;
  customRates: CustomAppreciationRates;
}
