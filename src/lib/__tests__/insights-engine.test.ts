import { describe, it, expect, beforeEach, vi } from 'vitest';

// מנתק את שכבת הענן כדי לא לטעון את לקוח Supabase בסביבת node
vi.mock('../cloud-storage', () => ({
  saveToCloud: vi.fn(async () => {}),
  logUsageEvent: vi.fn(async () => {}),
  loadAllFromCloudWithMeta: vi.fn(async () => ({})),
}));

import { generateInsights, hasAnyData } from '../insights-engine';

// localStorage מדומה לסביבת node
function installFakeLocalStorage() {
  const store = new Map<string, string>();
  globalThis.localStorage = {
    getItem: (k: string) => (store.has(k) ? store.get(k)! : null),
    setItem: (k: string, v: string) => { store.set(k, v); },
    removeItem: (k: string) => { store.delete(k); },
    clear: () => store.clear(),
    key: (i: number) => [...store.keys()][i] ?? null,
    get length() { return store.size; },
  } as Storage;
}

function seed(key: string, data: unknown) {
  localStorage.setItem(`tool_${key}`, JSON.stringify(data));
}

beforeEach(() => {
  installFakeLocalStorage();
});

describe('generateInsights — ללא נתונים', () => {
  it('רק תובנות next_step, אין אזהרות', () => {
    const insights = generateInsights();
    expect(insights.length).toBeGreaterThan(0);
    expect(insights.every(i => i.type === 'next_step')).toBe(true);
    expect(hasAnyData()).toBe(false);
  });
});

describe('generateInsights — אזהרות תקציב', () => {
  it('DTI מעל 40% → אזהרה עם toolKey=budget', () => {
    seed('budget', { equity: 400_000, monthlyIncome: 15_000, monthlyObligations: 0, buyerType: 'singleApartment', mortgageYears: 25 });
    seed('budget_results', { freeCashFlow: 10_000, dtiPercent: 45, maxPropertyValue: 1_200_000, purchaseTax: 0, monthlyPayment: 6_750 });

    const warning = generateInsights().find(i => i.title.includes('40%'));
    expect(warning).toBeDefined();
    expect(warning!.type).toBe('warning');
    expect(warning!.toolKey).toBe('budget');
  });

  it('תזרים שלילי → אזהרה בעדיפות גבוהה', () => {
    seed('budget', { equity: 400_000, monthlyIncome: 10_000, monthlyObligations: 12_000, buyerType: 'singleApartment', mortgageYears: 25 });
    seed('budget_results', { freeCashFlow: -2_000, dtiPercent: 0, maxPropertyValue: 500_000, purchaseTax: 0, monthlyPayment: 0 });

    const warning = generateInsights().find(i => i.title === 'תזרים פנוי שלילי');
    expect(warning).toBeDefined();
    expect(warning!.priority).toBe(1);
    expect(warning!.toolKey).toBe('budget');
  });
});

describe('generateInsights — תוכנית עסקית', () => {
  it('שכירות נמוכה מהמשכנתא → אזהרת תזרים עם פורמט ₪ לפני המספר', () => {
    seed('business_plan', { expectedMonthlyRent: 3_000, mortgageMonthlyPayment: 5_000, holdingPeriodYears: 10, purchasePrice: 1_200_000 });

    const warning = generateInsights().find(i => i.title === 'תזרים מזומנים שלילי');
    expect(warning).toBeDefined();
    expect(warning!.toolKey).toBe('business_plan');
    // הקונבנציה: ₪ לפני המספר
    expect(warning!.description).toContain('₪3,000');
    expect(warning!.description).not.toMatch(/\d₪/);
  });
});

describe('generateInsights — מיון', () => {
  it('ממוין לפי עדיפות עולה', () => {
    seed('budget', { equity: 100_000, monthlyIncome: 10_000, monthlyObligations: 12_000, buyerType: 'singleApartment', mortgageYears: 25 });
    seed('budget_results', { freeCashFlow: -2_000, dtiPercent: 0, maxPropertyValue: 400_000, purchaseTax: 10_000, monthlyPayment: 0 });
    seed('business_plan', { expectedMonthlyRent: 3_000, mortgageMonthlyPayment: 5_000, purchasePrice: 1_000_000 });

    const insights = generateInsights();
    for (let i = 1; i < insights.length; i++) {
      expect(insights[i].priority).toBeGreaterThanOrEqual(insights[i - 1].priority);
    }
  });
});
