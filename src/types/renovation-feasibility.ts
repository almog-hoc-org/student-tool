export type RenovationInputs = {
  currentValue: number;
  postRenovationValue: number;
  renovationBaseCost: number;
  isForRental: boolean;
  monthlyRentBefore?: number;
  monthlyRentAfter?: number;
};

export type RenovationOutput = {
  totalRenovationCost: number;
  valueUplift: number;
  paperProfit: number;
  rentUpliftYear?: number;
  renovationYield?: number;
  classification: 'Not Worth It' | 'Borderline' | 'Worth Considering' | 'Very Attractive';
};
