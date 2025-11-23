import {
  PropertyBasicInfo,
  PropertyCondition,
  PropertyEnvironment,
  PropertyLegalPlanning,
  PropertyVisitSummary,
} from '@/types/property-visit';

export function scoreProperty(
  basicInfo: PropertyBasicInfo,
  condition: PropertyCondition,
  env: PropertyEnvironment,
  legal: PropertyLegalPlanning
): PropertyVisitSummary {
  // Condition score (40%)
  const conditionValues = Object.values(condition);
  const conditionAvg =
    conditionValues.reduce((a, b) => a + b, 0) / conditionValues.length;
  const conditionScoreWeighted = conditionAvg * 4;

  // Environment score (30%)
  const envValues = Object.values(env);
  const envAvg = envValues.reduce((a, b) => a + b, 0) / envValues.length;
  const environmentScoreWeighted = envAvg * 3;

  // Basic features score (30%)
  let basicScore = 0;
  if (basicInfo.hasElevator) basicScore += 10;
  if (basicInfo.hasParking) basicScore += 10;
  if (basicInfo.hasStorage) basicScore += 5;
  if (basicInfo.floor <= 2) basicScore += 5;

  const basicFeaturesScoreWeighted = Math.min(basicScore, 30);

  const overallPropertyScore =
    conditionScoreWeighted +
    environmentScoreWeighted +
    basicFeaturesScoreWeighted;

  return {
    overallPropertyScore,
    conditionScoreWeighted,
    environmentScoreWeighted,
    basicFeaturesScoreWeighted,
  };
}
