import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit3, Trash2 } from 'lucide-react';
import { InfoTooltip } from '@/components/InfoTooltip';
import { formatCurrency } from '@/lib/validation/validators';
import { cn } from '@/lib/utils';
import type { DealRow } from '@/lib/deals';
import type { Snapshot } from '@/lib/snapshots';

function formatPercent(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return '—';
  return `${(value * 100).toFixed(1)}%`;
}

function getScenarioTone(label: string) {
  if (label.includes('מחמיר')) return 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-400 dark:border-red-800';
  if (label.includes('טוב') || label.includes('אופטימי')) return 'bg-green-50 text-green-700 border-green-200 dark:bg-green-950/40 dark:text-green-400 dark:border-green-800';
  return 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-800';
}

/** המדדים הטובים ביותר בתוך תרחיש אחד — רק כשיש לפחות 2 עסקאות באותו תרחיש */
export interface ScenarioBest {
  monthlyCashflow: number;
  cocYield: number;
  irr: number;
  totalProfit: number;
  dealCount: number;
}

export function computeBestByScenario(rows: DealRow[]): Map<string, ScenarioBest> {
  const map = new Map<string, ScenarioBest & { dealIds: Set<string> }>();
  for (const row of rows) {
    const entry = map.get(row.scenarioLabel) ?? {
      monthlyCashflow: -Infinity, cocYield: -Infinity, irr: -Infinity, totalProfit: -Infinity,
      dealCount: 0, dealIds: new Set<string>(),
    };
    entry.monthlyCashflow = Math.max(entry.monthlyCashflow, row.monthlyCashflow);
    entry.cocYield = Math.max(entry.cocYield, row.cocYield);
    entry.irr = Math.max(entry.irr, row.irr ?? -Infinity);
    entry.totalProfit = Math.max(entry.totalProfit, row.totalProfit);
    entry.dealIds.add(row.snapshotId);
    map.set(row.scenarioLabel, entry);
  }
  const result = new Map<string, ScenarioBest>();
  for (const [label, e] of map) {
    result.set(label, { ...e, dealCount: e.dealIds.size });
  }
  return result;
}

function bestCell(value: number, scenarioBest: ScenarioBest | undefined, key: keyof Omit<ScenarioBest, 'dealCount'>): string {
  // הדגשה רק בתוך אותו תרחיש, ורק כשמשוות לפחות 2 עסקאות
  if (!scenarioBest || scenarioBest.dealCount < 2) return '';
  if (!Number.isFinite(value) || value !== scenarioBest[key]) return '';
  return 'bg-green-50 text-green-700 font-bold dark:bg-green-950/40 dark:text-green-400';
}

const IRR_NULL_HINT = 'לא ניתן לחשב IRR עבור תזרימים אלה (החישוב לא מתכנס) — השווה לפי תשואת ההון (COC)';

function IrrValue({ irr }: { irr: number | null }) {
  if (irr === null) {
    return (
      <span className="inline-flex items-center gap-1">
        — <InfoTooltip text={IRR_NULL_HINT} />
      </span>
    );
  }
  return <>{formatPercent(irr)}</>;
}

interface Props {
  rows: DealRow[];
  bestByScenario: Map<string, ScenarioBest>;
  grouped: boolean; // מצב "הכל" — קיבוץ שורות לפי עסקה
  showAllColumns: boolean;
  onToggleColumns: () => void;
  snapshotsById: Map<string, Snapshot>;
  onEdit: (snapshot: Snapshot) => void;
  onDelete: (snapshot: Snapshot) => void;
}

function MobileMetric({ label, value, highlight }: { label: string; value: React.ReactNode; highlight?: 'good' | 'bad' | 'best' }) {
  return (
    <div className={cn(
      'rounded-xl border bg-background p-3',
      highlight === 'best' && 'border-green-200 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-950/40 dark:text-green-400',
      highlight === 'good' && 'text-green-600',
      highlight === 'bad' && 'text-red-600',
    )}>
      <p className="text-[11px] text-muted-foreground mb-1">{label}</p>
      <p className="text-sm font-bold leading-tight">{value}</p>
    </div>
  );
}

