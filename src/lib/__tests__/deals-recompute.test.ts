import { describe, it, expect } from "vitest";
import {
  getDealEngineVersion,
  isDealBroken,
  isDealStale,
  recomputeDealSnapshot,
  dealMetricsFromSnapshot,
  type DealSnapshotData,
} from "../deals";
import { BUSINESS_PLAN_ENGINE_VERSION } from "../calculations/business-plan";
import type { Snapshot } from "../snapshots";

const legacyInputs = {
  purchasePrice: 1_250_000,
  sideCosts: 45_000,
  purchaseTax: 100_000,
  renovationCost: 0,
  equityInvested: 400_000,
  mortgageAmount: 850_000,
  mortgageMonthlyPayment: 4_969,
  mortgageInterestRate: 5,
  mortgageYears: 25,
  expectedMonthlyRent: 3_900,
  annualOperatingCosts: 8_000,
  holdingPeriodYears: 10,
  baseAppreciation: 1,
  customRates: { pessimistic: 0, average: 1, optimistic: 2 },
};

describe("גרסת מנוע", () => {
  it("blob בלי חותמת — גרסה 1, נחשב ישן", () => {
    const data: DealSnapshotData = { inputs: legacyInputs, results: { scenarios: [{ label: "בינוני" }] } };
    expect(getDealEngineVersion(data)).toBe(1);
    expect(isDealStale(data)).toBe(true);
  });

  it("blob עם הגרסה הנוכחית — לא ישן", () => {
    const data: DealSnapshotData = {
      inputs: legacyInputs,
      results: { scenarios: [{ label: "בינוני" }] },
      engineVersion: BUSINESS_PLAN_ENGINE_VERSION,
    };
    expect(isDealStale(data)).toBe(false);
  });

  it("blob בלי scenarios — פגום", () => {
    expect(isDealBroken({ inputs: legacyInputs })).toBe(true);
    expect(isDealBroken({ inputs: legacyInputs, results: { scenarios: [] } })).toBe(true);
  });
});

describe("חישוב מחדש", () => {
  it("מייצר 3 תרחישים עם yearlyProjection וחותם את הגרסה הנוכחית", () => {
    const out = recomputeDealSnapshot({ inputs: legacyInputs });
    expect(out).not.toBeNull();
    expect(out!.engineVersion).toBe(BUSINESS_PLAN_ENGINE_VERSION);
    expect(out!.results!.scenarios).toHaveLength(3);
    for (const scenario of out!.results!.scenarios!) {
      expect(scenario.yearlyProjection!.length).toBe(legacyInputs.holdingPeriodYears + 1);
    }
    // מס הרכישה השמור נכנס לעלות העסקה
    expect(out!.results!.totalDealCost).toBe(1_250_000 + 45_000 + 100_000);
  });

  it("inputs חסרים או מחיר אפס — null", () => {
    expect(recomputeDealSnapshot({})).toBeNull();
    expect(recomputeDealSnapshot({ inputs: { purchasePrice: 0 } })).toBeNull();
  });

  it("אחרי recompute — dealMetricsFromSnapshot כבר לא מחזיר null", () => {
    const brokenSnapshot: Snapshot = {
      id: "x", tool_key: "business_plan", name: "ישנה",
      data: { inputs: legacyInputs }, notes: null, created_at: "2026-06-01T10:00:00.000Z",
    };
    expect(dealMetricsFromSnapshot(brokenSnapshot)).toBeNull();

    const fixed: Snapshot = { ...brokenSnapshot, data: recomputeDealSnapshot({ inputs: legacyInputs }) };
    const metrics = dealMetricsFromSnapshot(fixed);
    expect(metrics).not.toBeNull();
    expect(metrics!.scenarioLabel).toBe("בינוני");
    expect(metrics!.purchasePrice).toBe(1_250_000);
  });
});
