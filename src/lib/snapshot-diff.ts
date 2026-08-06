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
  /**
   * האם עלייה בערך היא חיובית עבור התלמיד? (שכירות ↑ = טוב, מחיר ↑ = רע)
   * משמש לצבעי המגמה — לפני זה עליית מחיר נצבעה ירוק.
   */
  upIsGood?: boolean | null;
}

interface FieldMeta {
  label: string;
  format?: (v: Value) => string;
  /** true = עלייה טובה; false = עלייה רעה; undefined = ניטרלי */
  upIsGood?: boolean;
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
  equity: { label: 'הון עצמי', format: currency, upIsGood: true },
  monthlyIncome: { label: 'הכנסה חודשית', format: currency, upIsGood: true },
  monthlyObligations: { label: 'התחייבויות חודשיות', format: currency, upIsGood: false },
  buyerType: {
    label: 'סוג רוכש',
    format: (v) => {
      const m: Record<string, string> = {
        singleApartment: 'דירה יחידה',
        upgrade: 'משפר דיור',
        additionalApartment: 'דירה נוספת / משקיע',
        foreignResident: 'תושב חוץ',
      };
      return m[String(v)] ?? text(v);
    },
  },
  mortgageYears: { label: 'תקופת משכנתא', format: years },

  // Mortgage
  propertyPrice: { label: 'מחיר נכס', format: currency, upIsGood: false },
  isOffPlan: { label: 'דירה מקבלן', format: bool },
  madadRate: { label: 'אחוז מדד', format: percent },
  madadYears: { label: 'שנות מדד', format: years },
  'tracks.length': { label: 'מספר מסלולים', format: text },
  'track.principal': { label: 'קרן', format: currency },
  'track.annualInterestRate': { label: 'ריבית שנתית', format: percent, upIsGood: false },
  'track.years': { label: 'שנים', format: years },
  'track.type': { label: 'סוג מסלול', format: text },
  'track.name': { label: 'שם מסלול', format: text },

  // Business Plan
  purchasePrice: { label: 'מחיר רכישה', format: currency, upIsGood: false },
  purchaseTax: { label: 'מס רכישה', format: currency, upIsGood: false },
  listingUrl: { label: 'קישור למודעה', format: text },
  sideCosts: { label: 'עלויות נלוות', format: currency, upIsGood: false },
  renovationCost: { label: 'עלות שיפוץ', format: currency, upIsGood: false },
  equityInvested: { label: 'הון מושקע', format: currency },
  mortgageAmount: { label: 'סכום משכנתא', format: currency, upIsGood: false },
  mortgageMonthlyPayment: { label: 'החזר חודשי', format: currency, upIsGood: false },
  mortgageInterestRate: { label: 'ריבית משכנתא', format: percent, upIsGood: false },
  expectedMonthlyRent: { label: 'שכירות צפויה', format: currency, upIsGood: true },
  annualOperatingCosts: { label: 'עלויות תפעול שנתיות', format: currency, upIsGood: false },
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
    // כל איברי המערך, לא רק הראשון — שינוי ריבית במסלול השני הופיע בעבר
    // כ"אין שינוי". מפתח לפי אינדקס כדי שסידור מחדש לא ייצור שינויי רפאים בשמות.
    out[`${prefix}.length`] = o.length;
    o.forEach((item, idx) => {
      if (item != null && typeof item === 'object') {
        const itemPrefix = o.length === 1 ? prefix.replace(/s$/, '') : `${prefix.replace(/s$/, '')} ${idx + 1}`;
        Object.assign(out, flatten(item, itemPrefix));
      }
    });
    return out;
  }
  for (const [k, v] of Object.entries(o)) {
    // סדרות תחזית ארוכות מייצרות רעש בלי ערך בהשוואה — מדלגים
    if (k === 'yearlyProjection') continue;
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
  // "track 2.principal" → מטא של 'track.principal' עם מספר המסלול בתווית
  const indexed = key.match(/^(\w+) (\d+)\.(.+)$/);
  if (indexed) {
    const base = FIELD_META[`${indexed[1]}.${indexed[3]}`];
    if (base) return { ...base, label: `${base.label} (מסלול ${indexed[2]})` };
  }
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
      upIsGood: meta.upIsGood ?? null,
    });
  }

  // Stable, label-sorted output
  rows.sort((x, y) => x.label.localeCompare(y.label, 'he'));
  return rows;
}
