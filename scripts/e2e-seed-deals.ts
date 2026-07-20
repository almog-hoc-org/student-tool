/**
 * עסקאות דמו לצילומי מסך — מחושבות עם מנוע החישוב האמיתי.
 * שלוש עסקאות מנוגדות (תזרים-חזק / השבחה-עם-סיכון / מאוזנת) + blob ישן
 * פגום, כדי שפסק הדין, הסיכונים, הגרפים וכרטיס האזהרה כולם ייראו בצילום.
 */
import { calculateBusinessPlan } from '../src/lib/calculations/business-plan';
import { calculatePurchaseTax, type BuyerType } from '../src/lib/calculations/purchase-tax';
import { calculateMortgageMonthlyPayment } from '../src/lib/calculations/mortgage-calculator';

interface SeedSpec {
  name: string;
  purchasePrice: number;
  equityInvested: number;
  expectedMonthlyRent: number;
  annualOperatingCosts: number;
  holdingPeriodYears: number;
  buyerType: BuyerType;
  propertyArea: string;
  propertySqm: number;
  baseAppreciation: number;
  mortgageOverride?: number;
}

function buildDeal(spec: SeedSpec, createdAt: string) {
  const purchaseTax = Math.round(
    calculatePurchaseTax({ purchasePrice: spec.purchasePrice, buyerType: spec.buyerType }).totalTax,
  );
  const sideCosts = Math.round(spec.purchasePrice * 0.03 + 14_000);
  const mortgageAmount = spec.mortgageOverride ?? Math.max(0, spec.purchasePrice - spec.equityInvested);
  const mortgageMonthlyPayment = Math.round(calculateMortgageMonthlyPayment(mortgageAmount, 5, 25));
  const customRates = { pessimistic: 0, average: spec.baseAppreciation, optimistic: spec.baseAppreciation + 1 };

  const inputs = {
    purchasePrice: spec.purchasePrice,
    propertyArea: spec.propertyArea,
    propertySqm: spec.propertySqm,
    propertyFloor: '',
    propertyRooms: '',
    propertyNotes: '',
    buyerType: spec.buyerType,
    purchaseTax,
    sideCosts,
    renovationCost: 0,
    equityInvested: spec.equityInvested,
    mortgageAmount,
    mortgageMonthlyPayment,
    mortgageInterestRate: 5,
    mortgageYears: 25,
    expectedMonthlyRent: spec.expectedMonthlyRent,
    annualOperatingCosts: spec.annualOperatingCosts,
    holdingPeriodYears: spec.holdingPeriodYears,
    baseAppreciation: spec.baseAppreciation,
    customRates,
    urbanRenewalUpliftMode: 'amount',
    urbanRenewalUpliftValue: 0,
    manualMortgageAmount: !!spec.mortgageOverride,
    manualMortgageMonthlyPayment: false,
    useSideCostPreset: false,
    selectedSideCosts: { broker: true, mortgageAdvice: true, lawyer: true, appraiser: true, extras: true },
  };

  const results = calculateBusinessPlan(
    {
      purchasePrice: spec.purchasePrice,
      sideCosts: sideCosts + purchaseTax,
      renovationCost: 0,
      equityInvested: spec.equityInvested,
      mortgageAmount,
      mortgageMonthlyPayment,
      mortgageInterestRate: 5,
      mortgageYears: 25,
      expectedMonthlyRent: spec.expectedMonthlyRent,
      annualOperatingCosts: spec.annualOperatingCosts,
      holdingPeriodYears: spec.holdingPeriodYears,
    },
    spec.baseAppreciation,
    customRates,
  );

  return {
    id: `seed-${spec.name}`,
    tool_key: 'business_plan',
    name: spec.name,
    data: { inputs, results, engineVersion: 2 },
    notes: null,
    created_at: createdAt,
  };
}

export function buildSeedSnapshots() {
  return [
    buildDeal({
      name: 'דירת תזרים בבאר שבע',
      purchasePrice: 1_100_000,
      equityInvested: 560_000,
      expectedMonthlyRent: 4_300,
      annualOperatingCosts: 6_000,
      holdingPeriodYears: 10,
      buyerType: 'additionalApartment',
      propertyArea: 'באר שבע ד׳',
      propertySqm: 75,
      baseAppreciation: 1,
    }, '2026-07-01T10:00:00.000Z'),
    buildDeal({
      name: 'השבחה בקריות',
      purchasePrice: 1_650_000,
      equityInvested: 420_000,
      expectedMonthlyRent: 4_100,
      annualOperatingCosts: 9_000,
      holdingPeriodYears: 8,
      buyerType: 'additionalApartment',
      propertyArea: 'קריית ים',
      propertySqm: 68,
      baseAppreciation: 3,
      mortgageOverride: 1_230_000, // מינוף מעל התקרה החוקית — מדגים אזהרות
    }, '2026-07-05T10:00:00.000Z'),
    buildDeal({
      name: 'דירה מאוזנת בחדרה',
      purchasePrice: 1_400_000,
      equityInvested: 700_000,
      expectedMonthlyRent: 4_600,
      annualOperatingCosts: 7_500,
      holdingPeriodYears: 12,
      buyerType: 'additionalApartment',
      propertyArea: 'חדרה',
      propertySqm: 82,
      baseAppreciation: 1.5,
    }, '2026-07-10T10:00:00.000Z'),
    // blob ישן ופגום — בלי scenarios ובלי engineVersion (בודק את כרטיס האזהרה)
    {
      id: 'seed-legacy',
      tool_key: 'business_plan',
      name: 'עסקה ישנה (לפני העדכון)',
      data: {
        inputs: {
          purchasePrice: 1_250_000,
          equityInvested: 400_000,
          mortgageAmount: 850_000,
          mortgageMonthlyPayment: 4_969,
          mortgageInterestRate: 5,
          mortgageYears: 25,
          expectedMonthlyRent: 3_900,
          annualOperatingCosts: 8_000,
          holdingPeriodYears: 10,
          sideCosts: 45_000,
          baseAppreciation: 1,
        },
      },
      notes: null,
      created_at: '2026-06-01T10:00:00.000Z',
    },
  ];
}
