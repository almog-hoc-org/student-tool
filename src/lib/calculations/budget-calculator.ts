import { calculatePurchaseTax, BuyerType } from './purchase-tax';
import { quickSideCostsEstimate } from './side-costs';
import { FINANCE, getMaxLtv, getMinEquityShare } from '@/lib/constants/financial';
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


const maxMortgageFromPayment = principalFromPayment;
const calculateMonthlyPayment = monthlyPayment;

export function calculateBudget(input: BudgetInput): BudgetOutput {
  const { equity, monthlyIncome, currentRent = 0, livingExpenses = 0, monthlyObligations, buyerType, mortgageYears } = input;

  const freeCashFlow = monthlyIncome - currentRent - livingExpenses - monthlyObligations;
  // תקרת החזר: כלל הבנקים (40% מההכנסה נטו, בניכוי התחייבויות קיימות),
  // ולא יותר מהתזרים הפנוי בפועל.
  const maxPaymentByDti = FINANCE.MAX_DTI * monthlyIncome - monthlyObligations;
  const maxAffordableMortgagePayment = Math.max(0, Math.min(maxPaymentByDti, freeCashFlow));
  const maxMortgageByCashflow = maxMortgageFromPayment(maxAffordableMortgagePayment, DEFAULT_INTEREST_RATE, mortgageYears);
  // תקרת מימון (LTV) לפי סוג הרוכש: דירה יחידה 75%, דירה נוספת/תושב חוץ 50%
  const maxLtv = getMaxLtv(buyerType);
  const requiredEquityShare = getMinEquityShare(buyerType);

  const canAfford = (propertyValue: number) => {
    const tax = calculatePurchaseTax({ purchasePrice: propertyValue, buyerType }).totalTax;
    const sideCosts = quickSideCostsEstimate(propertyValue).totalSideCosts;
    const availableAfterCosts = equity - tax - sideCosts;
    const minimumEquityNeeded = propertyValue * requiredEquityShare;
    const mortgageNeeded = Math.max(0, propertyValue - availableAfterCosts);

    return (
      availableAfterCosts >= minimumEquityNeeded
      && mortgageNeeded <= maxMortgageByCashflow
      && mortgageNeeded <= propertyValue * maxLtv
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
  const maxMortgage = Math.min(mortgageNeeded, maxMortgageByCashflow, maxPropertyValue * maxLtv);
  const payment = calculateMonthlyPayment(maxMortgage, DEFAULT_INTEREST_RATE, mortgageYears);
  // יחס החזר מההכנסה (DTI) — כמו שהבנק מודד: החזר חודשי חלקי הכנסה נטו
  const dtiPercent = monthlyIncome > 0 ? (payment / monthlyIncome) * 100 : 0;
  const recommendedPropertyValue = Math.max(0, Math.round(maxPropertyValue * 0.9 / 1000) * 1000);

  return {
    maxPropertyValue,
    maxMortgage: Math.round(maxMortgage),
    maxMortgageByCashflow: Math.round(maxMortgageByCashflow),
    monthlyPayment: Math.round(payment),
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
