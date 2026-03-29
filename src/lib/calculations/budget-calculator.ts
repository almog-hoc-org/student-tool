import { MARKET_CONSTANTS } from './mortgage-calculator';
import { calculatePurchaseTax, BuyerType } from './purchase-tax';

export interface BudgetInput {
  equity: number;
  monthlyIncome: number;
  monthlyObligations: number;
  buyerType: BuyerType;
  mortgageYears: number;
}

export interface BudgetOutput {
  maxPropertyValue: number;
  maxMortgage: number;
  monthlyPayment: number;
  purchaseTax: number;
  sideCosts: number;
  netEquityForProperty: number;
  dtiPercent: number;
  equityBreakdown: {
    netEquity: number;
    tax: number;
    costs: number;
  };
}

const DEFAULT_INTEREST_RATE = 5.0; // ריבית ממוצעת משוקללת

// Side costs as percentage of property price
function getSideCostsRate(buyerType: BuyerType): number {
  switch (buyerType) {
    case 'singleApartment': return 0.035; // ~3.5%
    case 'additionalApartment': return 0.04; // ~4%
    case 'foreignResident': return 0.05; // ~5%
    default: return 0.035;
  }
}

// LTV limit based on buyer type
function getLtvLimit(buyerType: BuyerType): number {
  switch (buyerType) {
    case 'singleApartment': return MARKET_CONSTANTS.LTV_FIRST_HOME;
    case 'additionalApartment': return MARKET_CONSTANTS.LTV_INVESTOR;
    case 'foreignResident': return MARKET_CONSTANTS.LTV_INVESTOR;
    default: return MARKET_CONSTANTS.LTV_FIRST_HOME;
  }
}

// Calculate max mortgage from monthly payment using PMT inverse
function maxMortgageFromPayment(monthlyPayment: number, annualRate: number, years: number): number {
  const r = annualRate / 100 / 12;
  const n = years * 12;
  if (r === 0) return monthlyPayment * n;
  return monthlyPayment * (1 - Math.pow(1 + r, -n)) / r;
}

// Calculate monthly payment from mortgage amount
function calculateMonthlyPayment(principal: number, annualRate: number, years: number): number {
  const r = annualRate / 100 / 12;
  const n = years * 12;
  if (r === 0) return principal / n;
  return (principal * r) / (1 - Math.pow(1 + r, -n));
}

export function calculateBudget(input: BudgetInput): BudgetOutput {
  const { equity, monthlyIncome, monthlyObligations, buyerType, mortgageYears } = input;

  // Step 1: Max monthly payment (DTI constraint)
  // Bank of Israel rule: all obligations (existing + new mortgage) ≤ 40% of income
  const maxMonthlyPayment = monthlyIncome * MARKET_CONSTANTS.MAX_DTI - monthlyObligations;
  const effectiveMonthlyPayment = Math.max(0, maxMonthlyPayment);

  // Step 2: Max mortgage from payment capacity
  const maxMortgageFromDTI = maxMortgageFromPayment(effectiveMonthlyPayment, DEFAULT_INTEREST_RATE, mortgageYears);

  // Step 3: Iterative solve for max property value
  // Property = Mortgage + (Equity - Tax - SideCosts)
  // Tax and SideCosts depend on Property value, so we iterate
  const ltvLimit = getLtvLimit(buyerType);
  const sideCostsRate = getSideCostsRate(buyerType);

  let propertyValue = 0;
  let bestProperty = 0;

  // Binary search for the max property value
  let lo = 0;
  let hi = equity + maxMortgageFromDTI + 1000000; // Upper bound

  for (let iter = 0; iter < 50; iter++) {
    propertyValue = (lo + hi) / 2;

    const tax = calculatePurchaseTax({ purchasePrice: propertyValue, buyerType }).totalTax;
    const sideCosts = propertyValue * sideCostsRate;
    const totalCosts = tax + sideCosts;

    // Equity available for down payment
    const downPayment = equity - totalCosts;
    if (downPayment <= 0) {
      hi = propertyValue;
      continue;
    }

    // Mortgage needed
    const mortgageNeeded = propertyValue - downPayment;

    // Check LTV constraint
    const maxMortgageFromLTV = propertyValue * ltvLimit;

    // Check DTI constraint
    const effectiveMortgage = Math.min(mortgageNeeded, maxMortgageFromLTV, maxMortgageFromDTI);

    // Can we afford this property?
    const canAfford = downPayment + effectiveMortgage >= propertyValue;

    if (canAfford) {
      bestProperty = propertyValue;
      lo = propertyValue;
    } else {
      hi = propertyValue;
    }

    if (hi - lo < 1000) break; // Converged to ₪1,000
  }

  // Final calculation with best property value
  propertyValue = Math.round(bestProperty / 10000) * 10000; // Round to 10K
  const purchaseTax = calculatePurchaseTax({ purchasePrice: propertyValue, buyerType }).totalTax;
  const sideCosts = Math.round(propertyValue * sideCostsRate);
  const netEquity = equity - purchaseTax - sideCosts;
  const mortgage = Math.min(
    propertyValue - Math.max(0, netEquity),
    propertyValue * ltvLimit,
    maxMortgageFromDTI
  );
  const monthlyPayment = calculateMonthlyPayment(mortgage, DEFAULT_INTEREST_RATE, mortgageYears);
  const dtiPercent = monthlyIncome > 0 ? (monthlyPayment / monthlyIncome) * 100 : 0;

  return {
    maxPropertyValue: propertyValue,
    maxMortgage: Math.round(mortgage),
    monthlyPayment: Math.round(monthlyPayment),
    purchaseTax: Math.round(purchaseTax),
    sideCosts,
    netEquityForProperty: Math.max(0, Math.round(netEquity)),
    dtiPercent,
    equityBreakdown: {
      netEquity: Math.max(0, Math.round(netEquity)),
      tax: Math.round(purchaseTax),
      costs: sideCosts,
    },
  };
}
