import { describe, it, expect } from 'vitest';
import { calculateBusinessPlan, CAPITAL_GAINS_TAX_RATE, type BusinessPlanInput } from '../business-plan';

// TESTING.md 1.3A — השכרה עם תזרים חיובי
const rentalInput: BusinessPlanInput = {
  purchasePrice: 1_300_000,
  sideCosts: 170_000,
  renovationCost: 0,
  equityInvested: 400_000,
  mortgageAmount: 1_070_000,
  mortgageMonthlyPayment: 5_000,
  mortgageInterestRate: 4.5,
  mortgageYears: 25,
  expectedMonthlyRent: 5_800,
  annualOperatingCosts: 3_000,
  holdingPeriodYears: 10,
};

describe('calculateBusinessPlan — תזרים', () => {
  it('שכירות גבוהה מהמשכנתא וההוצאות → תזרים חיובי', () => {
    const result = calculateBusinessPlan(rentalInput, 2);
    // 5,800×12 − 3,000 − 5,000×12 = 6,600 שנתי
    expect(result.annualNetCashflow).toBe(6_600);
    expect(result.monthlyCashflow).toBe(550);
  });

  it('Cash on Cash בטווח סביר (TESTING.md 1.3A)', () => {
    const result = calculateBusinessPlan(rentalInput, 2);
    const coc = result.scenarios[1].cocYield;
    expect(coc).toBeGreaterThan(0);
    expect(coc).toBeLessThan(0.10);
  });

  it('שלושה תרחישים בסדר עולה של השבחה', () => {
    const result = calculateBusinessPlan(rentalInput, 2);
    const [pess, avg, opt] = result.scenarios;
    expect(pess.annualAppreciation).toBeLessThanOrEqual(avg.annualAppreciation);
    expect(avg.annualAppreciation).toBeLessThanOrEqual(opt.annualAppreciation);
    expect(pess.totalProfit).toBeLessThanOrEqual(opt.totalProfit);
  });
});

describe('calculateBusinessPlan — מס שבח מקורב', () => {
  it('ללא הפעלה → אין מס (ברירת מחדל, דירה יחידה פטורה)', () => {
    const result = calculateBusinessPlan(rentalInput, 2);
    expect(result.scenarios[1].capitalGainsTax).toBe(0);
  });

  it('בהפעלה → 25% על הרווח מעל בסיס העלות כולל שיפוץ', () => {
    // תרחיש היפוך בהשראת TESTING.md 1.3B: רכישה 1.5M + שיפוץ 200K, מכירה ~2.2M
    const input: BusinessPlanInput = {
      ...rentalInput,
      purchasePrice: 1_500_000,
      sideCosts: 0,
      renovationCost: 200_000,
      mortgageAmount: 0,
      mortgageMonthlyPayment: 0,
      expectedMonthlyRent: 0,
      annualOperatingCosts: 0,
      holdingPeriodYears: 2,
      applyCapitalGainsTax: true,
    };
    // השבחה שנתית שמביאה ל-2.2M בערך: 1.5M×(1+r)^2 = 2.2M → r ≈ 21.1%
    const rate = (Math.sqrt(2_200_000 / 1_500_000) - 1) * 100;
    const result = calculateBusinessPlan(input, rate, { average: rate });
    const scenario = result.scenarios[1];

    const saleValue = scenario.propertyValueAtEnd;
    const sellingCosts = saleValue * 0.02;
    const expectedTax = Math.max(0, saleValue - sellingCosts - 1_700_000) * CAPITAL_GAINS_TAX_RATE;
    expect(scenario.capitalGainsTax).toBeCloseTo(Math.round(expectedTax), -1);
    expect(scenario.capitalGainsTax).toBeGreaterThan(100_000);
  });

  it('המס מקטין את הרווח הכולל', () => {
    const withTax = calculateBusinessPlan({ ...rentalInput, applyCapitalGainsTax: true }, 3);
    const withoutTax = calculateBusinessPlan(rentalInput, 3);
    expect(withTax.scenarios[1].totalProfit).toBeLessThan(withoutTax.scenarios[1].totalProfit);
  });

  it('אין רווח → אין מס', () => {
    const input: BusinessPlanInput = { ...rentalInput, applyCapitalGainsTax: true };
    const result = calculateBusinessPlan(input, 0, { pessimistic: 0, average: 0, optimistic: 0 });
    // ללא השבחה, המכירה נמוכה מבסיס העלות (מחיר + עלויות) → רווח חייב במס = 0
    expect(result.scenarios[0].capitalGainsTax).toBe(0);
  });
});

describe('calculateBusinessPlan — יתרת משכנתא', () => {
  it('יתרה בסוף התקופה נמוכה מהקרן וגדולה מאפס', () => {
    const result = calculateBusinessPlan(rentalInput, 2);
    const projection = result.scenarios[1].yearlyProjection;
    const equityAtEnd = projection[projection.length - 1].equity;
    const valueAtEnd = projection[projection.length - 1].value;
    const balanceAtEnd = valueAtEnd - equityAtEnd;
    expect(balanceAtEnd).toBeGreaterThan(0);
    expect(balanceAtEnd).toBeLessThan(rentalInput.mortgageAmount);
  });
});
