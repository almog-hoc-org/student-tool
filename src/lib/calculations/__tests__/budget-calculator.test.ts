import { describe, it, expect } from "vitest";
import { calculateBudget, BudgetInput } from "../budget-calculator";
import { FINANCE, getMaxLtv } from "@/lib/constants/financial";

const base: BudgetInput = {
  equity: 500_000,
  monthlyIncome: 20_000,
  currentRent: 0,
  livingExpenses: 0,
  monthlyObligations: 0,
  buyerType: "singleApartment",
  mortgageYears: 25,
};

describe("מחשבון תקציב — כללי", () => {
  it("תרחיש קנוני (הכנסה ₪20K, הון ₪500K, דירה יחידה): תוצאה חיובית ועקבית", () => {
    const out = calculateBudget(base);
    expect(out.maxPropertyValue).toBeGreaterThan(1_000_000);
    expect(out.maxMortgage).toBeLessThanOrEqual(out.maxPropertyValue * getMaxLtv("singleApartment") + 1);
    expect(out.recommendedPropertyValue).toBeLessThanOrEqual(out.maxPropertyValue);
    // ההון העצמי מכסה מס + עלויות + החלק העצמי
    expect(out.netEquityForProperty + out.maxMortgage).toBeGreaterThanOrEqual(out.maxPropertyValue * 0.99);
  });

  it("אפס הכנסה ואפס הון — אפס דירה, בלי NaN", () => {
    const out = calculateBudget({ ...base, equity: 0, monthlyIncome: 0 });
    expect(out.maxPropertyValue).toBe(0);
    expect(Number.isNaN(out.dtiPercent)).toBe(false);
  });
});

describe("תקרת מימון (LTV) לפי סוג רוכש — הבאג המרכזי שתוקן", () => {
  it("משקיע מוגבל ל-50% מימון — המשכנתא לא חורגת", () => {
    const out = calculateBudget({ ...base, buyerType: "additionalApartment", monthlyIncome: 60_000 });
    expect(out.maxMortgage).toBeLessThanOrEqual(out.maxPropertyValue * 0.50 + 1);
  });

  it("תושב חוץ מוגבל ל-50% מימון", () => {
    const out = calculateBudget({ ...base, buyerType: "foreignResident", monthlyIncome: 60_000 });
    expect(out.maxMortgage).toBeLessThanOrEqual(out.maxPropertyValue * 0.50 + 1);
  });

  it("באותם נתונים — משקיע יכול לקנות דירה זולה משמעותית מרוכש דירה יחידה", () => {
    const single = calculateBudget({ ...base, monthlyIncome: 40_000 });
    const investor = calculateBudget({ ...base, buyerType: "additionalApartment", monthlyIncome: 40_000 });
    expect(investor.maxPropertyValue).toBeLessThan(single.maxPropertyValue);
  });
});

describe("תקרת החזר — 40% מההכנסה (DTI)", () => {
  it("ההחזר החודשי לא עובר 40% מההכנסה נטו", () => {
    const out = calculateBudget({ ...base, equity: 5_000_000 }); // הון גדול — התזרים הוא החסם
    expect(out.monthlyPayment).toBeLessThanOrEqual(FINANCE.MAX_DTI * base.monthlyIncome + 1);
  });

  it("dtiPercent נמדד מול הכנסה — לעולם לא ~100% בהמלצת המערכת", () => {
    const out = calculateBudget(base);
    expect(out.dtiPercent).toBeLessThanOrEqual(FINANCE.MAX_DTI * 100 + 0.5);
  });

  it("התחייבויות קיימות מקטינות את תקרת ההחזר", () => {
    const clean = calculateBudget(base);
    const withDebt = calculateBudget({ ...base, monthlyObligations: 4_000 });
    expect(withDebt.maxAffordableMortgagePayment).toBeLessThan(clean.maxAffordableMortgagePayment);
  });

  it("תזרים פנוי נמוך מ-40% מההכנסה — התזרים הוא החסם", () => {
    const out = calculateBudget({ ...base, livingExpenses: 15_000 }); // תזרים פנוי ₪5K < ₪8K
    expect(out.maxAffordableMortgagePayment).toBe(5_000);
  });
});
