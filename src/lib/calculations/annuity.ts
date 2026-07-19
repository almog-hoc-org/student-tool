// נוסחת אנונה (לוח שפיצר) — מימוש יחיד לכל המחשבונים.

/** החזר חודשי על הלוואה בריבית שנתית קבועה. */
export function monthlyPayment(principal: number, annualRatePct: number, years: number): number {
  if (principal <= 0 || years <= 0) return 0;
  const r = annualRatePct / 100 / 12;
  const n = years * 12;
  if (r === 0) return principal / n;
  return (principal * r) / (1 - Math.pow(1 + r, -n));
}

/** הקרן המקסימלית שהחזר חודשי נתון יכול לשרת. */
export function principalFromPayment(payment: number, annualRatePct: number, years: number): number {
  if (payment <= 0 || years <= 0) return 0;
  const r = annualRatePct / 100 / 12;
  const n = years * 12;
  if (r === 0) return payment * n;
  return (payment * (1 - Math.pow(1 + r, -n))) / r;
}

/** יתרת הקרן אחרי afterYears שנות תשלום. תמיד ≥ 0 — גם כשהתקופה שחלפה ארוכה מתקופת ההלוואה. */
export function remainingBalance(principal: number, annualRatePct: number, years: number, afterYears: number): number {
  if (principal <= 0 || years <= 0) return 0;
  if (afterYears >= years) return 0;
  if (afterYears <= 0) return principal;
  const r = annualRatePct / 100 / 12;
  const n = years * 12;
  const k = afterYears * 12;
  if (r === 0) return principal * (1 - k / n);
  const fn = Math.pow(1 + r, n);
  const fk = Math.pow(1 + r, k);
  return Math.max(0, (principal * (fn - fk)) / (fn - 1));
}
