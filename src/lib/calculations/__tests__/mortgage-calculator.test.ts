import { describe, it, expect } from 'vitest';
import {
  calculateMortgage,
  calculateMortgageMonthlyPayment,
  generateAmortizationSchedule,
  sensitivityAnalysis,
  validateMortgageMix,
} from '../mortgage-calculator';
import type { MortgageTrack } from '@/types/mortgage-calculator';

function track(overrides: Partial<MortgageTrack> & { principal: number; annualInterestRate: number }): MortgageTrack {
  return {
    id: Math.random().toString(36).slice(2),
    name: 'מסלול',
    type: 'fixedUnlinked',
    years: 25,
    ...overrides,
  };
}

describe('calculateMortgageMonthlyPayment', () => {
  // TESTING.md 1.2A
  it('1M @ 3% / 25 שנים → ~4,742 ₪', () => {
    const payment = calculateMortgageMonthlyPayment(1_000_000, 3, 25);
    expect(payment).toBeGreaterThan(4_735);
    expect(payment).toBeLessThan(4_750);
  });

  // TESTING.md 1.2B
  it('ריבית 0% → קרן חלקי חודשים בדיוק', () => {
    expect(calculateMortgageMonthlyPayment(1_000_000, 0, 25)).toBeCloseTo(1_000_000 / 300, 6);
  });

  it('קרן אפס או שנים אפס → 0', () => {
    expect(calculateMortgageMonthlyPayment(0, 3, 25)).toBe(0);
    expect(calculateMortgageMonthlyPayment(1_000_000, 3, 0)).toBe(0);
  });
});

describe('calculateMortgage', () => {
  // TESTING.md 1.2C
  it('שני מסלולים שווים 3% ו-2% → ממוצע משוקלל 2.5%', () => {
    const result = calculateMortgage({
      tracks: [
        track({ principal: 500_000, annualInterestRate: 3 }),
        track({ principal: 500_000, annualInterestRate: 2 }),
      ],
    });
    expect(result.weightedAverageInterest).toBeCloseTo(2.5, 10);
  });

  it('סך ריבית 1M @ 3% / 25 שנים > 400,000', () => {
    const result = calculateMortgage({
      tracks: [track({ principal: 1_000_000, annualInterestRate: 3 })],
    });
    expect(result.totalInterestPaid).toBeGreaterThan(400_000);
  });

  // TESTING.md 1.2D — תרחיש ישראלי ריאליסטי
  it('תמהיל ישראלי: החזר 5,000-8,000 ₪, ממוצע 2-3%', () => {
    const result = calculateMortgage({
      tracks: [
        track({ principal: 400_000, annualInterestRate: 3.5, years: 20 }),
        track({ principal: 400_000, annualInterestRate: 2.5, years: 25, type: 'fixedLinked' }),
        track({ principal: 200_000, annualInterestRate: 1.5, years: 10, type: 'prime' }),
      ],
    });
    expect(result.totalMonthlyPayment).toBeGreaterThan(5_000);
    expect(result.totalMonthlyPayment).toBeLessThan(8_000);
    expect(result.weightedAverageInterest).toBeGreaterThan(2);
    expect(result.weightedAverageInterest).toBeLessThan(3);
  });
});

describe('generateAmortizationSchedule', () => {
  it('סך תשלומי הקרן שווה בקירוב לסך הקרן', () => {
    const tracks = [
      track({ principal: 800_000, annualInterestRate: 3.5, years: 20 }),
      track({ principal: 200_000, annualInterestRate: 5.5, years: 10, type: 'prime' }),
    ];
    const rows = generateAmortizationSchedule(tracks);
    const totalPrincipalPaid = rows.reduce((sum, r) => sum + r.principalPayment, 0);
    expect(totalPrincipalPaid).toBeGreaterThan(999_000);
    expect(totalPrincipalPaid).toBeLessThan(1_001_000);
    expect(rows[rows.length - 1].remainingBalance).toBe(0);
  });
});

describe('sensitivityAnalysis', () => {
  it('ההחזר עולה מונוטונית עם הריבית', () => {
    const tracks = [track({ principal: 1_000_000, annualInterestRate: 4 })];
    const results = sensitivityAnalysis(tracks);
    for (let i = 1; i < results.length; i++) {
      expect(results[i].totalMonthlyPayment).toBeGreaterThan(results[i - 1].totalMonthlyPayment);
    }
  });
});

describe('validateMortgageMix — תקרת פריים של בנק ישראל', () => {
  it('70% פריים → חריגה', () => {
    const result = validateMortgageMix([
      track({ principal: 700_000, annualInterestRate: 5.5, type: 'prime' }),
      track({ principal: 300_000, annualInterestRate: 3.5 }),
    ]);
    expect(result.primeShare).toBeCloseTo(0.7, 10);
    expect(result.primeExceedsCap).toBe(true);
  });

  it('66% פריים בדיוק → אין חריגה', () => {
    const result = validateMortgageMix([
      track({ principal: 660_000, annualInterestRate: 5.5, type: 'prime' }),
      track({ principal: 340_000, annualInterestRate: 3.5 }),
    ]);
    expect(result.primeExceedsCap).toBe(false);
  });

  it('ללא מסלולים → 0 ואין חריגה', () => {
    const result = validateMortgageMix([]);
    expect(result.primeShare).toBe(0);
    expect(result.primeExceedsCap).toBe(false);
  });
});
