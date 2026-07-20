import { describe, it, expect, vi, beforeEach } from "vitest";

// ענן מדומה — נשלט מכל בדיקה
const cloudStore: Record<string, { data: unknown; updated_at: string }> = {};
const savedToCloud: Array<{ key: string; data: unknown }> = [];

vi.mock("../cloud-storage", () => ({
  saveToCloud: vi.fn(async (_uid: string, key: string, data: unknown) => {
    savedToCloud.push({ key, data });
    cloudStore[key] = { data, updated_at: new Date().toISOString() };
  }),
  loadAllFromCloudWithMeta: vi.fn(async () => ({ ...cloudStore })),
  logUsageEvent: vi.fn(async () => {}),
}));

// localStorage מדומה לסביבת node
function stubLocalStorage() {
  const store = new Map<string, string>();
  const ls = {
    getItem: (k: string) => (store.has(k) ? store.get(k)! : null),
    setItem: (k: string, v: string) => void store.set(k, v),
    removeItem: (k: string) => void store.delete(k),
    key: (i: number) => [...store.keys()][i] ?? null,
    get length() { return store.size; },
    clear: () => store.clear(),
  };
  vi.stubGlobal("localStorage", ls);
  return ls;
}

import { save, load, clearAllLocal, syncOnLogin, syncToCloud } from "../storage";

beforeEach(() => {
  stubLocalStorage();
  for (const k of Object.keys(cloudStore)) delete cloudStore[k];
  savedToCloud.length = 0;
});

describe("סנכרון בהתחברות — החדש מנצח", () => {
  it("ענן חדש יותר — דורס מקומי ישן (הבאג שתוקן: היה הפוך)", async () => {
    save("budget", { equity: 100 });
    // מדמים שהענן עודכן אחרי השמירה המקומית
    cloudStore["budget"] = { data: { equity: 999 }, updated_at: new Date(Date.now() + 60_000).toISOString() };
    await syncOnLogin("u1");
    expect(load<{ equity: number }>("budget")!.equity).toBe(999);
  });

  it("מקומי חדש יותר — נדחף לענן", async () => {
    cloudStore["budget"] = { data: { equity: 1 }, updated_at: new Date(Date.now() - 60_000).toISOString() };
    save("budget", { equity: 500 });
    await syncOnLogin("u1");
    expect(load<{ equity: number }>("budget")!.equity).toBe(500);
    expect(savedToCloud.some((s) => s.key === "budget" && (s.data as { equity: number }).equity === 500)).toBe(true);
  });

  it("קיים רק בענן — נמשך למקומי (מכשיר חדש)", async () => {
    cloudStore["mortgage"] = { data: { total: 800_000 }, updated_at: new Date().toISOString() };
    await syncOnLogin("u1");
    expect(load<{ total: number }>("mortgage")!.total).toBe(800_000);
  });

  it("קיים רק מקומית — נדחף לענן", async () => {
    save("property_check", { price: 1_500_000 });
    await syncOnLogin("u1");
    expect(cloudStore["property_check"]).toBeDefined();
  });

  it("מקומי ישן ללא חותמת זמן (מלפני השדרוג) — הענן מנצח", async () => {
    localStorage.setItem("tool_budget", JSON.stringify({ equity: 111 })); // בלי meta
    cloudStore["budget"] = { data: { equity: 777 }, updated_at: new Date(Date.now() - 3_600_000).toISOString() };
    await syncOnLogin("u1");
    expect(load<{ equity: number }>("budget")!.equity).toBe(777);
  });
});

describe("ניקוי בהתנתקות", () => {
  it("clearAllLocal מוחק את כל נתוני הכלים ואת המטא", () => {
    save("budget", { equity: 100 });
    save("mortgage", { total: 500 });
    localStorage.setItem("unrelated", "keep-me");
    clearAllLocal();
    expect(load("budget")).toBeNull();
    expect(load("mortgage")).toBeNull();
    expect(localStorage.getItem("tool__meta")).toBeNull();
    expect(localStorage.getItem("unrelated")).toBe("keep-me");
  });

  it("syncToCloud דוחף את כל המפתחות המקומיים, לא רשימה קשיחה", async () => {
    save("budget", { a: 1 });
    save("some_new_tool", { b: 2 });
    await syncToCloud("u1");
    expect(cloudStore["budget"]).toBeDefined();
    expect(cloudStore["some_new_tool"]).toBeDefined();
  });
});
