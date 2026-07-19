import { describe, it, expect } from "vitest";
import { calculateSideCosts, getDefaultSideCostsInput, quickSideCostsEstimate, TABU_REGISTRATION_FEE } from "../side-costs";

describe("עלויות נלוות — דירת ₪1.8M עם ברירות מחדל", () => {
  const out = quickSideCostsEstimate(1_800_000);
  const item = (name: string) => out.items.find((i) => i.name.includes(name));

  it("עורך דין: 0.5% + מע\"מ 18%", () => {
    expect(item("עורך דין")!.amount).toBe(Math.round(1_800_000 * 0.005 * 1.18)); // 10,620
  });

  it("תיווך: 2% + מע\"מ 18%", () => {
    expect(item("תיווך")!.amount).toBe(Math.round(1_800_000 * 0.02 * 1.18)); // 42,480
  });

  it("טאבו: אגרה קבועה, לא אחוז מהמחיר (באג שתוקן — היה ₪9,000)", () => {
    expect(item("טאבו")!.amount).toBe(TABU_REGISTRATION_FEE);
    expect(item("טאבו")!.amount).toBeLessThan(2_000);
  });

  it("הסכום הכולל = סכום הפריטים", () => {
    expect(out.totalSideCosts).toBe(out.items.reduce((s, i) => s + i.amount, 0));
  });
});

describe("עלויות נלוות — אפשרויות", () => {
  it("בלי תיווך — אין פריט תיווך", () => {
    const input = { ...getDefaultSideCostsInput(2_000_000), includeBroker: false };
    const out = calculateSideCosts(input);
    expect(out.items.find((i) => i.name.includes("תיווך"))).toBeUndefined();
  });

  it("שמאי יקר יותר מעל ₪3M", () => {
    const cheap = quickSideCostsEstimate(2_000_000).items.find((i) => i.name.includes("שמאי"))!;
    const expensive = quickSideCostsEstimate(4_000_000).items.find((i) => i.name.includes("שמאי"))!;
    expect(expensive.amount).toBeGreaterThan(cheap.amount);
  });
});
