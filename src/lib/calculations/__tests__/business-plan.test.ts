import { describe, it, expect } from "vitest";
import { calculateBusinessPlan, BusinessPlanInput } from "../business-plan";

const base: BusinessPlanInput = {
  purchasePrice: 1_200_000,
  sideCosts: 40_000,
  renovationCost: 0,
  equityInvested: 400_000,
  mortgageAmount: 800_000,
  mortgageMonthlyPayment: 4_677, // 800K ב-5% ל-25 שנה
  mortgageInterestRate: 5,
  mortgageYears: 25,
  expectedMonthlyRent: 4_000,
  annualOperatingCosts: 8_000,
  holdingPeriodYears: 10,
};

describe("תוכנית עסקית — בסיס", () => {
  it("עלות עסקה = מחיר + עלויות + שיפוץ; השקעה = עלות − משכנתא", () => {
    const out = calculateBusinessPlan(base, 1);
    expect(out.totalDealCost).toBe(1_240_000);
    expect(out.initialInvestment).toBe(440_000);
  });

  it("תזרים שנתי = שכירות − תפעול − החזרי משכנתא", () => {
    const out = calculateBusinessPlan(base, 1);
    expect(out.annualNetCashflow).toBe(4_000 * 12 - 8_000 - 4_677 * 12);
  });

  it("סדר תרחישים: מחמיר ≤ בינוני ≤ טוב (ברווח הכולל)", () => {
    const [pess, avg, opt] = calculateBusinessPlan(base, 2).scenarios;
    expect(pess.totalProfit).toBeLessThanOrEqual(avg.totalProfit);
    expect(avg.totalProfit).toBeLessThanOrEqual(opt.totalProfit);
  });

  it("עלויות גבוהות יותר (מס רכישה) מקטינות את הרווח — הבסיס לתיקון בעמוד", () => {
    const without = calculateBusinessPlan(base, 1);
    const withTax = calculateBusinessPlan({ ...base, sideCosts: base.sideCosts + 96_000 }, 1);
    expect(withTax.scenarios[1].totalProfit).toBeLessThan(without.scenarios[1].totalProfit);
    expect(withTax.initialInvestment).toBe(without.initialInvestment + 96_000);
  });
});

describe("תוכנית עסקית — יתרת משכנתא בתקופת החזקה ארוכה (באג שתוקן)", () => {
  it("החזקה 30 שנה על משכנתא של 25 — היתרה אפס, הרווח לא מנופח", () => {
    const input = { ...base, holdingPeriodYears: 30 };
    const out = calculateBusinessPlan(input, 1);
    for (const scenario of out.scenarios) {
      const lastYear = scenario.yearlyProjection[scenario.yearlyProjection.length - 1];
      // אחרי 30 שנה המשכנתא סגורה — ההון בנכס שווה לערכו המלא
      expect(lastYear.equity).toBe(lastYear.value);
    }
  });
});

describe("תוכנית עסקית — IRR", () => {
  it("IRR קיים וסביר בתרחיש רגיל (בין -50% ל-100%)", () => {
    const out = calculateBusinessPlan(base, 1);
    for (const scenario of out.scenarios) {
      expect(scenario.irr).not.toBeNull();
      expect(scenario.irr!).toBeGreaterThan(-50);
      expect(scenario.irr!).toBeLessThan(100);
    }
  });

  it("עליית ערך גבוהה יותר — IRR גבוה יותר", () => {
    const [pess, , opt] = calculateBusinessPlan(base, 3).scenarios;
    expect(opt.irr!).toBeGreaterThan(pess.irr!);
  });
});
