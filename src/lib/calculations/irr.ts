// חישוב IRR (Internal Rate of Return) - שיעור תשואה פנימי

/**
 * Calculate IRR using Newton-Raphson method
 * @param cashFlows Array of cash flows, first element is the initial investment (negative)
 * @param guess Initial guess for IRR (default 0.1 = 10%)
 * @param maxIterations Maximum iterations
 * @param tolerance Convergence tolerance
 * @returns IRR as a decimal (e.g., 0.12 = 12%)
 */
function npvAt(cashFlows: number[], rate: number): number {
  let npv = 0;
  for (let j = 0; j < cashFlows.length; j++) {
    npv += cashFlows[j] / Math.pow(1 + rate, j);
  }
  return npv;
}

/**
 * חיפוש שורש בחצייה — fallback יציב כשניוטון-רפסון מתבדר או מתכנס
 * לשורש חסר משמעות (rate ≤ ‑100%).
 */
function bisectionIRR(cashFlows: number[], tolerance: number): number | null {
  // סריקה לאיתור חילוף סימן בטווח כלכלי סביר: (‑99%, 1000%)
  let lo = -0.99;
  let hi = 10;
  let npvLo = npvAt(cashFlows, lo);
  let found = false;
  for (let r = -0.9; r <= hi + 1e-9; r += 0.1) {
    const v = npvAt(cashFlows, r);
    if ((npvLo <= 0 && v >= 0) || (npvLo >= 0 && v <= 0)) {
      hi = r;
      found = true;
      break;
    }
    lo = r;
    npvLo = v;
  }
  if (!found) return null;

  for (let i = 0; i < 200; i++) {
    const mid = (lo + hi) / 2;
    const v = npvAt(cashFlows, mid);
    if (Math.abs(v) < tolerance || hi - lo < tolerance) return mid;
    if ((npvLo <= 0 && v >= 0) || (npvLo >= 0 && v <= 0)) {
      hi = mid;
    } else {
      lo = mid;
      npvLo = v;
    }
  }
  return (lo + hi) / 2;
}

export function calculateIRR(
  cashFlows: number[],
  guess: number = 0.1,
  maxIterations: number = 1000,
  tolerance: number = 1e-7
): number | null {
  if (cashFlows.length < 2) return null;

  // IRR מוגדר רק כשיש תזרים בשני הכיוונים (השקעה + תקבולים)
  const hasNegative = cashFlows.some((c) => c < 0);
  const hasPositive = cashFlows.some((c) => c > 0);
  if (!hasNegative || !hasPositive) return null;

  let rate = guess;

  for (let i = 0; i < maxIterations; i++) {
    let npv = 0;
    let derivative = 0;

    for (let j = 0; j < cashFlows.length; j++) {
      const denominator = Math.pow(1 + rate, j);
      npv += cashFlows[j] / denominator;
      if (j > 0) {
        derivative -= (j * cashFlows[j]) / Math.pow(1 + rate, j + 1);
      }
    }

    if (Math.abs(derivative) < 1e-10) break;

    const newRate = rate - npv / derivative;

    // ניוטון ברח מתחום ההגדרה — עוברים לחצייה במקום להחזיר שורש חסר משמעות
    if (!Number.isFinite(newRate) || newRate <= -1) break;

    if (Math.abs(newRate - rate) < tolerance) {
      return newRate;
    }

    rate = newRate;
  }

  return bisectionIRR(cashFlows, tolerance);
}

/**
 * Build cash flows for a rental deal and calculate IRR
 */
export function calculateRentalIRR(params: {
  totalInvestment: number; // סך ההשקעה (הון עצמי)
  annualNetCashflow: number; // תזרים נטו שנתי
  holdingYears: number; // שנות החזקה
  exitValue: number; // שווי מכירה בסוף התקופה (0 אם לא רלוונטי)
  exitCosts: number; // עלויות מכירה
}): number | null {
  const { totalInvestment, annualNetCashflow, holdingYears, exitValue, exitCosts } = params;

  const cashFlows: number[] = [-totalInvestment];

  for (let year = 1; year <= holdingYears; year++) {
    if (year === holdingYears && exitValue > 0) {
      cashFlows.push(annualNetCashflow + exitValue - exitCosts);
    } else {
      cashFlows.push(annualNetCashflow);
    }
  }

  return calculateIRR(cashFlows);
}

