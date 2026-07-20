import { describe, it, expect } from "vitest";
import { rankDeals, assessDeal, type DealMetricsInput } from "../deal-ranking";

function makeDeal(overrides: Partial<DealMetricsInput> = {}): DealMetricsInput {
  return {
    snapshotId: "s1",
    name: "עסקה",
    scenarioLabel: "בינוני",
    monthlyCashflow: 500,
    cocYield: 0.04,
    irr: 0.05,
    totalProfit: 300_000,
    totalEquityReturn: 0.6,
    initialInvestment: 500_000,
    purchasePrice: 1_500_000,
    equityInvested: 500_000,
    mortgageAmount: 1_000_000,
    mortgageMonthlyPayment: 5_800,
    expectedMonthlyRent: 6_500,
    holdingPeriodYears: 10,
    buyerType: "singleApartment",
    pessimisticTotalProfit: 50_000,
    ...overrides,
  };
}

describe("ציון עסקה בודדת", () => {
  it("ציון בגבולות 0-100 וכל הרכיבים בגבולות", () => {
    const a = assessDeal(makeDeal());
    expect(a.score).toBeGreaterThanOrEqual(0);
    expect(a.score).toBeLessThanOrEqual(100);
    for (const v of Object.values(a.components)) {
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThanOrEqual(100);
    }
  });

  it("עסקה בודדת מקבלת כותרת הערכה, לא השוואה", () => {
    const r = rankDeals([makeDeal({ name: "דירה בחיפה" })]);
    expect(r.isSingleDeal).toBe(true);
    expect(r.headline).toContain("דירה בחיפה");
    expect(r.headline).toContain(`${r.winner!.score}/100`);
  });

  it("רשימה ריקה — בלי winner ובלי כותרת", () => {
    const r = rankDeals([]);
    expect(r.ranked).toHaveLength(0);
    expect(r.winner).toBeNull();
    expect(r.headline).toBe("");
  });
});

describe("קנסות סיכון וחוזקות", () => {
  it("תזרים שלילי — קנס + ניסוח סיכון", () => {
    const good = assessDeal(makeDeal());
    const bad = assessDeal(makeDeal({ monthlyCashflow: -1_500 }));
    expect(bad.components.risk).toBeLessThan(good.components.risk);
    expect(bad.risks.some((r) => r.includes("תזרים חודשי שלילי"))).toBe(true);
  });

  it("חריגה מתקרת LTV חוקית (משקיע מעל 50%) — קנס 30 + אזהרת בנק ישראל", () => {
    const a = assessDeal(makeDeal({
      buyerType: "additionalApartment",
      mortgageAmount: 1_100_000, // 73% מ-1.5M — מעל תקרת 50% למשקיע
    }));
    expect(a.risks.some((r) => r.includes("בנק ישראל"))).toBe(true);
    expect(a.components.risk).toBeLessThanOrEqual(70);
  });

  it("IRR null — fallback ל-CoC, דגל, וקנס קטן", () => {
    const a = assessDeal(makeDeal({ irr: null, cocYield: 0.04 }));
    expect(a.irrUnavailable).toBe(true);
    expect(a.components.irr).toBe(50); // 4% מתוך עוגן 8%
    expect(a.risks.some((r) => r.includes("IRR"))).toBe(true);
  });

  it("הפסד בתרחיש מחמיר — סיכון; רווח בו — חוזקה", () => {
    const losing = assessDeal(makeDeal({ pessimisticTotalProfit: -80_000 }));
    const safe = assessDeal(makeDeal({ pessimisticTotalProfit: 10_000 }));
    expect(losing.risks.some((r) => r.includes("מחמיר"))).toBe(true);
    expect(safe.strengths.some((s) => s.includes("מחמיר"))).toBe(true);
  });

  it("תזרים גבוה — חוזקה עם הסכום", () => {
    const a = assessDeal(makeDeal({ monthlyCashflow: 1_200 }));
    expect(a.strengths.some((s) => s.includes("1,200"))).toBe(true);
  });
});

describe("דירוג והעדפות", () => {
  // עסקת תזרים: תזרים מצוין, רווח סופי צנוע
  const cashflowDeal = makeDeal({
    snapshotId: "cf", name: "עסקת תזרים",
    monthlyCashflow: 1_400, cocYield: 0.06, irr: 0.045,
    totalProfit: 150_000, totalEquityReturn: 0.3, pessimisticTotalProfit: 20_000,
  });
  // עסקת רווח: תזרים שלילי קל, רווח סופי גדול
  const profitDeal = makeDeal({
    snapshotId: "pf", name: "עסקת השבחה",
    monthlyCashflow: -300, cocYield: 0.01, irr: 0.085,
    totalProfit: 900_000, totalEquityReturn: 1.5, pessimisticTotalProfit: 100_000,
  });

  it("העדפת תזרים מנצחת את עסקת התזרים; העדפת טווח ארוך הופכת את הסדר", () => {
    const byCashflow = rankDeals([cashflowDeal, profitDeal], "cashflow");
    const byLongterm = rankDeals([cashflowDeal, profitDeal], "longterm");
    expect(byCashflow.winner!.snapshotId).toBe("cf");
    expect(byLongterm.winner!.snapshotId).toBe("pf");
  });

  it("כותרת השוואה כוללת את שתי העסקאות והציונים", () => {
    const r = rankDeals([cashflowDeal, profitDeal]);
    expect(r.headline).toContain(r.ranked[0].name);
    expect(r.headline).toContain(r.ranked[1].name);
    expect(r.headline).toContain(`${r.ranked[0].score}/100`);
  });

  it("שוויון מלא — שובר שוויון דטרמיניסטי לפי שם", () => {
    const a = makeDeal({ snapshotId: "a", name: "אלף" });
    const b = makeDeal({ snapshotId: "b", name: "בית" });
    const r1 = rankDeals([a, b]);
    const r2 = rankDeals([b, a]);
    expect(r1.ranked.map((x) => x.snapshotId)).toEqual(r2.ranked.map((x) => x.snapshotId));
  });

  it("rank רציף מ-1", () => {
    const r = rankDeals([cashflowDeal, profitDeal, makeDeal({ snapshotId: "m", name: "ממוצעת" })]);
    expect(r.ranked.map((x) => x.rank)).toEqual([1, 2, 3]);
  });
});
