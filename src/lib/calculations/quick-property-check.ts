// בדיקה מהירה לנכס — הרכבה של engines קיימים
// אין מתמטיקה חדשה — רק composition

import { calculatePurchaseTax, BuyerType } from './purchase-tax';
import { calculateSideCosts, getDefaultSideCostsInput } from './side-costs';
import { calculateMortgageTrack } from './mortgage-calculator';
import { MARKET_CONSTANTS } from './mortgage-calculator';

export interface QuickCheckInput {
  purchasePrice: number;
  buyerType: BuyerType;
  equityPercent: number; // e.g. 25 for 25%
}

export interface QuickCheckOutput {
  purchasePrice: number;
  purchaseTax: number;
  effectiveTaxRate: number;
  sideCosts: number;
  totalCashNeeded: number; // equity + tax + side costs
  equityAmount: number;
  mortgageAmount: number;
  estimatedMonthlyPayment: number;
  totalAcquisitionCost: number; // price + tax + side costs
}

const DEFAULT_MORTGAGE_RATE = 4.5; // ריבית ממוצעת משוקללת סבירה
const DEFAULT_MORTGAGE_YEARS = 25;

export function calculateQuickCheck(input: QuickCheckInput): QuickCheckOutput {
  const { purchasePrice, buyerType, equityPercent } = input;

  // 1. Purchase tax
  const taxResult = calculatePurchaseTax({ purchasePrice, buyerType });

  // 2. Side costs (default: lawyer + broker + appraisal + inspection + insurance + registration)
  const sideCostsInput = getDefaultSideCostsInput(purchasePrice);
  const sideCostsResult = calculateSideCosts(sideCostsInput);

  // 3. Equity & mortgage split
  const equityAmount = Math.round(purchasePrice * (equityPercent / 100));
  const mortgageAmount = purchasePrice - equityAmount;

  // 4. Estimated monthly mortgage payment (single track, fixed unlinked)
  let estimatedMonthlyPayment = 0;
  if (mortgageAmount > 0) {
    const trackResult = calculateMortgageTrack({
      id: 'quick-estimate',
      name: 'הערכה',
      type: 'fixedUnlinked',
      principal: mortgageAmount,
      annualInterestRate: DEFAULT_MORTGAGE_RATE,
      years: DEFAULT_MORTGAGE_YEARS,
    });
    estimatedMonthlyPayment = Math.round(trackResult.monthlyPayment);
  }

  // 5. Total cash needed = equity + tax + side costs
  const totalCashNeeded = equityAmount + taxResult.totalTax + sideCostsResult.totalSideCosts;
  const totalAcquisitionCost = purchasePrice + taxResult.totalTax + sideCostsResult.totalSideCosts;

  return {
    purchasePrice,
    purchaseTax: Math.round(taxResult.totalTax),
    effectiveTaxRate: taxResult.effectiveRate,
    sideCosts: sideCostsResult.totalSideCosts,
    totalCashNeeded,
    equityAmount,
    mortgageAmount,
    estimatedMonthlyPayment,
    totalAcquisitionCost,
  };
}
