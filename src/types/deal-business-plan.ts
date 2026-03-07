export type DealType = 'rental' | 'flip' | 'ownUse';

export type DealBasicInputs = {
  dealType: DealType;
  purchasePrice: number;
  sideCosts: number;
  renovationCost: number;
  holdingPeriodYears: number;
};

export type DealFinancingInputs = {
  equityInvested: number;
  mortgageAmount: number;
  mortgageMonthlyPayment: number;
  mortgageInterestRate?: number;
};

export type DealRentalInputs = {
  expectedMonthlyRent: number;
  occupancyRate: number;
  annualPropertyTax: number;
  annualInsurance: number;
  annualMaintenance: number;
  annualManagementFees: number;
  otherAnnualCosts: number;
};

export type DealFlipInputs = {
  expectedSalePrice: number;
  saleCosts: number;
};

export type DealBusinessPlanInput = {
  basic: DealBasicInputs;
  financing: DealFinancingInputs;
  rental?: DealRentalInputs;
  flip?: DealFlipInputs;
};

export type DealBusinessPlanOutput = {
  totalDealCost: number;
  netCashflowAnnual?: number;
  cocYield?: number;
  grossProfit?: number;
  roi?: number;
  annualizedRoi?: number;
  classification: 'Weak' | 'Average' | 'Good' | 'Excellent';
};
