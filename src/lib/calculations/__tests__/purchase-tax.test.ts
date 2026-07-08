import { describe, it, expect } from 'vitest';
import { calculatePurchaseTax } from '../purchase-tax';
import { FIRST_HOME_EXEMPTION_CEILING } from '@/lib/constants/regulations';

describe('calculatePurchaseTax — דירה יחידה (מדרגות מוקפאות 2025-2027)', () => {
  it('מתחת לתקרת הפטור → מס 0', () => {
    const result = calculatePurchaseTax({ purchasePrice: 1_500_000, buyerType: 'singleApartment' });
    expect(result.totalTax).toBe(0);
  });

  it('בדיוק על תקרת הפטור → מס 0', () => {
    const result = calculatePurchaseTax({ purchasePrice: FIRST_HOME_EXEMPTION_CEILING, buyerType: 'singleApartment' });
    expect(result.totalTax).toBe(0);
  });

  it('מעל התקרה → 3.5% רק על החלק שמעל', () => {
    const price = 2_000_000;
    const result = calculatePurchaseTax({ purchasePrice: price, buyerType: 'singleApartment' });
    const expected = (price - FIRST_HOME_EXEMPTION_CEILING) * 0.035;
    expect(result.totalTax).toBeCloseTo(expected, 2);
  });

  it('3M ₪ → מדרגה 1 פטורה, מדרגה 2 ב-3.5%, השאר 5%', () => {
    const result = calculatePurchaseTax({ purchasePrice: 3_000_000, buyerType: 'singleApartment' });
    const expected = (2_347_040 - 1_978_745) * 0.035 + (3_000_000 - 2_347_040) * 0.05;
    expect(result.totalTax).toBeCloseTo(expected, 2);
  });
});

describe('calculatePurchaseTax — דירה נוספת / משקיע', () => {
  it('2M ₪ → 8% מהשקל הראשון', () => {
    const result = calculatePurchaseTax({ purchasePrice: 2_000_000, buyerType: 'additionalApartment' });
    expect(result.totalTax).toBeCloseTo(2_000_000 * 0.08, 2);
  });

  it('7M ₪ → 8% עד 6,055,070 ו-10% מעל', () => {
    const result = calculatePurchaseTax({ purchasePrice: 7_000_000, buyerType: 'additionalApartment' });
    const expected = 6_055_070 * 0.08 + (7_000_000 - 6_055_070) * 0.10;
    expect(result.totalTax).toBeCloseTo(expected, 2);
  });
});

describe('calculatePurchaseTax — תושב חוץ', () => {
  it('משלם כמו משקיע + 2%', () => {
    const investor = calculatePurchaseTax({ purchasePrice: 2_000_000, buyerType: 'additionalApartment' });
    const foreign = calculatePurchaseTax({ purchasePrice: 2_000_000, buyerType: 'foreignResident' });
    expect(foreign.totalTax).toBeCloseTo(investor.totalTax + 2_000_000 * 0.02, 2);
  });
});

describe('calculatePurchaseTax — קצוות', () => {
  it('מחיר 0 או שלילי → מס 0 ולא קורס', () => {
    expect(calculatePurchaseTax({ purchasePrice: 0, buyerType: 'singleApartment' }).totalTax).toBe(0);
    expect(calculatePurchaseTax({ purchasePrice: -100, buyerType: 'singleApartment' }).totalTax).toBe(0);
  });
});
