/**
 * Compare two snapshot blobs and return a list of human-readable changes
 * for display. Handles nested objects, primitive change detection, and
 * per-field Hebrew labels + value formatters.
 *
 * Designed to be tool-agnostic — accepts any tool_key and either falls back
 * to the raw field name or uses the matching FIELD_META entry for nice
 * presentation.
 */

type Primitive = string | number | boolean;
type Value = Primitive | null | undefined;
type Blob = Record<string, unknown>;

export interface DiffRow {
  /** Dotted path: e.g. "customRates.average" */
  key: string;
  /** Hebrew label for display */
  label: string;
  /** Previously stored value (formatted) */
  before: string;
  /** Currently stored value (formatted) */
  after: string;
  /** Kind: added / removed / changed */
  kind: 'added' | 'removed' | 'changed';
  /** Sentiment direction for numeric increase (helpful for color cues) */
  trend?: 'up' | 'down' | 'neutral';
}

interface FieldMeta {
  label: string;
  format?: (v: Value) => string;
}

const currency = (v: Value): string => {
  if (v == null || v === '') return '—';
  const n = Number(v);
  if (Number.isNaN(n)) return String(v);
  return `₪${n.toLocaleString('he-IL', { maximumFractionDigits: 0 })}`;
};
const percent = (v: Value): string => {
  if (v == null || v === '') return '—';
  const n = Number(v);
  if (Number.isNaN(n)) return String(v);
  return `${n}%`;
};
const years = (v: Value): string => {
  if (v == null || v === '') return '—';
  return `${v} שנים`;
};
const bool = (v: Value): string => (v === true ? 'כן' : v === false ? 'לא' : '—');
const text = (v: Value): string => (v == null || v === '' ? '—' : String(v));

const FIELD_META: Record<string, FieldMeta> = {
  // Budget
  equity: { label: 'הון עצמי', format: currency },
  monthlyIncome: { label: 'הכנסה חודשית', format: currency },
  monthlyObligations: { label: 'התחייבויות חודשיות', format: currency },
  buyerType: {
    label: 'סוג רוכש',
    format: (v) => {
      const m: Record<string, string> = {
        singleApartment: 'דירה יחידה',
        upgradingApartment: 'שיפור דיור',
        investment: 'דירת השקעה',
      };
      return m[String(v)] ?? text(v);
    },
  },
  mortgageYears: { label: 'תקופת משכנתא', format: years },

  // Mortgage
  propertyPrice: { label: 'מחיר נכס', format: currency },
  isOffPlan: { label: 'דירה מקבלן', format: bool },
  madadRate: { label: 'אחוז מדד', format: percent },
  madadYears: { label: 'שנות מדד', format: years },
  'tracks.length': { label: 'מספר מסלולים', format: text },
  'track.principal': { label: 'קרן', format: currency },
  'track.annualInterestRate': { label: 'ריבית שנתית', format: percent },
  'track.years': { label: 'שנים', format: years },
  'track.type': { label: 'סוג מסלול', format: text },
  'track.name': { label: 'שם מסלול', format: text },

  // Business Plan
  purchasePrice: { label: 'מחיר רכישה', format: currency },
  sideCosts: { label: 'עלויות נלוות', format: currency },
  renovationCost: { label: 'עלות שיפוץ', format: currency },
  equityInvested: { label: 'הון מושקע', format: currency },
  mortgageAmount: { label: 'סכום משכנתא', format: currency },
  mortgageMonthlyPayment: { label: 'החזר חודשי', format: currency },
  mortgageInterestRate: { label: 'ריבית משכנתא', format: percent },
  expectedMonthlyRent: { label: 'שכירות צפויה', format: currency },
  annualOperatingCosts: { label: 'עלויות תפעול שנתיות', format: currency },
  holdingPeriodYears: { label: 'תקופת החזקה', format: years },
  baseAppreciation: { label: 'עליית ערך בסיסית', format: percent },
  manualMode: { label: 'מצב ידני', format: bool },
  'customRates.pessimistic': { label: 'תרחיש פסימי', format: percent },
  'customRates.average': { label: 'תרחיש ממוצע', format: percent },
  'customRates.optimistic': { label: 'תרחיש אופטימי', format: percent },
};

function flatten(o: unknown, prefix = ''): Record<string, Value> {
  const out: Record<string, Value> = {};
  if (o == null || typeof o !== 'object') {
    if (prefix) out[prefix] = o as Value;
    return out;
  }
  if (Array.isArray(o)) {
    // Treat arrays specially — surface length + element 0 fields, ignore deeper
    out[`${prefix}.length`] = o.length;
    if (o.length > 0 && typeof o[0] === 'object' && o[0] !== null) {
      Object.assign(out, flatten(o[0], prefix.replace(/s$/, '')));
    }
    return out;
  }
  for (const [k, v] of Object.entries(o)) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (v != null && typeof v === 'object' && !Array.isArray(v)) {
      Object.assign(out, flatten(v, key));
    } else if (Array.isArray(v)) {
      Object.assign(out, flatten(v, key));
    } else {
      out[key] = v as Value;
    }
  }
  return out;
}

function eq(a: Value, b: Value): boolean {
  if (a === b) return true;
  if (a == null && b == null) return true;
  if (typeof a === 'number' && typeof b === 'number') return a === b;
  return String(a) === String(b);
}

function metaFor(key: string): FieldMeta {
  if (FIELD_META[key]) return FIELD_META[key];
  return { label: key, format: text };
}

export function diffSnapshots(before: unknown, after: unknown): DiffRow[] {
  const flatA = flatten(before as Blob);
  const flatB = flatten(after as Blob);
  const keys = new Set([...Object.keys(flatA), ...Object.keys(flatB)]);
  const rows: DiffRow[] = [];

  for (const key of keys) {
    const a = flatA[key];
    const b = flatB[key];
    if (eq(a, b)) continue;
    const meta = metaFor(key);
    const fmt = meta.format ?? text;
    const kind: DiffRow['kind'] =
      a === undefined ? 'added' : b === undefined ? 'removed' : 'changed';

    let trend: DiffRow['trend'] = 'neutral';
    if (typeof a === 'number' && typeof b === 'number') {
      if (b > a) trend = 'up';
      else if (b < a) trend = 'down';
    }

    rows.push({
      key,
      label: meta.label,
      before: fmt(a),
      after: fmt(b),
      kind,
      trend,
    });
  }

  // Stable, label-sorted output
  rows.sort((x, y) => x.label.localeCompare(y.label, 'he'));
  return rows;
}
