export type UrbanRenewalPhase = {
  order: number;
  name: string;
  typicalDurationText: string;
  keyActivities: string[];
  mainRisks: string[];
  valueCreationPointsForResidents: string[];
  valueCreationPointsForInvestors: string[];
};

export type UrbanRenewalTimeline = UrbanRenewalPhase[];

export type TransactionStep = {
  order: number;
  name: string;
  description: string;
  typicalTimingText: string;
  typicalCostsDescription: string;
};

export type TransactionTimeline = TransactionStep[];

export type TransactionCostCalculatorInput = {
  purchasePrice: number;
  sideCostsPercent: number;
};

export type TransactionCostCalculatorOutput = {
  estimatedSideCosts: number;
  totalCost: number;
};
