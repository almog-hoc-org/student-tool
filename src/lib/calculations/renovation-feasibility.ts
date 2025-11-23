import {
  RenovationInputs,
  RenovationOutput,
} from '@/types/renovation-feasibility';

export function calculateRenovationFeasibility(
  input: RenovationInputs
): RenovationOutput {
  const contingency = 0.15;
  const totalRenovationCost = input.renovationBaseCost * (1 + contingency);
  const valueUplift = input.postRenovationValue - input.currentValue;
  const paperProfit = valueUplift - totalRenovationCost;

  let output: RenovationOutput = {
    totalRenovationCost,
    valueUplift,
    paperProfit,
    classification: 'Not Worth It',
  };

  if (
    input.isForRental &&
    input.monthlyRentBefore != null &&
    input.monthlyRentAfter != null
  ) {
    const rentUpliftYear = (input.monthlyRentAfter - input.monthlyRentBefore) * 12;
    const renovationYield =
      totalRenovationCost > 0 ? rentUpliftYear / totalRenovationCost : undefined;

    output.rentUpliftYear = rentUpliftYear;
    output.renovationYield = renovationYield;

    // Classification for rental
    if ((renovationYield ?? 0) < 0.04 && paperProfit <= 0) {
      output.classification = 'Not Worth It';
    } else if ((renovationYield ?? 0) >= 0.04 && (renovationYield ?? 0) < 0.07) {
      output.classification = 'Worth Considering';
    } else if ((renovationYield ?? 0) >= 0.07 && paperProfit > 0) {
      output.classification = 'Very Attractive';
    } else if (paperProfit > 0) {
      output.classification = 'Borderline';
    }
  } else {
    // Classification for non-rental based on paper profit
    if (paperProfit <= 0) {
      output.classification = 'Not Worth It';
    } else if (paperProfit < totalRenovationCost * 0.2) {
      output.classification = 'Borderline';
    } else if (paperProfit < totalRenovationCost * 0.5) {
      output.classification = 'Worth Considering';
    } else {
      output.classification = 'Very Attractive';
    }
  }

  return output;
}
