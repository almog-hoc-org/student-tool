import {
  DealBusinessPlanInput,
  DealBusinessPlanOutput,
} from '@/types/deal-business-plan';

export function calculateDealBusinessPlan(
  input: DealBusinessPlanInput
): DealBusinessPlanOutput {
  const { basic, financing, rental, flip, ownUse } = input;

  const totalDealCost =
    basic.purchasePrice + basic.sideCosts + basic.renovationCost;

  let output: DealBusinessPlanOutput = {
    totalDealCost,
    classification: 'Weak',
  };

  if (basic.dealType === 'rental' && rental) {
    const grossRentYear =
      rental.expectedMonthlyRent * 12 * rental.occupancyRate;
    const annualOperatingCosts =
      rental.annualPropertyTax +
      rental.annualInsurance +
      rental.annualMaintenance +
      rental.annualManagementFees +
      rental.otherAnnualCosts;

    const annualMortgagePayment = financing.mortgageMonthlyPayment * 12;

    const netCashflowAnnual =
      grossRentYear - annualOperatingCosts - annualMortgagePayment;

    const cocYield =
      financing.equityInvested > 0
        ? netCashflowAnnual / financing.equityInvested
        : 0;

    const cocPercent = cocYield * 100;

    let classification: DealBusinessPlanOutput['classification'] = 'Weak';
    if (cocPercent >= 7) classification = 'Excellent';
    else if (cocPercent >= 5) classification = 'Good';
    else if (cocPercent >= 3) classification = 'Average';
    else classification = 'Weak';

    output = {
      ...output,
      netCashflowAnnual,
      cocYield,
      classification,
    };
  }

  if (basic.dealType === 'flip' && flip) {
    const grossProfit = flip.expectedSalePrice - flip.saleCosts - totalDealCost;

    const roi =
      financing.equityInvested > 0 ? grossProfit / financing.equityInvested : 0;

    const annualizedRoi =
      basic.holdingPeriodYears > 0
        ? Math.pow(1 + roi, 1 / basic.holdingPeriodYears) - 1
        : roi;

    const annualRoiPercent = annualizedRoi * 100;

    let classification: DealBusinessPlanOutput['classification'] = 'Weak';
    if (annualRoiPercent >= 15) classification = 'Excellent';
    else if (annualRoiPercent >= 10) classification = 'Good';
    else if (annualRoiPercent >= 5) classification = 'Average';
    else classification = 'Weak';

    output = {
      ...output,
      grossProfit,
      roi,
      annualizedRoi,
      classification,
    };
  }

  if (basic.dealType === 'ownUse' && ownUse) {
    const monthlyOwnershipCost =
      financing.mortgageMonthlyPayment +
      ownUse.monthlyPropertyTax +
      ownUse.monthlyHoaFees +
      ownUse.monthlyMaintenance;

    const alternativeMonthlyRent = ownUse.alternativeMonthlyRent;
    const monthlySavings = alternativeMonthlyRent - monthlyOwnershipCost;

    // Break-even: total extra cost of buying (equity + side costs + renovation)
    // divided by monthly savings. If savings <= 0, no break-even.
    const upfrontExtraCost = financing.equityInvested + basic.sideCosts + basic.renovationCost;
    const breakEvenYears =
      monthlySavings > 0
        ? upfrontExtraCost / (monthlySavings * 12)
        : monthlySavings === 0
        ? Infinity
        : -1; // negative means buying is more expensive monthly

    let classification: DealBusinessPlanOutput['classification'] = 'Weak';
    if (monthlySavings > 0 && breakEvenYears <= 5) classification = 'Excellent';
    else if (monthlySavings > 0 && breakEvenYears <= 10) classification = 'Good';
    else if (monthlySavings > 0) classification = 'Average';
    else classification = 'Weak';

    output = {
      ...output,
      monthlyOwnershipCost,
      alternativeMonthlyRent,
      monthlySavings,
      breakEvenYears: breakEvenYears === Infinity || breakEvenYears < 0 ? undefined : breakEvenYears,
      classification,
    };
  }

  return output;
}
