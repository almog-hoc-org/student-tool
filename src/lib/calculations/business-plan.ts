import { calculateRentalIRR } from './irr';

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
  annualOperatingCosts: number;
  holdingPeriodYears: number;
  urbanRenewalUpliftAmount?: number;
  urbanRenewalUpliftPercent?: number;
}

export interface ScenarioResult {
  label: string;
  annualAppreciation: number;
  propertyValueAtEnd: number;
  valueUplift: number;
  initialInvestment: number;
  netSaleProceeds: number;
  totalProfit: number;
  annualEquityReturn: number;
  totalEquityReturn: number;
  cocYield: number;
  irr: number | null;
  yearlyProjection: { year: number; value: number; equity: number }[];
}

export interface BusinessPlanOutput {
  totalDealCost: number;
  initialInvestment: number;
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

function getUrbanRenewalUplift(input: BusinessPlanInput): number {
  if (input.urbanRenewalUpliftAmount && input.urbanRenewalUpliftAmount > 0) {
    return input.urbanRenewalUpliftAmount;
  }
  if (input.urbanRenewalUpliftPercent && input.urbanRenewalUpliftPercent > 0) {
    return input.purchasePrice * (input.urbanRenewalUpliftPercent / 100);
  }
  return 0;
}

function calculateScenario(
  input: BusinessPlanInput,
  appreciationRate: number,
  label: string,
  annualNetCashflow: number,
  initialInvestment: number,
): ScenarioResult {
  const { purchasePrice, mortgageAmount, mortgageInterestRate, mortgageYears, holdingPeriodYears } = input;
  const valueUplift = getUrbanRenewalUplift(input);

  const baseValueAtEnd = purchasePrice * Math.pow(1 + appreciationRate / 100, holdingPeriodYears);
  const propertyValueAtEnd = baseValueAtEnd + valueUplift;
  const mortgageBalance = calculateMortgageBalance(mortgageAmount, mortgageInterestRate, mortgageYears, holdingPeriodYears);
  const exitCosts = propertyValueAtEnd * 0.02;
  const netSaleProceeds = propertyValueAtEnd - exitCosts - mortgageBalance;
  const totalProfit = netSaleProceeds + (annualNetCashflow * holdingPeriodYears) - initialInvestment;

  const annualEquityReturn = initialInvestment > 0 ? annualNetCashflow / initialInvestment : 0;
  const totalEquityReturn = initialInvestment > 0 ? totalProfit / initialInvestment : 0;

  const irr = calculateRentalIRR({
    totalInvestment: initialInvestment,
    annualNetCashflow,
    holdingYears: holdingPeriodYears,
    exitValue: propertyValueAtEnd,
    exitCosts: exitCosts + mortgageBalance,
  });

  const yearlyProjection = [] as { year: number; value: number; equity: number }[];
  for (let year = 0; year <= holdingPeriodYears; year++) {
    const value = purchasePrice * Math.pow(1 + appreciationRate / 100, year) + (year === holdingPeriodYears ? valueUplift : 0);
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
    valueUplift: Math.round(valueUplift),
    initialInvestment: Math.round(initialInvestment),
    netSaleProceeds: Math.round(netSaleProceeds),
    totalProfit: Math.round(totalProfit),
    annualEquityReturn,
    totalEquityReturn,
    cocYield: annualEquityReturn,
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
  const initialInvestment = Math.max(0, totalDealCost - input.mortgageAmount);

  const grossRentYear = input.expectedMonthlyRent * 12;
  const annualMortgagePayment = input.mortgageMonthlyPayment * 12;
  const annualNetCashflow = grossRentYear - input.annualOperatingCosts - annualMortgagePayment;

  const pessRate = customRates?.pessimistic ?? Math.max(0, baseAppreciation - 2);
  const avgRate = customRates?.average ?? baseAppreciation;
  const optRate = customRates?.optimistic ?? baseAppreciation + 1;

  const scenarios: [ScenarioResult, ScenarioResult, ScenarioResult] = [
    calculateScenario(input, pessRate, 'מחמיר', annualNetCashflow, initialInvestment),
    calculateScenario(input, avgRate, 'בינוני', annualNetCashflow, initialInvestment),
    calculateScenario(input, optRate, 'טוב', annualNetCashflow, initialInvestment),
  ];

  return {
    totalDealCost,
    initialInvestment,
    annualNetCashflow,
    monthlyCashflow: Math.round(annualNetCashflow / 12),
    scenarios,
  };
}

