import type { Snapshot } from './snapshots';
import type { BuyerType } from './calculations/purchase-tax';
import type { DealMetricsInput } from './deal-ranking';
import { BUSINESS_PLAN_ENGINE_VERSION, calculateBusinessPlan } from './calculations/business-plan';

export type DealScenarioFilter = 'all' | 'מחמיר' | 'בינוני' | 'טוב';

/** תרחיש ברירת המחדל להשוואה ולדירוג */
export const DEFAULT_SCENARIO = 'בינוני';

export type DealInputs = Record<string, unknown> & {
  purchasePrice?: number;
  equityInvested?: number;
  mortgageAmount?: number;
  mortgageMonthlyPayment?: number;
  expectedMonthlyRent?: number;
  holdingPeriodYears?: number;
  buyerType?: BuyerType;
  purchaseTax?: number;
  propertyArea?: string;
  propertySqm?: number;
  propertyFloor?: string;
  propertyRooms?: string;
  propertyNotes?: string;
  listingUrl?: string;
};

export type DealScenario = {
  label?: string;
  annualAppreciation?: number;
  propertyValueAtEnd?: number;
  totalProfit?: number;
  cocYield?: number;
  irr?: number | null;
  totalEquityReturn?: number;
  yearlyProjection?: Array<{ year: number; value: number; equity: number }>;
};

export type DealSnapshotData = {
  inputs?: DealInputs;
  results?: {
    monthlyCashflow?: number;
    initialInvestment?: number;
    totalDealCost?: number;
    annualNetCashflow?: number;
    scenarios?: DealScenario[];
  };
  /** גרסת מנוע החישוב שיצרה את התוצאות; חסר = 1 (לפני מס רכישה בתוכנית) */
  engineVersion?: number;
};

export interface DealRow {
  id: string;
  snapshotId: string;
  selected: boolean;
  name: string;
  createdAt: string;
  scenarioLabel: string;
  annualAppreciation: number;
  purchasePrice: number;
  equityInvested: number;
  mortgageAmount: number;
  mortgageMonthlyPayment: number;
  expectedMonthlyRent: number;
  monthlyCashflow: number;
  cocYield: number;
  irr: number | null;
  totalProfit: number;
  propertyValueAtEnd: number;
  holdingPeriodYears: number;
  notes: string | null;
  propertyArea: string;
  propertySqm: number;
  propertyFloor: string;
  propertyRooms: string;
  pricePerSqm: number;
}

export interface DealSummary {
  id: string;
  name: string;
  createdAt: string;
  purchasePrice: number;
  propertyArea: string;
  propertySqm: number;
  pricePerSqm: number;
  scenarioCount: number;
  bestMonthlyCashflow: number;
  bestTotalProfit: number;
}

function asNumber(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}

