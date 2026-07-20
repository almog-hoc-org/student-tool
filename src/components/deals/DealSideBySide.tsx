import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ExternalLink } from 'lucide-react';
import { formatCurrency } from '@/lib/validation/validators';
import { cn } from '@/lib/utils';
import type { DealMetricsInput, DealAssessment } from '@/lib/deal-ranking';

export interface SideBySideDeal {
  metrics: DealMetricsInput;
  assessment: DealAssessment | undefined;
  color: string;
}

type CellValue = number | string | null;

interface MatrixRow {
  key: string;
  label: string;
  group: string;
  value: (deal: SideBySideDeal) => CellValue;
  format: (v: CellValue) => string;
  /** undefined = בלי הדגשה (נתון, לא תוצאה) */
  higherIsBetter?: boolean;
  /** דלתא מול הטוב ביותר, כשרלוונטי */
  delta?: (v: number, best: number) => string;
}

const nis = (v: CellValue) => (typeof v === 'number' ? formatCurrency(v) : '—');
const pct = (v: CellValue) => (typeof v === 'number' ? `${(v * 100).toFixed(1)}%` : '—');
const txt = (v: CellValue) => (v === null || v === '' ? '—' : String(v));
// הפרש מול העסקה הטובה ביותר בשורה — תמיד שלילי, מוצג כמינוס
const nisDelta = (v: number, best: number) => `−${formatCurrency(best - v)}`;
const pctDelta = (v: number, best: number) => `−${((best - v) * 100).toFixed(1)}%`;

const MATRIX: MatrixRow[] = [
  { key: 'score', label: 'ציון משוקלל', group: 'שורה תחתונה', value: (d) => d.assessment?.score ?? null, format: (v) => (typeof v === 'number' ? `${v}/100` : '—'), higherIsBetter: true },
  { key: 'grade', label: 'דרגה', group: 'שורה תחתונה', value: (d) => d.assessment?.grade ?? null, format: txt },

  { key: 'monthlyCashflow', label: 'תזרים חודשי', group: 'תוצאות (תרחיש בינוני)', value: (d) => d.metrics.monthlyCashflow, format: nis, higherIsBetter: true, delta: nisDelta },
  { key: 'cocYield', label: 'תשואה על ההון (COC)', group: 'תוצאות (תרחיש בינוני)', value: (d) => d.metrics.cocYield, format: pct, higherIsBetter: true, delta: pctDelta },
  { key: 'irr', label: 'תשואה פנימית (IRR)', group: 'תוצאות (תרחיש בינוני)', value: (d) => d.metrics.irr, format: pct, higherIsBetter: true, delta: pctDelta },
  { key: 'totalProfit', label: 'רווח כולל', group: 'תוצאות (תרחיש בינוני)', value: (d) => d.metrics.totalProfit, format: nis, higherIsBetter: true, delta: nisDelta },
  { key: 'totalEquityReturn', label: 'תשואה כוללת על ההון', group: 'תוצאות (תרחיש בינוני)', value: (d) => d.metrics.totalEquityReturn, format: pct, higherIsBetter: true, delta: pctDelta },

  { key: 'purchasePrice', label: 'מחיר רכישה', group: 'נתוני העסקה', value: (d) => d.metrics.purchasePrice, format: nis },
  { key: 'pricePerSqm', label: 'מחיר למ״ר', group: 'נתוני העסקה', value: (d) => (d.metrics.propertySqm ? Math.round(d.metrics.purchasePrice / d.metrics.propertySqm) : null), format: nis },
  { key: 'equityInvested', label: 'הון עצמי', group: 'נתוני העסקה', value: (d) => d.metrics.equityInvested, format: nis },
  { key: 'initialInvestment', label: 'סך השקעה (כולל עלויות)', group: 'נתוני העסקה', value: (d) => d.metrics.initialInvestment, format: nis },
  { key: 'mortgageAmount', label: 'משכנתא', group: 'נתוני העסקה', value: (d) => d.metrics.mortgageAmount, format: nis },
  { key: 'mortgageMonthlyPayment', label: 'החזר חודשי', group: 'נתוני העסקה', value: (d) => d.metrics.mortgageMonthlyPayment, format: nis },
  { key: 'expectedMonthlyRent', label: 'שכ״ד צפוי', group: 'נתוני העסקה', value: (d) => d.metrics.expectedMonthlyRent, format: nis },
  { key: 'holdingPeriodYears', label: 'תקופת החזקה', group: 'נתוני העסקה', value: (d) => d.metrics.holdingPeriodYears, format: (v) => (typeof v === 'number' && v > 0 ? `${v} שנים` : '—') },
  { key: 'propertyArea', label: 'אזור', group: 'נתוני העסקה', value: (d) => d.metrics.propertyArea ?? null, format: txt },
];

