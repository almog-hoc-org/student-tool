import { calculatePurchaseTax, BuyerType } from './purchase-tax';
import { BOI_LIMITS, BUDGET_DEFAULT_ANNUAL_RATE } from '@/lib/constants/regulations';

export interface BudgetInput {
  equity: number;
  monthlyIncome: number;
  currentRent?: number;
  livingExpenses?: number;
  monthlyObligations: number;
  buyerType: BuyerType;
  mortgageYears: number;
  /** ריבית שנתית להערכה. ברירת מחדל: BUDGET_DEFAULT_ANNUAL_RATE */
  interestRate?: number;
}

export type BudgetWarningCode =
  | 'DTI_CAPPED'          // ההחזר הוגבל ל-40% מההכנסה הפנויה (בנק ישראל)
  | 'EQUITY_LIMITED'      // ההון העצמי הוא החסם (ולא כושר ההחזר)
  | 'NEGATIVE_CASHFLOW';  // התזרים הפנוי שלילי

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
  /** תקרת ההחזר לפי כלל 40% של בנק ישראל */
  dtiCapAmount: number;
  /** מה הגביל את ההחזר: כלל ה-DTI או התזרים בפועל */
  paymentCapSource: 'dti' | 'cashflow';
  /** שיעור המימון המקסימלי לפי סוג הרוכש (בנק ישראל) */
  maxLtv: number;
  warnings: BudgetWarningCode[];
  equityBreakdown: {
    netEquity: number;
    tax: number;
    costs: number;
  };
}

function getSideCostsRate(buyerType: BuyerType): number {
  switch (buyerType) {
    case 'singleApartment': return 0.035;
    case 'additionalApartment': return 0.04;
    case 'foreignResident': return 0.05;
    default: return 0.035;
  }
}

/** מגבלת מימון (LTV) לפי סוג רוכש — הוראות בנק ישראל */
export function getMaxLtv(buyerType: BuyerType): number {
  switch (buyerType) {
    case 'singleApartment': return BOI_LIMITS.LTV_FIRST_HOME;
    case 'additionalApartment': return BOI_LIMITS.LTV_INVESTOR;
    case 'foreignResident': return BOI_LIMITS.LTV_INVESTOR;
    default: return BOI_LIMITS.LTV_FIRST_HOME;
  }
}

function maxMortgageFromPayment(monthlyPayment: number, annualRate: number, years: number): number {
  if (monthlyPayment <= 0 || years <= 0) return 0;
  const r = annualRate / 100 / 12;
  const n = years * 12;
  if (r === 0) return monthlyPayment * n;
  return monthlyPayment * (1 - Math.pow(1 + r, -n)) / r;
}

function calculateMonthlyPayment(principal: number, annualRate: number, years: number): number {
  if (principal <= 0 || years <= 0) return 0;
  const r = annualRate / 100 / 12;
  const n = years * 12;
  if (r === 0) return principal / n;
  return (principal * r) / (1 - Math.pow(1 + r, -n));
}

export function calculateBudget(input: BudgetInput): BudgetOutput {
  const {
    equity, monthlyIncome, currentRent = 0, livingExpenses = 0,
    monthlyObligations, buyerType, mortgageYears,
    interestRate = BUDGET_DEFAULT_ANNUAL_RATE,
  } = input;

  const warnings: BudgetWarningCode[] = [];

  const freeCashFlow = monthlyIncome - currentRent - livingExpenses - monthlyObligations;

  // כלל בנק ישראל: החזר חודשי עד 40% מההכנסה הפנויה (הכנסה פחות התחייבויות קבועות)
  const disposableIncome = Math.max(0, monthlyIncome - monthlyObligations);
  const dtiCapAmount = BOI_LIMITS.MAX_DTI * disposableIncome;

  const maxAffordableMortgagePayment = Math.max(0, Math.min(freeCashFlow, dtiCapAmount));
  const paymentCapSource: 'dti' | 'cashflow' =
    dtiCapAmount <= Math.max(0, freeCashFlow) ? 'dti' : 'cashflow';

  if (freeCashFlow < 0) warnings.push('NEGATIVE_CASHFLOW');
  if (paymentCapSource === 'dti' && freeCashFlow > dtiCapAmount) warnings.push('DTI_CAPPED');

  const maxMortgageByCashflow = maxMortgageFromPayment(maxAffordableMortgagePayment, interestRate, mortgageYears);
  const sideCostsRate = getSideCostsRate(buyerType);
  const maxLtv = getMaxLtv(buyerType);
  const requiredEquityShare = 1 - maxLtv;

  const canAfford = (propertyValue: number) => {
    const tax = calculatePurchaseTax({ purchasePrice: propertyValue, buyerType }).totalTax;
    const sideCosts = propertyValue * sideCostsRate;
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
  const sideCosts = Math.round(maxPropertyValue * sideCostsRate);
  const netEquity = Math.max(0, equity - purchaseTax - sideCosts);
  const mortgageNeeded = Math.max(0, maxPropertyValue - netEquity);
  const maxMortgage = Math.min(mortgageNeeded, maxMortgageByCashflow, maxPropertyValue * maxLtv);
  const monthlyPayment = calculateMonthlyPayment(maxMortgage, interestRate, mortgageYears);
  const dtiPercent = disposableIncome > 0 ? (monthlyPayment / disposableIncome) * 100 : 0;
  const recommendedPropertyValue = Math.max(0, Math.round(maxPropertyValue * 0.9 / 1000) * 1000);

  // ההון העצמי הוא החסם כשהמשכנתא המותרת לא מנוצלת במלואה
  if (maxPropertyValue > 0 && mortgageNeeded < maxMortgageByCashflow - 1000
      && netEquity <= maxPropertyValue * requiredEquityShare + 1000) {
    warnings.push('EQUITY_LIMITED');
  }

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
    dtiCapAmount: Math.round(dtiCapAmount),
    paymentCapSource,
    maxLtv,
    warnings,
    equityBreakdown: {
      netEquity: Math.max(0, Math.round(netEquity)),
      tax: Math.round(purchaseTax),
      costs: sideCosts,
    },
  };
}
