import { describe, it, expect } from "vitest";
import { monthlyPayment, principalFromPayment, remainingBalance } from "../annuity";

describe("אנונה — פונקציות הפוכות", () => {
  it("principalFromPayment הופכי ל-monthlyPayment", () => {
    const payment = monthlyPayment(1_000_000, 5, 25);
    expect(principalFromPayment(payment, 5, 25)).toBeCloseTo(1_000_000, 2);
  });

  it("הופכי גם בריבית 0", () => {
    const payment = monthlyPayment(600_000, 0, 20);
    expect(principalFromPayment(payment, 0, 20)).toBeCloseTo(600_000, 6);
  });

  it("קלט לא חיובי — אפס", () => {
    expect(monthlyPayment(-5, 5, 25)).toBe(0);
    expect(principalFromPayment(0, 5, 25)).toBe(0);
  });
});

describe("יתרת קרן", () => {
  it("בתחילת הדרך — הקרן המלאה; בסוף — אפס", () => {
    expect(remainingBalance(1_000_000, 5, 25, 0)).toBe(1_000_000);
    expect(remainingBalance(1_000_000, 5, 25, 25)).toBe(0);
  });

  it("אחרי חצי תקופה עם ריבית — יותר מחצי הקרן נותרה", () => {
    const balance = remainingBalance(1_000_000, 5, 25, 12.5);
    expect(balance).toBeGreaterThan(500_000);
    expect(balance).toBeLessThan(1_000_000);
  });

  it("תקופת החזקה ארוכה מתקופת ההלוואה — אפס, לא שלילי (באג שתוקן)", () => {
    expect(remainingBalance(1_000_000, 5, 25, 30)).toBe(0);
    expect(remainingBalance(1_000_000, 0, 10, 40)).toBe(0);
  });

  it("ריבית 0 — ירידה ליניארית", () => {
    expect(remainingBalance(1_200_000, 0, 10, 5)).toBeCloseTo(600_000, 6);
  });
});