export function DealSideBySide({ deals }: { deals: SideBySideDeal[] }) {
  if (deals.length === 0) return null;
  const shown = deals.slice(0, 3);
  const groups = [...new Set(MATRIX.map((r) => r.group))];

  return (
    <div className="space-y-3">
      {deals.length > 3 && (
        <p className="text-xs text-muted-foreground">
          מציגים את 3 העסקאות הראשונות שנבחרו — בטל בחירה של עסקה כדי להחליף.
        </p>
      )}
      <Card className="border-0 shadow-sm overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-muted/60">
                  <th className="text-right px-3 py-3 font-semibold text-xs text-muted-foreground w-44 min-w-36">מדד</th>
                  {shown.map((deal) => (
                    <th key={deal.metrics.snapshotId} className="px-3 py-3 text-right min-w-40">
                      <div className="flex items-center gap-2">
                        <span className="inline-block h-3 w-3 rounded-full shrink-0" style={{ backgroundColor: deal.color }} />
                        <span className="font-bold truncate">{deal.metrics.name}</span>
                        {deal.metrics.listingUrl && (
                          <a href={deal.metrics.listingUrl} target="_blank" rel="noreferrer" aria-label="פתח מודעה" className="text-muted-foreground hover:text-foreground">
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        )}
                      </div>
                      {deal.assessment && (
                        <Badge variant="outline" className="mt-1 font-normal">
                          מקום {deal.assessment.rank} · {deal.assessment.score}/100
                        </Badge>
                      )}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {groups.map((group) => (
                  <GroupRows key={group} group={group} deals={shown} />
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function GroupRows({ group, deals }: { group: string; deals: SideBySideDeal[] }) {
  const rows = MATRIX.filter((r) => r.group === group);
  return (
    <>
      <tr>
        <td colSpan={deals.length + 1} className="bg-muted/40 px-3 py-1.5 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
          {group}
        </td>
      </tr>
      {rows.map((row) => {
        const values = deals.map((d) => row.value(d));
        const numeric = values.filter((v): v is number => typeof v === 'number' && Number.isFinite(v));
        const best = row.higherIsBetter && numeric.length >= 2 ? Math.max(...numeric) : null;
        const allEqual = values.every((v) => v === values[0]);
        return (
          <tr key={row.key} className={cn('border-t', allEqual && deals.length > 1 && 'opacity-60')}>
            <td className="px-3 py-2 text-xs text-muted-foreground">{row.label}</td>
            {deals.map((deal) => {
              const v = row.value(deal);
              const isBest = best !== null && typeof v === 'number' && v === best;
              const showDelta = best !== null && typeof v === 'number' && v !== best && row.delta;
              return (
                <td
                  key={deal.metrics.snapshotId}
                  className={cn(
                    'px-3 py-2 font-semibold tabular-nums',
                    isBest && 'bg-green-50 text-green-700 dark:bg-green-950/40 dark:text-green-400',
                  )}
                >
                  {row.format(v)}
                  {showDelta && (
                    <span className="block text-[10px] font-normal text-muted-foreground" dir="ltr">
                      {row.delta!(v as number, best!)}
                    </span>
                  )}
                </td>
              );
            })}
          </tr>
        );
      })}
    </>
  );
}
