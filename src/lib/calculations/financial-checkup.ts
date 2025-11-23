import {
  FinancialCheckupInput,
  FinancialCheckupOutput,
} from '@/types/financial-checkup';

export function calculateFinancialCheckup(
  input: FinancialCheckupInput
): FinancialCheckupOutput {
  const { income, expenses, assets, liabilities, profile } = input;

  // Calculate total income
  const totalIncome =
    income.salary1Net +
    income.salary2Net +
    income.pensionsOrAllowances +
    income.rentalIncome +
    income.businessIncome +
    income.otherIncome;

  // Calculate total expenses
  const totalExpenses =
    expenses.housingCosts +
    expenses.carAndTransport +
    expenses.educationAndChildren +
    expenses.insurance +
    expenses.loanRepayments +
    expenses.foodAndGroceries +
    expenses.leisureAndVacations +
    expenses.otherExpenses;

  const loanPaymentsEstimated = expenses.loanRepayments;
  const freeCashFlow = totalIncome - totalExpenses;

  // Calculate equity components
  const liquidEquity =
    assets.cashAndChecking + assets.shortTermSavings + assets.deposits;

  const semiLiquidEquityEffective = assets.semiLiquidInvestments * 0.8;

  const realEstateBuffer = assets.realEstateMarketValue * 0.1;
  const rawEquity =
    assets.realEstateMarketValue -
    assets.realEstateMortgageBalance -
    realEstateBuffer;
  const realEstateEquityEffective = Math.max(0, rawEquity);

  const availableEquity =
    liquidEquity + semiLiquidEquityEffective + realEstateEquityEffective;

  // Calculate max safe mortgage payment
  const maxByIncome = totalIncome * 0.35;
  const maxByCashFlow = freeCashFlow * 0.8;
  const maxSafeMortgagePayment = Math.max(
    0,
    Math.min(maxByIncome, maxByCashFlow)
  );

  // Calculate readiness score
  const cashFlowRatio = totalIncome > 0 ? freeCashFlow / totalIncome : 0;
  const targetEquity = 300000;
  const equityRatio = targetEquity > 0 ? availableEquity / targetEquity : 0;

  const stabilityFactor =
    profile.riskComfortLevel === 'low'
      ? 0.7
      : profile.riskComfortLevel === 'medium'
      ? 0.85
      : 1.0;

  const normCashFlow = Math.max(0, Math.min(1, cashFlowRatio));
  const normEquity = Math.max(0, Math.min(1, equityRatio));
  const normStability = stabilityFactor;

  const score = 40 * normCashFlow + 40 * normEquity + 20 * normStability;
  const readinessScore = Math.max(0, Math.min(100, score));

  let readinessLabel: FinancialCheckupOutput['readinessLabel'];
  if (readinessScore < 40) readinessLabel = 'Low';
  else if (readinessScore < 70) readinessLabel = 'Medium';
  else readinessLabel = 'High';

  return {
    totalIncome,
    totalExpenses,
    loanPaymentsEstimated,
    freeCashFlow,
    liquidEquity,
    semiLiquidEquityEffective,
    realEstateEquityEffective,
    availableEquity,
    maxSafeMortgagePayment,
    readinessScore,
    readinessLabel,
  };
}
