import { describe, it, expect } from 'vitest';
import { calculateIRR, calculateRentalIRR } from '../irr';

describe('calculateIRR', () => {
  it('תזרים עם IRR אנליטי ידוע: -100 ואז 110 → 10%', () => {
    const irr = calculateIRR([-100, 110]);
    expect(irr).not.toBeNull();
    expect(irr!).toBeCloseTo(0.10, 6);
  });

  it('-1000 ואז 500×3 שנים → ~23.4%', () => {
    const irr = calculateIRR([-1000, 500, 500, 500]);
    expect(irr).not.toBeNull();
    // אימות: NPV בשיעור שהוחזר צריך להיות ~0
    const npv = -1000 + 500 / (1 + irr!) + 500 / Math.pow(1 + irr!, 2) + 500 / Math.pow(1 + irr!, 3);
    expect(Math.abs(npv)).toBeLessThan(0.01);
  });

  it('פחות משני תזרימים → null', () => {
    expect(calculateIRR([-100])).toBeNull();
    expect(calculateIRR([])).toBeNull();
  });
});

describe('calculateRentalIRR', () => {
  it('עסקה ריאלית מחזירה IRR חיובי סביר', () => {
    const irr = calculateRentalIRR({
      totalInvestment: 400_000,
      annualNetCashflow: 10_000,
      holdingYears: 10,
      exitValue: 1_600_000,
      exitCosts: 1_100_000, // כולל יתרת משכנתא
    });
    expect(irr).not.toBeNull();
    expect(irr!).toBeGreaterThan(0);
    expect(irr!).toBeLessThan(0.25);
  });
});