function asText(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function maxOrZero(values: number[]): number {
  return values.length > 0 ? Math.max(...values) : 0;
}

export function getDealSnapshotData(snapshot: Snapshot): DealSnapshotData {
  return (snapshot.data as DealSnapshotData | null) ?? {};
}

/** גרסת המנוע שחישבה את העסקה; blob ישן בלי חותמת = 1 */
export function getDealEngineVersion(data: DealSnapshotData): number {
  return typeof data.engineVersion === 'number' ? data.engineVersion : 1;
}

export function isDealStale(data: DealSnapshotData): boolean {
  return getDealEngineVersion(data) < BUSINESS_PLAN_ENGINE_VERSION;
}

/** לעסקה יש שורות להצגה? (בלי scenarios היא הייתה נעלמת בשקט מהטבלה) */
export function isDealBroken(data: DealSnapshotData): boolean {
  return !Array.isArray(data.results?.scenarios) || data.results.scenarios.length === 0;
}

/**
 * חישוב מחדש של עסקה מה-inputs השמורים עם המנוע הנוכחי — בדיוק באותו
 * נתיב כמו עמוד התוכנית העסקית. מס הרכישה השמור לא מחושב מחדש (ההקשר
 * שבו נשמרה העסקה מנצח). מחזיר null כשאין מספיק נתונים.
 */
export function recomputeDealSnapshot(data: DealSnapshotData): DealSnapshotData | null {
  const inputs = data.inputs;
  const purchasePrice = asNumber(inputs?.purchasePrice);
  if (!inputs || purchasePrice <= 0) return null;

  const upliftMode = inputs.urbanRenewalUpliftMode;
  const upliftValue = asNumber(inputs.urbanRenewalUpliftValue);
  const effectiveUplift = upliftMode === 'percent'
    ? Math.max(0, purchasePrice * (upliftValue / 100))
    : Math.max(0, upliftValue);
  const customRates = (inputs.customRates ?? undefined) as
    | { pessimistic?: number; average?: number; optimistic?: number }
    | undefined;

  const results = calculateBusinessPlan(
    {
      purchasePrice,
      sideCosts: asNumber(inputs.sideCosts) + asNumber(inputs.purchaseTax),
      renovationCost: asNumber(inputs.renovationCost),
      equityInvested: asNumber(inputs.equityInvested),
      mortgageAmount: asNumber(inputs.mortgageAmount),
      mortgageMonthlyPayment: asNumber(inputs.mortgageMonthlyPayment),
      mortgageInterestRate: asNumber(inputs.mortgageInterestRate),
      mortgageYears: asNumber(inputs.mortgageYears),
      expectedMonthlyRent: asNumber(inputs.expectedMonthlyRent),
      annualOperatingCosts: asNumber(inputs.annualOperatingCosts),
      holdingPeriodYears: asNumber(inputs.holdingPeriodYears),
      urbanRenewalUpliftAmount: effectiveUplift,
      urbanRenewalUpliftPercent: upliftMode === 'percent' ? upliftValue : undefined,
    },
    asNumber(inputs.baseAppreciation),
    customRates,
  );

  return { inputs, results, engineVersion: BUSINESS_PLAN_ENGINE_VERSION };
}

export function rowsFromDealSnapshot(snapshot: Snapshot): DealRow[] {
  const data = getDealSnapshotData(snapshot);
  const inputs = data.inputs ?? {};
  const results = data.results;
  const scenarios = Array.isArray(results?.scenarios) ? results.scenarios : [];
  const purchasePrice = asNumber(inputs.purchasePrice);
  const propertySqm = asNumber(inputs.propertySqm);

  return scenarios.map((scenario, index) => ({
    id: `${snapshot.id}-${index}`,
    snapshotId: snapshot.id,
    selected: true,
    name: snapshot.name,
    createdAt: snapshot.created_at,
    scenarioLabel: scenario.label ?? `תרחיש ${index + 1}`,
    annualAppreciation: asNumber(scenario.annualAppreciation),
    purchasePrice,
    equityInvested: asNumber(inputs.equityInvested),
    mortgageAmount: asNumber(inputs.mortgageAmount),
    mortgageMonthlyPayment: asNumber(inputs.mortgageMonthlyPayment),
    expectedMonthlyRent: asNumber(inputs.expectedMonthlyRent),
    monthlyCashflow: asNumber(results?.monthlyCashflow),
    cocYield: asNumber(scenario.cocYield),
    irr: typeof scenario.irr === 'number' ? scenario.irr : null,
    totalProfit: asNumber(scenario.totalProfit),
    propertyValueAtEnd: asNumber(scenario.propertyValueAtEnd),
    holdingPeriodYears: asNumber(inputs.holdingPeriodYears),
    notes: snapshot.notes,
    propertyArea: asText(inputs.propertyArea),
    propertySqm,
    propertyFloor: asText(inputs.propertyFloor),
    propertyRooms: asText(inputs.propertyRooms),
    pricePerSqm: purchasePrice > 0 && propertySqm > 0 ? Math.round(purchasePrice / propertySqm) : 0,
  }));
}

/**
 * מדדי עסקה לתרחיש קבוע — הקלט של מנוע הדירוג.
 * מחזיר null כשאין תרחישים (עסקה פגומה) — כדי שהיא תוצג כאזהרה, לא תיעלם.
 */
export function dealMetricsFromSnapshot(
  snapshot: Snapshot,
  scenarioLabel: string = DEFAULT_SCENARIO,
): DealMetricsInput | null {
  const data = getDealSnapshotData(snapshot);
  const inputs = data.inputs ?? {};
  const scenarios = Array.isArray(data.results?.scenarios) ? data.results.scenarios : [];
  if (scenarios.length === 0) return null;

  // התרחיש המבוקש; אם לא נמצא — האמצעי (בינוני בסדר השמור), ואם אין — הראשון
  const scenario =
    scenarios.find((s) => s.label === scenarioLabel)
    ?? scenarios[Math.min(1, scenarios.length - 1)];
  const pessimistic = scenarios.find((s) => s.label === 'מחמיר') ?? scenarios[0];

  const initialInvestment = asNumber(data.results?.initialInvestment);
  const totalProfit = asNumber(scenario.totalProfit);
  const storedEquityReturn = scenario.totalEquityReturn;

  return {
    snapshotId: snapshot.id,
    name: snapshot.name,
    scenarioLabel: scenario.label ?? scenarioLabel,
    monthlyCashflow: asNumber(data.results?.monthlyCashflow),
    cocYield: asNumber(scenario.cocYield),
    irr: typeof scenario.irr === 'number' ? scenario.irr : null,
    totalProfit,
    totalEquityReturn:
      typeof storedEquityReturn === 'number' && Number.isFinite(storedEquityReturn)
        ? storedEquityReturn
        : initialInvestment > 0 ? totalProfit / initialInvestment : 0,
    initialInvestment,
    purchasePrice: asNumber(inputs.purchasePrice),
    equityInvested: asNumber(inputs.equityInvested),
    mortgageAmount: asNumber(inputs.mortgageAmount),
    mortgageMonthlyPayment: asNumber(inputs.mortgageMonthlyPayment),
    expectedMonthlyRent: asNumber(inputs.expectedMonthlyRent),
    holdingPeriodYears: asNumber(inputs.holdingPeriodYears),
    buyerType: inputs.buyerType,
    pessimisticTotalProfit:
      typeof pessimistic?.totalProfit === 'number' ? pessimistic.totalProfit : undefined,
  };
}

export function getDealSummary(snapshot: Snapshot): DealSummary {
  const rows = rowsFromDealSnapshot(snapshot);
  const first = rows[0];
  return {
    id: snapshot.id,
    name: snapshot.name,
    createdAt: snapshot.created_at,
    purchasePrice: first?.purchasePrice ?? 0,
    propertyArea: first?.propertyArea ?? '',
    propertySqm: first?.propertySqm ?? 0,
    pricePerSqm: first?.pricePerSqm ?? 0,
    scenarioCount: rows.length,
    bestMonthlyCashflow: maxOrZero(rows.map((row) => row.monthlyCashflow)),
    bestTotalProfit: maxOrZero(rows.map((row) => row.totalProfit)),
  };
}
