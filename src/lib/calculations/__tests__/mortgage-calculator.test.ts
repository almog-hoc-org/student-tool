import { describe, it, expect } from "vitest";
import {
  calculateMortgageMonthlyPayment,
  calculateMortgage,
  generateAmortizationSchedule,
  sensitivityAnalysis,
} from "../mortgage-calculator";

describe("החזר חודשי (אנונה/שפיצר)", () => {
  it("₪1M ב-5% ל-25 שנה ≈ ₪5,845.9 (ערך ידני)", () => {
    expect(calculateMortgageMonthlyPayment(1_000_000, 5, 25)).toBeCloseTo(5845.9, 0);
  });

  it("ריבית 0% — חלוקה שווה של הקרן", () => {
    expect(calculateMortgageMonthlyPayment(1_200_000, 0, 10)).toBeCloseTo(10_000, 6);
  });

  it("קרן 0 או תקופה 0 — החזר 0", () => {
    expect(calculateMortgageMonthlyPayment(0, 5, 25)).toBe(0);
    expect(calculateMortgageMonthlyPayment(1_000_000, 5, 0)).toBe(0);
  });

  it("סך התשלומים גדול מהקרן כשיש ריבית", () => {
    const payment = calculateMortgageMonthlyPayment(800_000, 4, 20);
    expect(payment * 240).toBeGreaterThan(800_000);
  });
});

describe("תמהיל משכנתא", () => {
  const tracks = [
    { id: "a", name: "קבועה", type: "fixedUnlinked" as const, principal: 600_000, annualInterestRate: 5, years: 25 },
    { id: "b", name: "פריים", type: "prime" as const, principal: 400_000, annualInterestRate: 4, years: 25 },
  ];

  it("ריבית משוקללת לפי גודל קרן", () => {
    const { weightedAverageInterest } = calculateMortgage({ tracks });
    expect(weightedAverageInterest).toBeCloseTo(0.6 * 5 + 0.4 * 4, 6); // 4.6
  });

  it("ההחזר הכולל = סכום החזרי המסלולים", () => {
    const out = calculateMortgage({ tracks });
    const sum = out.tracks.reduce((s, t) => s + t.monthlyPayment, 0);
    expect(out.totalMonthlyPayment).toBeCloseTo(sum, 6);
  });

  it("תמהיל ריק — אפסים בלי NaN", () => {
    const out = calculateMortgage({ tracks: [] });
    expect(out.totalMonthlyPayment).toBe(0);
    expect(out.weightedAverageInterest).toBe(0);
  });
});

describe("לוח סילוקין", () => {
  it("היתרה בסוף התקופה — אפס", () => {
    const rows = generateAmortizationSchedule([
      { id: "a", name: "קבועה", type: "fixedUnlinked", principal: 300_000, annualInterestRate: 3.5, years: 20 },
    ]);
    expect(rows).toHaveLength(20);
    expect(rows[rows.length - 1].remainingBalance).toBe(0);
  });

  it("היתרה יורדת מונוטונית", () => {
    const rows = generateAmortizationSchedule([
      { id: "a", name: "קבועה", type: "fixedUnlinked", principal: 500_000, annualInterestRate: 4.5, years: 15 },
    ]);
    for (let i = 1; i < rows.length; i++) {
      expect(rows[i].remainingBalance).toBeLessThan(rows[i - 1].remainingBalance);
    }
  });
});

