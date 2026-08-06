import { calculateRentalIRR } from './irr';
import { remainingBalance } from './annuity';
import { calculateCapitalGainsTax } from './capital-gains';
import { calculateRentalTax, RentalTaxTrack } from './rental-tax';
import { BuyerType } from './purchase-tax';
import { FINANCE } from '@/lib/constants/financial';

// עלויות מכירה: תיווך 2% + מע"מ, עו"ד מוכר 0.5% + מע"מ ≈ 2.95% מהתמורה
export const SALE_BROKER_PERCENT = 2;
export const SALE_LAWYER_PERCENT = 0.5;
export const EXIT_COSTS_RATE =
  ((SALE_BROKER_PERCENT + SALE_LAWYER_PERCENT) / 100) * (1 + FINANCE.VAT_RATE);

/**
 * גרסת מנוע החישוב — נחתמת בכל snapshot שנשמר.
 * v1: לפני איחוד המנועים (בלי מס רכישה בהזנה ישירה, טאבו 0.5%)
 * v2: מנוע מאוחד — מס רכישה תמיד, עלויות מתוקנות, clamp יתרה
 * v3: עלויות נלוות אחודות עם מע"מ (מתווך/עו"ד/שמאי), מס שבח ומס שכירות באקזיט
 */
export const BUSINESS_PLAN_ENGINE_VERSION = 3;

export interface BusinessPlanInput {
  purchasePrice: number;
  /** עלויות נלוות כולל מס רכישה (העמוד מוסיף את המס לפני הקריאה) */
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
  /**
   * סוג הרוכש — קובע אם חל פטור דירה יחידה במס שבח באקזיט.
   * דירה יחידה/משפר דיור: פטור (עד התקרה). משקיע/תושב חוץ: 25% על השבח הריאלי.
   * ברירת מחדל היסטורית (נתונים שמורים ישנים): ללא מס שבח — כמו v2.
   */
  buyerType?: BuyerType;
  /** מסלול מס על השכירות (ברירת מחדל: אוטומטי — פטור עד התקרה, אחרת 10%) */
  rentalTaxTrack?: RentalTaxTrack;
}

export interface ScenarioResult {
  label: string;
  annualAppreciation: number;
  propertyValueAtEnd: number;
  valueUplift: number;
  initialInvestment: number;
  /** עלויות מכירה (תיווך + עו"ד + מע"מ) */
  exitCosts: number;
  /** מס שבח באקזיט (0 כשחל פטור דירה יחידה) */
  capitalGainsTax: number;
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
  /** מס שנתי על השכירות (0 עד תקרת הפטור) */
  annualRentalTax: number;
  /** המסלול שנבחר בפועל למס השכירות */
  rentalTaxTrack: 'exempt' | 'flat10' | 'none';
  scenarios: [ScenarioResult, ScenarioResult, ScenarioResult];
}

// יתרת משכנתא — מימוש משותף עם clamp ל-0 (תקופת החזקה ארוכה מתקופת ההלוואה)
const calculateMortgageBalance = remainingBalance;

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
  // עלויות מכירה ריאליות: תיווך + עו"ד מוכר + מע"מ (לא 2% עגול)
  const exitCosts = propertyValueAtEnd * EXIT_COSTS_RATE;

  // מס שבח — הפער הגדול ביותר שהיה במנוע: משקיע משלם 25% על השבח הריאלי.
  // בסיס העלות: מחיר + עלויות נלוות (כולל מס רכישה) + שיפוץ — כולם ניכויים מוכרים.
  const capitalGains = input.buyerType
    ? calculateCapitalGainsTax({
        purchasePrice,
        acquisitionCosts: input.sideCosts,
        improvementCosts: input.renovationCost,
        salePrice: propertyValueAtEnd,
        sellingCosts: exitCosts,
        holdingYears: holdingPeriodYears,
        isExemptSingleApartment: input.buyerType === 'singleApartment' || input.buyerType === 'upgrade',
      })
    : null;
  const capitalGainsTax = capitalGains?.tax ?? 0;

  const netSaleProceeds = propertyValueAtEnd - exitCosts - capitalGainsTax - mortgageBalance;
  const totalProfit = netSaleProceeds + (annualNetCashflow * holdingPeriodYears) - initialInvestment;

  const annualEquityReturn = initialInvestment > 0 ? annualNetCashflow / initialInvestment : 0;
  const totalEquityReturn = initialInvestment > 0 ? totalProfit / initialInvestment : 0;

  const irr = calculateRentalIRR({
    totalInvestment: initialInvestment,
    annualNetCashflow,
    holdingYears: holdingPeriodYears,
    exitValue: propertyValueAtEnd,
    exitCosts: exitCosts + capitalGainsTax + mortgageBalance,
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
    exitCosts: Math.round(exitCosts),
    capitalGainsTax: Math.round(capitalGainsTax),
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
  // מס על השכירות — פטור עד התקרה, אחרת 10% על המחזור
  const rentalTax = calculateRentalTax(input.expectedMonthlyRent, input.rentalTaxTrack ?? 'auto');
  const annualNetCashflow =
    grossRentYear - rentalTax.annualTax - input.annualOperatingCosts - annualMortgagePayment;

  // התרחיש המחמיר רשאי להיות שלילי — מבחן לחץ אמיתי חייב לאפשר שוק יורד
  const pessRate = customRates?.pessimistic ?? (baseAppreciation - 2);
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
    annualRentalTax: rentalTax.annualTax,
    rentalTaxTrack: rentalTax.effectiveTrack,
    scenarios,
  };
}

