import { calculatePurchaseTax, BuyerType } from './purchase-tax';
import { quickSideCostsEstimate } from './side-costs';
import { FINANCE } from '@/lib/constants/financial';
import { monthlyPayment, principalFromPayment } from './annuity';

export interface BudgetInput {
  equity: number;
  monthlyIncome: number;
  currentRent?: number;
  livingExpenses?: number;
  monthlyObligations: number;
  buyerType: BuyerType;
  mortgageYears: number;
}

export interface BudgetOutput {
  maxPropertyValue: number;
  maxMortgage: number;
  maxMortgageByCashflow: number;
  monthlyPayment: number;
  purchaseTax: number;
  sideCosts: number;
  netEquityForProperty: number;
  freeCashFlow: number;
  maxAffordableMortgagePayment: number;
  maxPropertyByEquity: number;
  recommendedPropertyValue: number;
  dtiPercent: number;
  equityBreakdown: {
    netEquity: number;
    tax: number;
    costs: number;
  };
}

const DEFAULT_INTEREST_RATE = FINANCE.DEFAULT_MORTGAGE_RATE;
const MIN_EQUITY_SHARE = 0.25;


const maxMortgageFromPayment = principalFromPayment;
const calculateMonthlyPayment = monthlyPayment;

export function calculateBudget(input: BudgetInput): BudgetOutput {
  const { equity, monthlyIncome, currentRent = 0, livingExpenses = 0, monthlyObligations, buyerType, mortgageYears } = input;

  const freeCashFlow = monthlyIncome - currentRent - livingExpenses - monthlyObligations;
  const maxAffordableMortgagePayment = Math.max(0, freeCashFlow);
  const maxMortgageByCashflow = maxMortgageFromPayment(maxAffordableMortgagePayment, DEFAULT_INTEREST_RATE, mortgageYears);
  const requiredEquityShare = MIN_EQUITY_SHARE;

  const canAfford = (propertyValue: number) => {
    const tax = calculatePurchaseTax({ purchasePrice: propertyValue, buyerType }).totalTax;
    const sideCosts = quickSideCostsEstimate(propertyValue).totalSideCosts;
    const availableAfterCosts = equity - tax - sideCosts;
    const minimumEquityNeeded = propertyValue * requiredEquityShare;
    const mortgageNeeded = Math.max(0, propertyValue - availableAfterCosts);

    return (
      availableAfterCosts >= minimumEquityNeeded
      && mortgageNeeded <= maxMortgageByCashflow
    );
  };

  let bestProperty = 0;
  let lo = 0;
  let hi = Math.max(
    equity / requiredEquityShare,
    maxMortgageByCashflow / Math.max(1 - requiredEquityShare, 0.01),
    1_000_000,
  ) + 1_000_000;

  for (let i = 0; i < 60; i++) {
    const mid = (lo + hi) / 2;
    if (canAfford(mid)) {
      bestProperty = mid;
      lo = mid;
    } else {
      hi = mid;
    }
    if (hi - lo < 500) break;
  }

  const maxPropertyValue = Math.max(0, Math.round(bestProperty / 1000) * 1000);
  const purchaseTax = calculatePurchaseTax({ purchasePrice: maxPropertyValue, buyerType }).totalTax;
  const sideCosts = quickSideCostsEstimate(maxPropertyValue).totalSideCosts;
  const netEquity = Math.max(0, equity - purchaseTax - sideCosts);
  const mortgageNeeded = Math.max(0, maxPropertyValue - netEquity);
  const maxMortgage = Math.min(mortgageNeeded, maxMortgageByCashflow, maxPropertyValue * (1 - requiredEquityShare));
  const monthlyPayment = calculateMonthlyPayment(maxMortgage, DEFAULT_INTEREST_RATE, mortgageYears);
  const dtiPercent = maxAffordableMortgagePayment > 0 ? (monthlyPayment / maxAffordableMortgagePayment) * 100 : 0;
  const recommendedPropertyValue = Math.max(0, Math.round(maxPropertyValue * 0.9 / 1000) * 1000);

  return {
    maxPropertyValue,
    maxMortgage: Math.round(maxMortgage),
    maxMortgageByCashflow: Math.round(maxMortgageByCashflow),
    monthlyPayment: Math.round(monthlyPayment),
    purchaseTax: Math.round(purchaseTax),
    sideCosts,
    netEquityForProperty: Math.max(0, Math.round(netEquity)),
    freeCashFlow: Math.round(freeCashFlow),
    maxAffordableMortgagePayment: Math.round(maxAffordableMortgagePayment),
    maxPropertyByEquity: Math.round(equity / requiredEquityShare),
    recommendedPropertyValue,
    dtiPercent,
    equityBreakdown: {
      netEquity: Math.max(0, Math.round(netEquity)),
      tax: Math.round(purchaseTax),
      costs: sideCosts,
    },
  };
}