describe("ניתוח רגישות", () => {
  it("מסלול פריים — ריבית גבוהה יותר, החזר גבוה יותר", () => {
    const results = sensitivityAnalysis([
      { id: "a", name: "פריים", type: "prime", principal: 1_000_000, annualInterestRate: 5, years: 25 },
    ]);
    for (let i = 1; i < results.length; i++) {
      expect(results[i].totalMonthlyPayment).toBeGreaterThan(results[i - 1].totalMonthlyPayment);
    }
  });

  it("ריבית קבועה נעולה חוזית — לא זזה בתרחישי ריבית (באג שתוקן)", () => {
    const results = sensitivityAnalysis([
      { id: "a", name: "קבועה", type: "fixedUnlinked", principal: 1_000_000, annualInterestRate: 5, years: 25 },
    ]);
    const payments = results.map((r) => r.totalMonthlyPayment);
    for (const p of payments) {
      expect(p).toBeCloseTo(payments[0], 6);
    }
  });

  it("תמהיל מעורב — רק חלק הפריים זז", () => {
    const mixed = sensitivityAnalysis([
      { id: "a", name: "קבועה", type: "fixedUnlinked" as const, principal: 600_000, annualInterestRate: 5, years: 25 },
      { id: "b", name: "פריים", type: "prime" as const, principal: 400_000, annualInterestRate: 5, years: 25 },
    ]);
    const allPrime = sensitivityAnalysis([
      { id: "b", name: "פריים", type: "prime" as const, principal: 1_000_000, annualInterestRate: 5, years: 25 },
    ]);
    const mixedDelta = mixed[mixed.length - 1].totalMonthlyPayment - mixed[0].totalMonthlyPayment;
    const primeDelta = allPrime[allPrime.length - 1].totalMonthlyPayment - allPrime[0].totalMonthlyPayment;
    expect(mixedDelta).toBeLessThan(primeDelta);
    expect(mixedDelta).toBeGreaterThan(0);
  });
});

describe("הצמדה למדד במסלולים צמודים", () => {
  it("מסלול צמוד יקר יותר מלא-צמוד באותה ריבית (באג שתוקן — תומחרו זהה)", () => {
    const unlinked = calculateMortgage({
      tracks: [{ id: "a", name: "קלצ", type: "fixedUnlinked", principal: 1_000_000, annualInterestRate: 3.2, years: 25 }],
    });
    const linked = calculateMortgage({
      tracks: [{ id: "a", name: "קצ", type: "fixedLinked", principal: 1_000_000, annualInterestRate: 3.2, years: 25 }],
    });
    expect(linked.totalInterestPaid).toBeGreaterThan(unlinked.totalInterestPaid);
    expect(linked.totalLinkageCost!).toBeGreaterThan(0);
    expect(unlinked.totalLinkageCost).toBe(0);
  });

  it("במדד 0% — צמוד ולא-צמוד זהים", () => {
    const unlinked = calculateMortgage(
      { tracks: [{ id: "a", name: "קלצ", type: "fixedUnlinked", principal: 500_000, annualInterestRate: 4, years: 20 }] },
      { annualCpiRate: 0 },
    );
    const linked = calculateMortgage(
      { tracks: [{ id: "a", name: "קצ", type: "fixedLinked", principal: 500_000, annualInterestRate: 4, years: 20 }] },
      { annualCpiRate: 0 },
    );
    expect(linked.totalInterestPaid).toBeCloseTo(unlinked.totalInterestPaid, 6);
  });

  it("קלצ 5% מול צמודה 3.2% במדד 2.5% — הצמודה כבר לא בהכרח זולה", () => {
    const kalatz = calculateMortgage({
      tracks: [{ id: "a", name: "קלצ", type: "fixedUnlinked", principal: 1_000_000, annualInterestRate: 5, years: 25 }],
    });
    const tzmuda = calculateMortgage({
      tracks: [{ id: "a", name: "קצ", type: "fixedLinked", principal: 1_000_000, annualInterestRate: 3.2, years: 25 }],
    });
    // סך העלות של הצמודה עם הצמדה קרוב לקלצ — הפער האמיתי קטן בהרבה
    // מהפער שהוצג כשהצמדה לא תומחרה בכלל
    const gapWithoutLinkage = kalatz.totalInterestPaid - (tzmuda.totalInterestPaid - tzmuda.totalLinkageCost!);
    const gapWithLinkage = kalatz.totalInterestPaid - tzmuda.totalInterestPaid;
    expect(gapWithLinkage).toBeLessThan(gapWithoutLinkage);
  });

  it("לוח סילוקין של מסלול צמוד נסגר לאפס בסוף התקופה", () => {
    const rows = generateAmortizationSchedule([
      { id: "a", name: "קצ", type: "fixedLinked", principal: 300_000, annualInterestRate: 3.5, years: 20 },
    ]);
    expect(rows[rows.length - 1].remainingBalance).toBe(0);
  });
});