export function DealComparisonTable({
  rows, bestByScenario, grouped, showAllColumns, onToggleColumns, snapshotsById, onEdit, onDelete,
}: Props) {
  // קיבוץ לפי עסקה (שומר על סדר ההופעה)
  const groups: DealRow[][] = [];
  {
    const index = new Map<string, number>();
    for (const row of rows) {
      const i = index.get(row.snapshotId);
      if (i === undefined) {
        index.set(row.snapshotId, groups.length);
        groups.push([row]);
      } else {
        groups[i].push(row);
      }
    }
  }

  const scenarioBestOf = (row: DealRow) => bestByScenario.get(row.scenarioLabel);

  return (
    <>
      {/* מובייל — כרטיס לעסקה, שורת מדדים לכל תרחיש */}
      <div className="md:hidden space-y-3">
        {groups.map((group) => {
          const first = group[0];
          const snapshot = snapshotsById.get(first.snapshotId);
          return (
            <Card key={first.snapshotId} className="border-0 shadow-sm overflow-hidden">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="font-bold truncate">{first.name}</h3>
                    <p className="text-[11px] text-muted-foreground">
                      {first.propertyArea || 'ללא אזור'} · נשמר ב-{new Date(first.createdAt).toLocaleDateString('he-IL')} · {first.holdingPeriodYears} שנים
                    </p>
                  </div>
                  {group.length === 1 && (
                    <Badge variant="outline" className={cn('shrink-0', getScenarioTone(first.scenarioLabel))}>
                      {first.scenarioLabel} · {first.annualAppreciation}%
                    </Badge>
                  )}
                </div>

                {snapshot && (
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="h-8 flex-1 gap-1" onClick={() => onEdit(snapshot)}>
                      <Edit3 className="w-3.5 h-3.5" /> ערוך
                    </Button>
                    <Button variant="outline" size="sm" className="h-8 flex-1 gap-1 text-destructive" onClick={() => onDelete(snapshot)}>
                      <Trash2 className="w-3.5 h-3.5" /> מחק
                    </Button>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2">
                  <MobileMetric label="תזרים חודשי" value={formatCurrency(first.monthlyCashflow)} highlight={bestCell(first.monthlyCashflow, scenarioBestOf(first), 'monthlyCashflow') ? 'best' : first.monthlyCashflow >= 0 ? 'good' : 'bad'} />
                  {group.map((row) => (
                    <MobileMetric
                      key={`${row.id}-profit`}
                      label={group.length > 1 ? `רווח (${row.scenarioLabel})` : 'רווח כולל'}
                      value={formatCurrency(row.totalProfit)}
                      highlight={bestCell(row.totalProfit, scenarioBestOf(row), 'totalProfit') ? 'best' : row.totalProfit >= 0 ? 'good' : 'bad'}
                    />
                  ))}
                  <MobileMetric label="COC" value={formatPercent(first.cocYield)} highlight={bestCell(first.cocYield, scenarioBestOf(first), 'cocYield') ? 'best' : undefined} />
                  <MobileMetric label="IRR" value={<IrrValue irr={first.irr} />} highlight={first.irr !== null && bestCell(first.irr, scenarioBestOf(first), 'irr') ? 'best' : undefined} />
                </div>

                <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs text-muted-foreground border-t pt-3">
                  <div>מחיר רכישה: <span className="font-semibold text-foreground">{formatCurrency(first.purchasePrice)}</span></div>
                  <div>שטח: <span className="font-semibold text-foreground">{first.propertySqm ? `${first.propertySqm} מ״ר` : '—'}</span></div>
                  <div>מחיר למ״ר: <span className="font-semibold text-foreground">{first.pricePerSqm ? formatCurrency(first.pricePerSqm) : '—'}</span></div>
                  <div>הון עצמי: <span className="font-semibold text-foreground">{formatCurrency(first.equityInvested)}</span></div>
                  <div>משכנתא: <span className="font-semibold text-foreground">{formatCurrency(first.mortgageAmount)}</span></div>
                  <div>שכ״ד: <span className="font-semibold text-foreground">{formatCurrency(first.expectedMonthlyRent)}</span></div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* דסקטופ — טבלה; במצב "הכל" tbody לכל עסקה עם rowSpan לשדות קבועים */}
      <Card className="hidden md:block border-0 shadow-sm overflow-hidden">
        <CardContent className="p-0">
          <div className="flex items-center justify-between px-4 py-2 border-b bg-muted/40">
            <p className="text-xs text-muted-foreground">
              {showAllColumns ? 'כל העמודות מוצגות' : 'מוצגות העמודות העיקריות בלבד'}
            </p>
            <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={onToggleColumns}>
              {showAllColumns ? 'פחות עמודות' : 'עוד עמודות'}
            </Button>
          </div>
          <div className="overflow-x-auto">
            <table className={cn('w-full border-collapse text-xs', showAllColumns && 'min-w-[1320px]')}>
              <thead className="bg-muted/80 sticky top-0 z-10">
                <tr className="text-right">
                  {['עסקה', 'תרחיש', 'מחיר רכישה', 'הון עצמי', 'תזרים חודשי',
                    ...(showAllColumns ? ['אזור', 'שטח', 'מחיר למ״ר', 'עלייה שנתית', 'משכנתא', 'החזר חודשי', 'שכ״ד', 'COC', 'שווי בסוף', 'תקופה', 'נשמר'] : []),
                    'IRR', 'רווח כולל', 'פעולות'].map((head) => (
                    <th key={head} className="border-b border-l px-3 py-2 font-semibold whitespace-nowrap">{head}</th>
                  ))}
                </tr>
              </thead>
              {groups.map((group) => {
                const span = grouped ? group.length : 1;
                const snapshot = snapshotsById.get(group[0].snapshotId);
                return (
                  <tbody key={group[0].snapshotId} className={cn(grouped && 'border-t-2 border-border')}>
                    {group.map((row, i) => {
                      const sb = scenarioBestOf(row);
                      const dealCell = !grouped || i === 0;
                      return (
                        <tr key={row.id} className="hover:bg-muted/40">
                          {dealCell && (
                            <td rowSpan={span} className="border-b border-l px-3 py-2 font-semibold max-w-[180px] truncate align-top" title={row.notes ?? row.name}>{row.name}</td>
                          )}
                          <td className="border-b border-l px-3 py-2"><Badge variant="outline" className={getScenarioTone(row.scenarioLabel)}>{row.scenarioLabel}</Badge></td>
                          {dealCell && (
                            <>
                              <td rowSpan={span} className="border-b border-l px-3 py-2 align-top">{formatCurrency(row.purchasePrice)}</td>
                              <td rowSpan={span} className="border-b border-l px-3 py-2 align-top">{formatCurrency(row.equityInvested)}</td>
                              <td rowSpan={span} className={cn('border-b border-l px-3 py-2 align-top', row.monthlyCashflow >= 0 ? 'text-green-600' : 'text-red-600', bestCell(row.monthlyCashflow, sb, 'monthlyCashflow'))}>{formatCurrency(row.monthlyCashflow)}</td>
                            </>
                          )}
                          {showAllColumns && dealCell && (
                            <>
                              <td rowSpan={span} className="border-b border-l px-3 py-2 max-w-[140px] truncate align-top">{row.propertyArea || '—'}</td>
                              <td rowSpan={span} className="border-b border-l px-3 py-2 whitespace-nowrap align-top">{row.propertySqm ? `${row.propertySqm} מ״ר` : '—'}</td>
                              <td rowSpan={span} className="border-b border-l px-3 py-2 whitespace-nowrap align-top">{row.pricePerSqm ? formatCurrency(row.pricePerSqm) : '—'}</td>
                            </>
                          )}
                          {showAllColumns && (
                            <td className="border-b border-l px-3 py-2 text-center">{row.annualAppreciation}%</td>
                          )}
                          {showAllColumns && dealCell && (
                            <>
                              <td rowSpan={span} className="border-b border-l px-3 py-2 align-top">{formatCurrency(row.mortgageAmount)}</td>
                              <td rowSpan={span} className="border-b border-l px-3 py-2 align-top">{formatCurrency(row.mortgageMonthlyPayment)}</td>
                              <td rowSpan={span} className="border-b border-l px-3 py-2 align-top">{formatCurrency(row.expectedMonthlyRent)}</td>
                            </>
                          )}
                          {showAllColumns && (
                            <td className={cn('border-b border-l px-3 py-2', bestCell(row.cocYield, sb, 'cocYield'))}>{formatPercent(row.cocYield)}</td>
                          )}
                          {showAllColumns && (
                            <td className="border-b border-l px-3 py-2">{formatCurrency(row.propertyValueAtEnd)}</td>
                          )}
                          {showAllColumns && dealCell && (
                            <>
                              <td rowSpan={span} className="border-b border-l px-3 py-2 text-center align-top">{row.holdingPeriodYears} שנים</td>
                              <td rowSpan={span} className="border-b border-l px-3 py-2 whitespace-nowrap align-top">{new Date(row.createdAt).toLocaleDateString('he-IL')}</td>
                            </>
                          )}
                          <td className={cn('border-b border-l px-3 py-2', row.irr !== null && bestCell(row.irr, sb, 'irr'))}><IrrValue irr={row.irr} /></td>
                          <td className={cn('border-b border-l px-3 py-2', row.totalProfit >= 0 ? 'text-green-600' : 'text-red-600', bestCell(row.totalProfit, sb, 'totalProfit'))}>{formatCurrency(row.totalProfit)}</td>
                          {dealCell && (
                            <td rowSpan={span} className="border-b px-3 py-2 whitespace-nowrap align-top">
                              {snapshot && (
                                <div className="flex gap-1">
                                  <Button variant="ghost" size="sm" className="h-7 px-2" onClick={() => onEdit(snapshot)}>ערוך</Button>
                                  <Button variant="ghost" size="sm" className="h-7 px-2 text-destructive" onClick={() => onDelete(snapshot)}>מחק</Button>
                                </div>
                              )}
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                );
              })}
            </table>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
