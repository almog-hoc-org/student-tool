import type { Snapshot } from './snapshots';

export type DealScenarioFilter = 'all' | 'מחמיר' | 'בינוני' | 'טוב';

export type DealInputs = Record<string, unknown> & {
  purchasePrice?: number;
  equityInvested?: number;
  mortgageAmount?: number;
  mortgageMonthlyPayment?: number;
  expectedMonthlyRent?: number;
  holdingPeriodYears?: number;
  propertyArea?: string;
  propertySqm?: number;
  propertyFloor?: string;
  propertyRooms?: string;
  propertyNotes?: string;
};

export type DealSnapshotData = {
  inputs?: DealInputs;
  results?: {
    monthlyCashflow?: number;
    scenarios?: Array<{
      label?: string;
      annualAppreciation?: number;
      propertyValueAtEnd?: number;
      totalProfit?: number;
      cocYield?: number;
      irr?: number | null;
    }>;
  };
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
