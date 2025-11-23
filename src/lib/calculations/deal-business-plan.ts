import {
  DealBusinessPlanInput,
  DealBusinessPlanOutput,
} from '@/types/deal-business-plan';

export function calculateDealBusinessPlan(
  input: DealBusinessPlanInput
): DealBusinessPlanOutput {
  const { basic, financing, rental, flip } = input;

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

  return output;
}
