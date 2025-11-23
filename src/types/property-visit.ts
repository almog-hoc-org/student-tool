export type PropertyBasicInfo = {
  address: string;
  city: string;
  floor: number;
  totalFloors: number;
  hasElevator: boolean;
  hasParking: boolean;
  hasStorage: boolean;
  directions: string;
  registeredAreaSqm: number;
};

export type PropertyCondition = {
  wallsConditionScore: number;
  dampnessOrMoldScore: number;
  electricityPanelScore: number;
  plumbingScore: number;
  windowsAndInsulationScore: number;
  kitchenConditionScore: number;
  bathroomConditionScore: number;
};

export type PropertyEnvironment = {
  noiseLevelScore: number;
  parkingAvailabilityScore: number;
  publicTransportScore: number;
  proximityToServicesScore: number;
  neighborhoodFeelScore: number;
};

export type PropertyLegalPlanning = {
  hasOfficialDocuments: boolean;
  knownBuildingIrregularities: boolean;
  urbanRenewalPotential: 'none' | 'possible' | 'planned';
};

export type PropertyVisitSummary = {
  overallPropertyScore: number;
  conditionScoreWeighted: number;
  environmentScoreWeighted: number;
  basicFeaturesScoreWeighted: number;
};
