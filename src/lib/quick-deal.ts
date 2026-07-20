// הוספת עסקה מהירה — בונה snapshot של תוכנית עסקית מלאה מ-4 שדות חובה,
// בדיוק באותם ערכי ברירת מחדל ונוסחאות של עמוד התוכנית העסקית, כך
// שעריכה מאוחרת שם לא משנה אף מספר.

import { calculateBusinessPlan, BUSINESS_PLAN_ENGINE_VERSION, type BusinessPlanOutput } from './calculations/business-plan';
import { calculatePurchaseTax, type BuyerType } from './calculations/purchase-tax';
import { businessPlanSideCostsPreset } from './calculations/side-costs';
import { monthlyPayment } from './calculations/annuity';
import { FINANCE, getMaxLtv, getMinEquityShare } from './constants/financial';
import { formatCurrency } from './validation/validators';

export interface QuickDealInput {
  name: string;
  purchasePrice: number;
  expectedMonthlyRent: number;
  equityInvested: number;
  buyerType: BuyerType;
  propertyArea?: string;
  propertySqm?: number;
  listingUrl?: string;
}

export interface QuickDealWarning {
  key: 'ltv_exceeded' | 'negative_cashflow';
  message: string;
}

// ברירות המחדל של התוכנית העסקית (BP_DEFAULTS) — חייבות להישאר תואמות
const DEFAULTS = {
  mortgageInterestRate: FINANCE.DEFAULT_MORTGAGE_RATE,
  mortgageYears: 25,
  annualOperatingCosts: 8000,
  holdingPeriodYears: 10,
  baseAppreciation: 1,
  customRates: { pessimistic: 0, average: 1, optimistic: 2 },
} as const;

const ALL_PRESET = { broker: true, mortgageAdvice: true, lawyer: true, appraiser: true, extras: true };

/** ההון העצמי המינימלי החוקי — הצעת ברירת מחדל לטופס */
export function suggestedEquity(purchasePrice: number, buyerType: BuyerType): number {
  return Math.round(purchasePrice * getMinEquityShare(buyerType));
}

export function buildQuickDealSnapshot(input: QuickDealInput): {
  data: { inputs: Record<string, unknown>; results: BusinessPlanOutput; engineVersion: number };
  warnings: QuickDealWarning[];
} | null {
  const { purchasePrice, expectedMonthlyRent, equityInvested, buyerType } = input;
  if (!input.name.trim() || purchasePrice <= 0 || expectedMonthlyRent <= 0 || equityInvested <= 0) {
    return null;
  }

  const purchaseTax = Math.round(calculatePurchaseTax({ purchasePrice, buyerType }).totalTax);
  const sideCosts = Math.round(businessPlanSideCostsPreset(purchasePrice, ALL_PRESET));
  const mortgageAmount = Math.max(0, purchasePrice - equityInvested);
  const mortgageMonthlyPayment = Math.round(
    monthlyPayment(mortgageAmount, DEFAULTS.mortgageInterestRate, DEFAULTS.mortgageYears),
  );

  // בדיוק המבנה ש-BusinessPlan שומר ב-getData — round-trip נקי לעריכה
  const inputs: Record<string, unknown> = {
    purchasePrice,
    propertyArea: input.propertyArea ?? '',
    propertySqm: input.propertySqm ?? 0,
    propertyFloor: '',
    propertyRooms: '',
    propertyNotes: '',
    buyerType,
    purchaseTax,
    sideCosts,
    renovationCost: 0,
    equityInvested,
    mortgageAmount,
    mortgageMonthlyPayment,
    mortgageInterestRate: DEFAULTS.mortgageInterestRate,
    mortgageYears: DEFAULTS.mortgageYears,
    expectedMonthlyRent,
    annualOperatingCosts: DEFAULTS.annualOperatingCosts,
    holdingPeriodYears: DEFAULTS.holdingPeriodYears,
    baseAppreciation: DEFAULTS.baseAppreciation,
    customRates: { ...DEFAULTS.customRates },
    urbanRenewalUpliftMode: 'amount',
    urbanRenewalUpliftValue: 0,
    manualMortgageAmount: false,
    manualMortgageMonthlyPayment: false,
    useSideCostPreset: true,
    selectedSideCosts: { ...ALL_PRESET },
    ...(input.listingUrl ? { listingUrl: input.listingUrl } : {}),
  };

  const results = calculateBusinessPlan(
    {
      purchasePrice,
      sideCosts: sideCosts + purchaseTax,
      renovationCost: 0,
      equityInvested,
      mortgageAmount,
      mortgageMonthlyPayment,
      mortgageInterestRate: DEFAULTS.mortgageInterestRate,
      mortgageYears: DEFAULTS.mortgageYears,
      expectedMonthlyRent,
      annualOperatingCosts: DEFAULTS.annualOperatingCosts,
      holdingPeriodYears: DEFAULTS.holdingPeriodYears,
    },
    DEFAULTS.baseAppreciation,
    DEFAULTS.customRates,
  );

  const warnings: QuickDealWarning[] = [];
  const maxLtv = getMaxLtv(buyerType);
  if (purchasePrice > 0 && mortgageAmount / purchasePrice > maxLtv + 0.001) {
    warnings.push({
      key: 'ltv_exceeded',
      message: `המשכנתא הנדרשת (${Math.round((mortgageAmount / purchasePrice) * 100)}%) חורגת מתקרת המימון החוקית (${Math.round(maxLtv * 100)}%) לסוג רוכש זה`,
    });
  }
  if (results.monthlyCashflow < 0) {
    warnings.push({
      key: 'negative_cashflow',
      message: `תזרים חודשי שלילי — תצטרך להשלים ${formatCurrency(Math.abs(results.monthlyCashflow))} מהכיס כל חודש`,
    });
  }

  return {
    data: { inputs, results, engineVersion: BUSINESS_PLAN_ENGINE_VERSION },
    warnings,
  };
}
