import { describe, it, expect } from "vitest";
import { buildQuickDealSnapshot, suggestedEquity } from "../quick-deal";
import { calculateBusinessPlan } from "../calculations/business-plan";
import { calculatePurchaseTax } from "../calculations/purchase-tax";
import { businessPlanSideCostsPreset } from "../calculations/side-costs";
import { monthlyPayment } from "../calculations/annuity";

const base = {
  name: "דירת מבחן",
  purchasePrice: 1_500_000,
  expectedMonthlyRent: 4_800,
  equityInvested: 750_000,
  buyerType: "additionalApartment" as const,
};

describe("הוספה מהירה — parity מול נתיב התוכנית העסקית", () => {
  it("התוצאות זהות deep-equal לחישוב ידני באותו נתיב", () => {
    const built = buildQuickDealSnapshot(base)!;
    const tax = Math.round(calculatePurchaseTax({ purchasePrice: base.purchasePrice, buyerType: base.buyerType }).totalTax);
    const sideCosts = Math.round(businessPlanSideCostsPreset(base.purchasePrice, { broker: true, mortgageAdvice: true, lawyer: true, appraiser: true, extras: true }));
    const mortgage = base.purchasePrice - base.equityInvested;
    const expected = calculateBusinessPlan(
      {
        purchasePrice: base.purchasePrice,
        sideCosts: sideCosts + tax,
        renovationCost: 0,
        equityInvested: base.equityInvested,
        mortgageAmount: mortgage,
        mortgageMonthlyPayment: Math.round(monthlyPayment(mortgage, 5, 25)),
        mortgageInterestRate: 5,
        mortgageYears: 25,
        expectedMonthlyRent: base.expectedMonthlyRent,
        annualOperatingCosts: 8000,
        holdingPeriodYears: 10,
      },
      1,
      { pessimistic: 0, average: 1, optimistic: 2 },
    );
    expect(built.data.results).toEqual(expected);
  });

  it("ה-inputs מכילים את כל המפתחות שהתוכנית העסקית שומרת (round-trip לעריכה)", () => {
    const built = buildQuickDealSnapshot(base)!;
    // סט המפתחות של getData ב-BusinessPlan.tsx — עדכן כאן אם הטופס משתנה
    const bpKeys = [
      "purchasePrice", "propertyArea", "propertySqm", "propertyFloor", "propertyRooms",
      "propertyNotes", "buyerType", "purchaseTax", "sideCosts", "renovationCost",
      "equityInvested", "mortgageAmount", "mortgageMonthlyPayment", "mortgageInterestRate",
      "mortgageYears", "expectedMonthlyRent", "annualOperatingCosts", "holdingPeriodYears",
      "baseAppreciation", "customRates", "urbanRenewalUpliftMode", "urbanRenewalUpliftValue",
      "manualMortgageAmount", "manualMortgageMonthlyPayment", "useSideCostPreset", "selectedSideCosts",
    ];
    for (const key of bpKeys) {
      expect(built.data.inputs, `חסר המפתח ${key}`).toHaveProperty(key);
    }
  });

  it("מס רכישה של משקיע נכלל: 8% מ-1.5M = 120,000 בעלות העסקה", () => {
    const built = buildQuickDealSnapshot(base)!;
    expect(built.data.inputs.purchaseTax).toBe(120_000);
    const sideCosts = built.data.inputs.sideCosts as number;
    expect(built.data.results.totalDealCost).toBe(1_500_000 + sideCosts + 120_000);
  });

  it("חריגת LTV (הון עצמי קטן מדי למשקיע) — אזהרה רכה, לא חסימה", () => {
    const built = buildQuickDealSnapshot({ ...base, equityInvested: 300_000 })!; // 80% מימון
    expect(built).not.toBeNull();
    expect(built.warnings.some((w) => w.key === "ltv_exceeded")).toBe(true);
  });

  it("קלט לא תקין — null", () => {
    expect(buildQuickDealSnapshot({ ...base, purchasePrice: 0 })).toBeNull();
    expect(buildQuickDealSnapshot({ ...base, name: "  " })).toBeNull();
    expect(buildQuickDealSnapshot({ ...base, expectedMonthlyRent: 0 })).toBeNull();
  });

  it("suggestedEquity — המינימום החוקי לפי סוג רוכש", () => {
    expect(suggestedEquity(1_000_000, "singleApartment")).toBe(250_000);
    expect(suggestedEquity(1_000_000, "additionalApartment")).toBe(500_000);
  });

  it("engineVersion נחתם", () => {
    const built = buildQuickDealSnapshot(base)!;
    expect(built.data.engineVersion).toBeGreaterThanOrEqual(2);
  });
});
