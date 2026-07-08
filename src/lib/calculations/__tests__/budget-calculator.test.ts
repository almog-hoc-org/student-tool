import { describe, it, expect } from 'vitest';
import { calculateBudget, getMaxLtv } from '../budget-calculator';
import { BOI_LIMITS } from '@/lib/constants/regulations';

const base = {
  equity: 500_000,
  monthlyIncome: 20_000,
  currentRent: 0,
  livingExpenses: 0,
  monthlyObligations: 2_000,
  mortgageYears: 25,
};

describe('getMaxLtv — מגבלות מימון בנק ישראל', () => {
  it('דירה יחידה 75%, משקיע ותושב חוץ 50%', () => {
    expect(getMaxLtv('singleApartment')).toBe(0.75);
    expect(getMaxLtv('additionalApartment')).toBe(0.50);
    expect(getMaxLtv('foreignResident')).toBe(0.50);
  });
});

describe('calculateBudget — תקרת DTI 40%', () => {
  it('התזרים הפנוי גבוה → ההחזר נתקע על 40% מההכנסה הפנויה', () => {
    // הכנסה 20K, התחייבויות 2K → הכנסה פנויה 18K → תקרה 7,200
    const result = calculateBudget({ ...base, buyerType: 'singleApartment' });
    expect(result.dtiCapAmount).toBe(7_200);
    expect(result.maxAffordableMortgagePayment).toBe(7_200);
    expect(result.paymentCapSource).toBe('dti');
    expect(result.warnings).toContain('DTI_CAPPED');
  });

  it('תזרים פנוי נמוך מהתקרה → התזרים הוא החסם', () => {
    const result = calculateBudget({
      ...base,
      currentRent: 5_000,
      livingExpenses: 9_000,
      buyerType: 'singleApartment',
    });
    // תזרים פנוי: 20K − 5K − 9K − 2K = 4K < תקרת 7.2K
    expect(result.maxAffordableMortgagePayment).toBe(4_000);
    expect(result.paymentCapSource).toBe('cashflow');
    expect(result.warnings).not.toContain('DTI_CAPPED');
  });

  it('תזרים שלילי → החזר 0 ואזהרה', () => {
    const result = calculateBudget({
      ...base,
      livingExpenses: 25_000,
      buyerType: 'singleApartment',
    });
    expect(result.maxAffordableMortgagePayment).toBe(0);
    expect(result.warnings).toContain('NEGATIVE_CASHFLOW');
    expect(result.maxPropertyValue).toBeGreaterThanOrEqual(0);
  });

  it('dtiPercent מחושב מול ההכנסה הפנויה ולא עולה על 40%', () => {
    const result = calculateBudget({ ...base, buyerType: 'singleApartment' });
    expect(result.dtiPercent).toBeLessThanOrEqual(40 + 1e-6);
  });
});

describe('calculateBudget — LTV לפי סוג רוכש', () => {
  it('משקיע עם 500K הון עצמי מוגבל לנכס בסביבות 900K-1M (הון 50%), לא ~2M', () => {
    const result = calculateBudget({
      ...base,
      monthlyIncome: 100_000, // תזרים לא חוסם — בודקים רק את חסם ההון
      buyerType: 'additionalApartment',
    });
    expect(result.maxLtv).toBe(BOI_LIMITS.LTV_INVESTOR);
    // הון 500K פחות מס רכישה (8%) ועלויות (4%) חייב לכסות 50% מהמחיר
    expect(result.maxPropertyValue).toBeLessThan(1_050_000);
    expect(result.maxPropertyValue).toBeGreaterThan(700_000);
  });

  it('אותם נתונים כדירה יחידה → תקציב גבוה משמעותית מהמשקיע', () => {
    const single = calculateBudget({ ...base, monthlyIncome: 100_000, buyerType: 'singleApartment' });
    const investor = calculateBudget({ ...base, monthlyIncome: 100_000, buyerType: 'additionalApartment' });
    expect(single.maxPropertyValue).toBeGreaterThan(investor.maxPropertyValue * 1.4);
  });
});

describe('calculateBudget — כללי', () => {
  it('ריבית מותאמת אישית משנה את התוצאה', () => {
    const at5 = calculateBudget({ ...base, buyerType: 'singleApartment' });
    const at7 = calculateBudget({ ...base, buyerType: 'singleApartment', interestRate: 7 });
    expect(at7.maxMortgageByCashflow).toBeLessThan(at5.maxMortgageByCashflow);
  });

  it('הכנסה אפס → לא קורס ותוצאות לא שליליות', () => {
    const result = calculateBudget({ ...base, monthlyIncome: 0, buyerType: 'singleApartment' });
    expect(result.maxAffordableMortgagePayment).toBe(0);
    expect(result.maxPropertyValue).toBeGreaterThanOrEqual(0);
    expect(Number.isFinite(result.dtiPercent)).toBe(true);
  });

  it('ההמלצה היא 90% מהמקסימום', () => {
    const result = calculateBudget({ ...base, buyerType: 'singleApartment' });
    expect(result.recommendedPropertyValue).toBeLessThanOrEqual(result.maxPropertyValue);
    expect(result.recommendedPropertyValue).toBeGreaterThanOrEqual(result.maxPropertyValue * 0.88);
  });
});
