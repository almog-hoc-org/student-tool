import { describe, it, expect } from "vitest";
import {
  calculateCapitalGainsTax,
  SHEVACH_TAX_RATE,
  SINGLE_APARTMENT_EXEMPTION_CEILING,
} from "../capital-gains";
import { calculateRentalTax, RENTAL_TAX_EXEMPTION_CEILING_MONTHLY } from "../rental-tax";

describe("מס שבח — משקיע (ללא פטור)", () => {
  it("25% על השבח הריאלי — לא על השבח הנומינלי", () => {
    const out = calculateCapitalGainsTax({
      purchasePrice: 1_200_000,
      salePrice: 1_800_000,
      holdingYears: 10,
      annualInflationPercent: 2.5,
      isExemptSingleApartment: false,
    });
    // בסיס מוצמד: 1.2M × 1.025^10 ≈ 1,536,101 → שבח ריאלי ≈ 263,899
    expect(out.nominalGain).toBe(600_000);
    expect(out.realGain).toBeLessThan(out.nominalGain);
    expect(out.tax).toBeCloseTo(out.taxableRealGain * SHEVACH_TAX_RATE, 0);
    expect(out.tax).toBeGreaterThan(0);
  });

  it("ניכויים מוכרים (מס רכישה, עלויות, שיפוץ) מקטינים את השבח", () => {
    const bare = calculateCapitalGainsTax({
      purchasePrice: 1_200_000,
      salePrice: 1_800_000,
      holdingYears: 5,
    });
    const withDeductions = calculateCapitalGainsTax({
      purchasePrice: 1_200_000,
      acquisitionCosts: 120_000,
      improvementCosts: 100_000,
      salePrice: 1_800_000,
      holdingYears: 5,
    });
    expect(withDeductions.tax).toBeLessThan(bare.tax);
  });

  it("שבח ריאלי שלילי (ירידת ערך) — אפס מס, בלי NaN", () => {
    const out = calculateCapitalGainsTax({
      purchasePrice: 2_000_000,
      salePrice: 1_800_000,
      holdingYears: 5,
    });
    expect(out.tax).toBe(0);
    expect(out.taxableRealGain).toBe(0);
  });
});

describe("מס שבח — פטור דירה יחידה", () => {
  it("מכירה מתחת לתקרה — פטור מלא", () => {
    const out = calculateCapitalGainsTax({
      purchasePrice: 1_500_000,
      salePrice: 2_500_000,
      holdingYears: 8,
      isExemptSingleApartment: true,
    });
    expect(out.tax).toBe(0);
    expect(out.exemptionApplied).toBe(true);
    expect(out.exemptionCapExceeded).toBe(false);
  });

  it("מכירה מעל התקרה — חיוב יחסי על העודף בלבד", () => {
    const salePrice = SINGLE_APARTMENT_EXEMPTION_CEILING + 1_000_000;
    const out = calculateCapitalGainsTax({
      purchasePrice: 3_000_000,
      salePrice,
      holdingYears: 10,
      isExemptSingleApartment: true,
    });
    expect(out.exemptionCapExceeded).toBe(true);
    expect(out.tax).toBeGreaterThan(0);
    // החיוב היחסי קטן מחיוב מלא
    const full = calculateCapitalGainsTax({
      purchasePrice: 3_000_000,
      salePrice,
      holdingYears: 10,
      isExemptSingleApartment: false,
    });
    expect(out.tax).toBeLessThan(full.tax);
  });
});

describe("מס על שכירות למגורים", () => {
  it("עד תקרת הפטור — אפס מס", () => {
    const out = calculateRentalTax(RENTAL_TAX_EXEMPTION_CEILING_MONTHLY);
    expect(out.monthlyTax).toBe(0);
    expect(out.effectiveTrack).toBe("exempt");
  });

  it("מעל התקרה — 10% על מלוא המחזור", () => {
    const out = calculateRentalTax(8_000);
    expect(out.monthlyTax).toBe(800);
    expect(out.annualTax).toBe(9_600);
    expect(out.effectiveTrack).toBe("flat10");
  });

  it("שכירות אפס — אפס מס", () => {
    expect(calculateRentalTax(0).annualTax).toBe(0);
  });
});
