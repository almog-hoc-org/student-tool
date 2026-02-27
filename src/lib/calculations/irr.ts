// חישוב IRR (Internal Rate of Return) - שיעור תשואה פנימי

/**
 * Calculate IRR using Newton-Raphson method
 * @param cashFlows Array of cash flows, first element is the initial investment (negative)
 * @param guess Initial guess for IRR (default 0.1 = 10%)
 * @param maxIterations Maximum iterations
 * @param tolerance Convergence tolerance
 * @returns IRR as a decimal (e.g., 0.12 = 12%)
 */
export function calculateIRR(
  cashFlows: number[],
  guess: number = 0.1,
  maxIterations: number = 1000,
  tolerance: number = 1e-7
): number | null {
  if (cashFlows.length < 2) return null;

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

    if (Math.abs(derivative) < 1e-10) return null;

    const newRate = rate - npv / derivative;

    if (Math.abs(newRate - rate) < tolerance) {
      return newRate;
    }

    rate = newRate;
  }

  return null; // לא התכנס
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

/**
 * Build cash flows for a flip deal and calculate IRR
 */
export function calculateFlipIRR(params: {
  totalInvestment: number;
  holdingMonths: number; // חודשי החזקה
  monthlyCosts: number; // עלויות חודשיות (משכנתא, ביטוח וכו')
  saleProceeds: number; // תמורת מכירה נטו
}): number | null {
  const { totalInvestment, holdingMonths, monthlyCosts, saleProceeds } = params;

  const cashFlows: number[] = [-totalInvestment];

  for (let month = 1; month <= holdingMonths; month++) {
    if (month === holdingMonths) {
      cashFlows.push(-monthlyCosts + saleProceeds);
    } else {
      cashFlows.push(-monthlyCosts);
    }
  }

  // For monthly cash flows, IRR gives monthly rate; annualize it
  const monthlyIRR = calculateIRR(cashFlows, 0.01);
  if (monthlyIRR === null) return null;

  return Math.pow(1 + monthlyIRR, 12) - 1;
}
