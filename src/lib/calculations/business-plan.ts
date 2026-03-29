import { calculateIRR, calculateRentalIRR } from './irr';

export interface BusinessPlanInput {
  purchasePrice: number;
  sideCosts: number;
  renovationCost: number;
  equityInvested: number;
  mortgageAmount: number;
  mortgageMonthlyPayment: number;
  mortgageInterestRate: number;
  mortgageYears: number;
  expectedMonthlyRent: number;
  annualOperatingCosts: number; // ארנונה + ביטוח + תחזוקה + ניהול
  holdingPeriodYears: number;
}

export interface ScenarioResult {
  label: string;
  annualAppreciation: number;
  propertyValueAtEnd: number;
  totalProfit: number;
  cocYield: number;
  irr: number | null;
  yearlyProjection: { year: number; value: number; equity: number }[];
}

export interface BusinessPlanOutput {
  totalDealCost: number;
  annualNetCashflow: number;
  monthlyCashflow: number;
  scenarios: [ScenarioResult, ScenarioResult, ScenarioResult];
}

function calculateMortgageBalance(principal: number, annualRate: number, years: number, afterYears: number): number {
  if (principal <= 0 || years <= 0) return 0;
  const r = annualRate / 100 / 12;
  const n = years * 12;
  const k = afterYears * 12;
  if (r === 0) return principal * (1 - k / n);
  const fn = Math.pow(1 + r, n);
  const fk = Math.pow(1 + r, k);
  return principal * (fn - fk) / (fn - 1);
}

function calculateScenario(
  input: BusinessPlanInput,
  appreciationRate: number,
  label: string,
  totalDealCost: number,
  annualNetCashflow: number,
): ScenarioResult {
  const { purchasePrice, equityInvested, mortgageAmount, mortgageInterestRate, mortgageYears, holdingPeriodYears } = input;

  // Property value at end
  const propertyValueAtEnd = purchasePrice * Math.pow(1 + appreciationRate / 100, holdingPeriodYears);

  // Mortgage balance at end of holding period
  const mortgageBalance = calculateMortgageBalance(mortgageAmount, mortgageInterestRate, mortgageYears, holdingPeriodYears);

  // Exit costs (~2% of sale price)
  const exitCosts = propertyValueAtEnd * 0.02;

  // Total profit
  const totalProfit = (propertyValueAtEnd - exitCosts - mortgageBalance) - equityInvested + (annualNetCashflow * holdingPeriodYears);

  // Cash-on-Cash yield (annual)
  const cocYield = equityInvested > 0 ? annualNetCashflow / equityInvested : 0;

  // IRR
  const irr = calculateRentalIRR({
    totalInvestment: equityInvested,
    annualNetCashflow,
    holdingYears: holdingPeriodYears,
    exitValue: propertyValueAtEnd,
    exitCosts: exitCosts + mortgageBalance,
  });

  // Yearly projection
  const yearlyProjection = [];
  for (let year = 0; year <= holdingPeriodYears; year++) {
    const value = purchasePrice * Math.pow(1 + appreciationRate / 100, year);
    const balance = year === 0 ? mortgageAmount : calculateMortgageBalance(mortgageAmount, mortgageInterestRate, mortgageYears, year);
    yearlyProjection.push({
      year,
      value: Math.round(value),
      equity: Math.round(value - balance),
    });
  }

  return {
    label,
    annualAppreciation: appreciationRate,
    propertyValueAtEnd: Math.round(propertyValueAtEnd),
    totalProfit: Math.round(totalProfit),
    cocYield,
    irr,
    yearlyProjection,
  };
}

export function calculateBusinessPlan(
  input: BusinessPlanInput,
  baseAppreciation: number,
  customRates?: { pessimistic?: number; average?: number; optimistic?: number },
): BusinessPlanOutput {
  const totalDealCost = input.purchasePrice + input.sideCosts + input.renovationCost;

  // Annual cashflow
  const grossRentYear = input.expectedMonthlyRent * 12;
  const annualMortgagePayment = input.mortgageMonthlyPayment * 12;
  const annualNetCashflow = grossRentYear - input.annualOperatingCosts - annualMortgagePayment;

  const pessRate = customRates?.pessimistic ?? Math.max(0, baseAppreciation - 2);
  const avgRate = customRates?.average ?? baseAppreciation;
  const optRate = customRates?.optimistic ?? baseAppreciation + 2;

  const scenarios: [ScenarioResult, ScenarioResult, ScenarioResult] = [
    calculateScenario(input, pessRate, 'מחמיר', totalDealCost, annualNetCashflow),
    calculateScenario(input, avgRate, 'ממוצע', totalDealCost, annualNetCashflow),
    calculateScenario(input, optRate, 'אופטימי', totalDealCost, annualNetCashflow),
  ];

  return {
    totalDealCost,
    annualNetCashflow,
    monthlyCashflow: Math.round(annualNetCashflow / 12),
    scenarios,
  };
}
