export type FinancialCheckupIncome = {
  salary1Net: number;
  salary2Net: number;
  pensionsOrAllowances: number;
  rentalIncome: number;
  businessIncome: number;
  otherIncome: number;
};

export type FinancialCheckupExpenses = {
  housingCosts: number;
  carAndTransport: number;
  educationAndChildren: number;
  insurance: number;
  loanRepayments: number;
  foodAndGroceries: number;
  leisureAndVacations: number;
  otherExpenses: number;
};

export type FinancialCheckupAssets = {
  cashAndChecking: number;
  shortTermSavings: number;
  deposits: number;
  semiLiquidInvestments: number;
  realEstateMarketValue: number;
  realEstateMortgageBalance: number;
};

export type FinancialCheckupLiabilities = {
  consumerLoansBalance: number;
  carLoansBalance: number;
  creditCardDebtsBalance: number;
  familyOrPrivateLoansBalance: number;
};

export type FinancialCheckupProfile = {
  age: number;
  maritalStatus: 'single' | 'married' | 'divorced' | 'other';
  numberOfChildren: number;
  goalType: 'firstHome' | 'investmentProperty' | 'upgradeHome';
  riskComfortLevel: 'low' | 'medium' | 'high';
};

export type FinancialCheckupInput = {
  income: FinancialCheckupIncome;
  expenses: FinancialCheckupExpenses;
  assets: FinancialCheckupAssets;
  liabilities: FinancialCheckupLiabilities;
  profile: FinancialCheckupProfile;
};

export type FinancialCheckupOutput = {
  totalIncome: number;
  totalExpenses: number;
  loanPaymentsEstimated: number;
  freeCashFlow: number;
  liquidEquity: number;
  semiLiquidEquityEffective: number;
  realEstateEquityEffective: number;
  availableEquity: number;
  maxSafeMortgagePayment: number;
  readinessScore: number;
  readinessLabel: 'Low' | 'Medium' | 'High';
};
