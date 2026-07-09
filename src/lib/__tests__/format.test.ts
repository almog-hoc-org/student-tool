import { describe, it, expect } from 'vitest';
import { formatCurrency, formatCompactCurrency, formatNumber, formatPercent } from '../format';

describe('formatCurrency', () => {
  it('₪ לפני המספר עם מפריד אלפים', () => {
    const s = formatCurrency(1234567);
    expect(s.startsWith('₪')).toBe(true);
    expect(s).toContain('1');
    expect(s).toContain(','); // he-IL grouping
  });

  it('אפס ושלילי', () => {
    expect(formatCurrency(0)).toBe('₪0');
    expect(formatCurrency(-500).startsWith('₪')).toBe(true);
  });

  it('מעגל שברים', () => {
    expect(formatCurrency(99.6)).toBe('₪100');
  });
});

describe('formatCompactCurrency', () => {
  it('אלפים → K', () => {
    expect(formatCompactCurrency(850_000)).toBe('₪850K');
    expect(formatCompactCurrency(4_500)).toBe('₪4.5K');
  });

  it('מיליונים → M', () => {
    expect(formatCompactCurrency(1_200_000)).toBe('₪1.2M');
    expect(formatCompactCurrency(12_000_000)).toBe('₪12M');
  });

  it('מתחת לאלף — מספר מלא', () => {
    expect(formatCompactCurrency(500)).toBe('₪500');
    expect(formatCompactCurrency(0)).toBe('₪0');
  });

  it('שלילי שומר סימן', () => {
    expect(formatCompactCurrency(-850_000)).toBe('-₪850K');
  });
});

describe('formatNumber', () => {
  it('מפריד אלפים בלי סימן מטבע', () => {
    const s = formatNumber(1234567);
    expect(s).not.toContain('₪');
    expect(s).toContain(',');
  });
});

describe('formatPercent', () => {
  it('מכפיל ב-100 (קלט עשרוני)', () => {
    expect(formatPercent(0.035, 1)).toBe('3.5%');
    expect(formatPercent(0.4, 0)).toBe('40%');
  });
});
