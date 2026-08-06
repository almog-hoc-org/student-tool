import { describe, it, expect } from "vitest";
import { calculatePurchaseTax } from "../purchase-tax";

// מדרגות מוקפאות 16.1.2025–15.1.2028 (הוראת שעה, חוק ההתייעלות)
describe("מס רכישה — דירה יחידה", () => {
  it("מחיר 0 או שלילי — אפס מס", () => {
    expect(calculatePurchaseTax({ purchasePrice: 0, buyerType: "singleApartment" }).totalTax).toBe(0);
    expect(calculatePurchaseTax({ purchasePrice: -100, buyerType: "singleApartment" }).totalTax).toBe(0);
  });

  it("עד תקרת הפטור (₪1,978,745) — אפס מס", () => {
    expect(calculatePurchaseTax({ purchasePrice: 1_978_745, buyerType: "singleApartment" }).totalTax).toBe(0);
    expect(calculatePurchaseTax({ purchasePrice: 1_500_000, buyerType: "singleApartment" }).totalTax).toBe(0);
  });

  it("שקל אחד מעל הפטור — 3.5% על השקל הזה בלבד", () => {
    const { totalTax } = calculatePurchaseTax({ purchasePrice: 1_978_746, buyerType: "singleApartment" });
    expect(totalTax).toBeCloseTo(0.035, 3);
  });

  it("בדיוק בתקרת מדרגת 3.5% (₪2,347,040)", () => {
    const { totalTax } = calculatePurchaseTax({ purchasePrice: 2_347_040, buyerType: "singleApartment" });
    expect(totalTax).toBeCloseTo((2_347_040 - 1_978_745) * 0.035, 2); // 12,890.325
  });

  it("דירת ₪3M — מדרגות 0/3.5/5 מצטברות", () => {
    const { totalTax } = calculatePurchaseTax({ purchasePrice: 3_000_000, buyerType: "singleApartment" });
    const expected = (2_347_040 - 1_978_745) * 0.035 + (3_000_000 - 2_347_040) * 0.05;
    expect(totalTax).toBeCloseTo(expected, 2); // ≈ 45,538
  });

  it("השיעור האפקטיבי עולה מונוטונית עם המחיר", () => {
    const low = calculatePurchaseTax({ purchasePrice: 2_500_000, buyerType: "singleApartment" });
    const high = calculatePurchaseTax({ purchasePrice: 8_000_000, buyerType: "singleApartment" });
    expect(high.effectiveRate).toBeGreaterThan(low.effectiveRate);
  });
});

describe("מס רכישה — דירה נוספת (משקיע)", () => {
  it("8% מהשקל הראשון עד ₪6,055,070", () => {
    const { totalTax } = calculatePurchaseTax({ purchasePrice: 6_055_070, buyerType: "additionalApartment" });
    expect(totalTax).toBeCloseTo(6_055_070 * 0.08, 2); // 484,405.6
  });

  it("מעל התקרה — 10% על העודף בלבד", () => {
    const { totalTax } = calculatePurchaseTax({ purchasePrice: 7_000_000, buyerType: "additionalApartment" });
    const expected = 6_055_070 * 0.08 + (7_000_000 - 6_055_070) * 0.1;
    expect(totalTax).toBeCloseTo(expected, 2); // ≈ 578,899
  });

  it("דירת ₪2M למשקיע — 8% שטוח = ₪160,000", () => {
    const { totalTax } = calculatePurchaseTax({ purchasePrice: 2_000_000, buyerType: "additionalApartment" });
    expect(totalTax).toBeCloseTo(160_000, 2);
  });
});

describe("מס רכישה — תושב חוץ", () => {
  it("משלם בדיוק כמו משקיע — בלי תוספת 2% (באג שתוקן)", () => {
    for (const price of [1_000_000, 2_500_000, 6_055_070, 9_000_000]) {
      const foreign = calculatePurchaseTax({ purchasePrice: price, buyerType: "foreignResident" });
      const investor = calculatePurchaseTax({ purchasePrice: price, buyerType: "additionalApartment" });
      expect(foreign.totalTax).toBe(investor.totalTax);
    }
  });
});

describe("מס רכישה — משפר דיור", () => {
  it("משפר דיור מקבל מדרגות דירה יחידה — לא 8% מהשקל הראשון", () => {
    const upgrade = calculatePurchaseTax({ purchasePrice: 2_000_000, buyerType: "upgrade" });
    const single = calculatePurchaseTax({ purchasePrice: 2_000_000, buyerType: "singleApartment" });
    const investor = calculatePurchaseTax({ purchasePrice: 2_000_000, buyerType: "additionalApartment" });
    expect(upgrade.totalTax).toBeCloseTo(single.totalTax, 2);
    // הבאג שתוקן: משפר דיור נאלץ להיות "משקיע" ושילם ₪160,000 מיותרים
    expect(investor.totalTax - upgrade.totalTax).toBeGreaterThan(150_000);
  });
});
