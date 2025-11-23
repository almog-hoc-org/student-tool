import {
  TransactionCostCalculatorInput,
  TransactionCostCalculatorOutput,
} from '@/types/timelines';

export function calculateTransactionCosts(
  input: TransactionCostCalculatorInput
): TransactionCostCalculatorOutput {
  const estimatedSideCosts = (input.purchasePrice * input.sideCostsPercent) / 100;
  const totalCost = input.purchasePrice + estimatedSideCosts;

  return {
    estimatedSideCosts,
    totalCost,
  };
}
