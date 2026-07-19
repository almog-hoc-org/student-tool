import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BarChart3, Edit3, Loader2, RefreshCw, Trash2, TrendingUp } from 'lucide-react';
import { LoadingState } from '@/components/ui/loading-state';
import { ErrorState } from '@/components/ui/error-state';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { deleteSnapshot, listSnapshots, type Snapshot } from '@/lib/snapshots';
import {
  getDealSnapshotData,
  getDealSummary,
  rowsFromDealSnapshot,
  type DealRow,
  type DealScenarioFilter,
} from '@/lib/deals';
import { formatCurrency } from '@/lib/validation/validators';
import { cn } from '@/lib/utils';
import { PropertyAreaNav } from '@/components/PropertyAreaNav';
import { save } from '@/lib/storage';
import { toast } from 'sonner';

function formatPercent(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return '—';
  return `${(value * 100).toFixed(1)}%`;
}

function getScenarioTone(label: string) {
  if (label.includes('מחמיר')) return 'bg-red-50 text-red-700 border-red-200';
  if (label.includes('טוב') || label.includes('אופטימי')) return 'bg-green-50 text-green-700 border-green-200';
  return 'bg-blue-50 text-blue-700 border-blue-200';
}

function bestClass(value: number, best: number, higherIsBetter = true) {
  if (!Number.isFinite(value) || !Number.isFinite(best)) return '';
  const isBest = higherIsBetter ? value === best : value === best;
  return isBest ? 'bg-green-50 text-green-700 font-bold' : '';
}

function MobileMetric({ label, value, highlight }: { label: string; value: string; highlight?: 'good' | 'bad' | 'best' }) {
  return (
    <div className={cn(
      'rounded-xl border bg-background p-3',
      highlight === 'best' && 'border-green-200 bg-green-50 text-green-700',
      highlight === 'good' && 'text-green-600',
      highlight === 'bad' && 'text-red-600',
    )}>
      <p className="text-[11px] text-muted-foreground mb-1">{label}</p>
      <p className="text-sm font-bold leading-tight">{value}</p>
    </div>
  );
}

export default function DealComparison() {
  const navigate = useNavigate();
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [scenarioFilter, setScenarioFilter] = useState<DealScenarioFilter>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listSnapshots('business_plan');
      setSnapshots(data);
      setSelectedIds(new Set(data.map((s) => s.id)));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'שגיאה בטעינת עסקאות');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const dealOptions = snapshots.map((snapshot) => ({ id: snapshot.id, name: snapshot.name, snapshot }));

  const rows = useMemo(() => {
    return snapshots
      .filter((snapshot) => selectedIds.has(snapshot.id))
      .flatMap(rowsFromDealSnapshot)
      .filter((row) => scenarioFilter === 'all' || row.scenarioLabel === scenarioFilter);
  }, [snapshots, selectedIds, scenarioFilter]);

  const selectedSummaries = useMemo(() => {
    return snapshots
      .filter((snapshot) => selectedIds.has(snapshot.id))
      .map(getDealSummary);
  }, [snapshots, selectedIds]);

  const best = useMemo(() => ({
    monthlyCashflow: Math.max(...rows.map((r) => r.monthlyCashflow), -Infinity),
    cocYield: Math.max(...rows.map((r) => r.cocYield), -Infinity),
    irr: Math.max(...rows.map((r) => r.irr ?? -Infinity), -Infinity),
    totalProfit: Math.max(...rows.map((r) => r.totalProfit), -Infinity),
  }), [rows]);

  const snapshotsById = useMemo(() => {
    return new Map(snapshots.map((snapshot) => [snapshot.id, snapshot]));
  }, [snapshots]);

  const toggleDeal = (id: string) => {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const editDeal = (snapshot: Snapshot) => {
    const data = getDealSnapshotData(snapshot);
    if (!data?.inputs) {
      toast.error('לא ניתן לערוך את העסקה — חסרים נתוני מקור');
      return;
    }
    save('business_plan', data.inputs);
    save('business_plan_editing', { id: snapshot.id, name: snapshot.name, notes: snapshot.notes });
    navigate('/business-plan');
  };

  const removeDeal = async (snapshot: Snapshot) => {
    if (!window.confirm(`למחוק את העסקה "${snapshot.name}"?`)) return;
    try {
      await deleteSnapshot(snapshot.id);
      setSnapshots((current) => current.filter((s) => s.id !== snapshot.id));
      setSelectedIds((current) => {
        const next = new Set(current);
        next.delete(snapshot.id);
        return next;
      });
      toast.success('העסקה נמחקה');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'שגיאה במחיקת העסקה');
    }
  };

  return (
    <div className="space-y-5" dir="rtl">
      <PropertyAreaNav />
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-primary" />
            השוואת עסקאות
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            השווה בין עסקאות ששמרת בתוכנית העסקית וקבל תמונה מספרית ברורה בסגנון טבלת אקסל.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={load} disabled={loading} className="gap-1.5">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          רענן
        </Button>
      </div>

      <Card className="border-0 shadow-sm">
        <CardContent className="p-4 space-y-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground">בחר עסקאות להשוואה</p>
              {dealOptions.length === 0 ? (
                <p className="text-sm text-muted-foreground">עוד אין עסקאות שמורות.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {dealOptions.map((deal) => (
                    <div
                      key={deal.id}
                      className={cn(
                        'inline-flex items-center gap-1 rounded-full border px-2 py-1 text-xs transition',
                        selectedIds.has(deal.id) ? 'bg-primary/10 border-primary/40 text-primary' : 'bg-background text-muted-foreground',
                      )}
                    >
                      <label className="inline-flex cursor-pointer items-center gap-2 py-0.5 pr-1">
                        <Checkbox
                          checked={selectedIds.has(deal.id)}
                          onCheckedChange={() => toggleDeal(deal.id)}
                          className="w-3.5 h-3.5"
                        />
                        <span className="max-w-[180px] truncate">{deal.name}</span>
                      </label>
                      <span className="h-4 w-px bg-border" />
                      <button type="button" onClick={() => editDeal(deal.snapshot)} className="rounded-full p-1 hover:bg-background" aria-label="ערוך עסקה">
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button type="button" onClick={() => removeDeal(deal.snapshot)} className="rounded-full p-1 text-destructive hover:bg-background" aria-label="מחק עסקה">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-2 min-w-[220px]">
              <p className="text-xs font-semibold text-muted-foreground">תרחיש</p>
              <div className="grid grid-cols-4 gap-1 rounded-xl bg-muted p-1 text-xs">
                {(['all', 'מחמיר', 'בינוני', 'טוב'] as const).map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setScenarioFilter(value)}
                    className={cn(
                      'rounded-lg px-2 py-1.5 transition',
                      scenarioFilter === value ? 'bg-background shadow-sm font-semibold' : 'text-muted-foreground',
                    )}
                  >
                    {value === 'all' ? 'הכל' : value}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {!loading && !error && selectedSummaries.length > 0 && (
        <div className="grid gap-3 md:grid-cols-3">
          {selectedSummaries.map((deal) => (
            <Card key={deal.id} className="border-0 shadow-sm">
              <CardContent className="p-4 space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-bold truncate">{deal.name}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {deal.propertyArea || 'ללא אזור'}{deal.propertySqm ? ` · ${deal.propertySqm} מ״ר` : ''}
                    </p>
                  </div>
                  <Badge variant="outline">{deal.scenarioCount} תרחישים</Badge>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <p className="text-muted-foreground">מחיר</p>
                    <p className="font-semibold">{formatCurrency(deal.purchasePrice)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">מחיר למ״ר</p>
                    <p className="font-semibold">{deal.pricePerSqm ? formatCurrency(deal.pricePerSqm) : '—'}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">תזרים מיטבי</p>
                    <p className={cn('font-semibold', deal.bestMonthlyCashflow >= 0 ? 'text-green-600' : 'text-red-600')}>
                      {formatCurrency(deal.bestMonthlyCashflow)}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">רווח מיטבי</p>
                    <p className={cn('font-semibold', deal.bestTotalProfit >= 0 ? 'text-green-600' : 'text-red-600')}>
                      {formatCurrency(deal.bestTotalProfit)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {loading ? (
        <LoadingState label="טוען עסקאות…" />
      ) : error ? (
        <ErrorState
          title="שגיאה בטעינת עסקאות"
          description={error}
          retry={load}
        />
      ) : snapshots.length === 0 ? (
        <Card className="border-0 shadow-sm">
          <CardContent className="p-8 text-center space-y-3">
            <TrendingUp className="w-10 h-10 text-muted-foreground mx-auto" />
            <h3 className="font-semibold">אין עדיין עסקאות להשוואה</h3>
            <p className="text-sm text-muted-foreground">שמור עסקה מתוך התוכנית העסקית והיא תופיע כאן.</p>
            <Button asChild>
              <Link to="/business-plan">עבור לתוכנית עסקית</Link>
            </Button>
          </CardContent>
        </Card>
      ) : rows.length === 0 ? (
        <Card className="border-0 shadow-sm">
          <CardContent className="p-6 text-center space-y-3">
            <p className="text-sm text-muted-foreground">
              {selectedIds.size === 0
                ? 'בחר לפחות עסקה אחת להשוואה.'
                : `אין תרחישי ${scenarioFilter} בעסקאות שנבחרו.`}
            </p>
            {scenarioFilter !== 'all' && (
              <Button variant="outline" size="sm" onClick={() => setScenarioFilter('all')}>
                הצג את כל התרחישים
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <>
        <div className="md:hidden space-y-3">
          {rows.map((row) => (
            <Card key={row.id} className="border-0 shadow-sm overflow-hidden">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="font-bold truncate">{row.name}</h3>
                    <p className="text-[11px] text-muted-foreground">
                      {row.propertyArea || 'ללא אזור'} · נשמר ב-{new Date(row.createdAt).toLocaleDateString('he-IL')} · {row.holdingPeriodYears} שנים
                    </p>
                  </div>
                  <Badge variant="outline" className={cn('shrink-0', getScenarioTone(row.scenarioLabel))}>
                    {row.scenarioLabel} · {row.annualAppreciation}%
                  </Badge>
                </div>

                {snapshotsById.get(row.snapshotId) && (
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="h-8 flex-1 gap-1" onClick={() => editDeal(snapshotsById.get(row.snapshotId)!)}>
                      <Edit3 className="w-3.5 h-3.5" /> ערוך
                    </Button>
                    <Button variant="outline" size="sm" className="h-8 flex-1 gap-1 text-destructive" onClick={() => removeDeal(snapshotsById.get(row.snapshotId)!)}>
                      <Trash2 className="w-3.5 h-3.5" /> מחק
                    </Button>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2">
                  <MobileMetric label="תזרים חודשי" value={formatCurrency(row.monthlyCashflow)} highlight={row.monthlyCashflow >= 0 ? 'good' : 'bad'} />
                  <MobileMetric label="רווח כולל" value={formatCurrency(row.totalProfit)} highlight={row.totalProfit === best.totalProfit ? 'best' : row.totalProfit >= 0 ? 'good' : 'bad'} />
                  <MobileMetric label="COC" value={formatPercent(row.cocYield)} highlight={row.cocYield === best.cocYield ? 'best' : undefined} />
                  <MobileMetric label="IRR" value={formatPercent(row.irr)} highlight={(row.irr ?? -Infinity) === best.irr ? 'best' : undefined} />
                </div>

                <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs text-muted-foreground border-t pt-3">
                  <div>מחיר רכישה: <span className="font-semibold text-foreground">{formatCurrency(row.purchasePrice)}</span></div>
                  <div>שטח: <span className="font-semibold text-foreground">{row.propertySqm ? `${row.propertySqm} מ״ר` : '—'}</span></div>
                  <div>מחיר למ״ר: <span className="font-semibold text-foreground">{row.pricePerSqm ? formatCurrency(row.pricePerSqm) : '—'}</span></div>
                  <div>הון עצמי: <span className="font-semibold text-foreground">{formatCurrency(row.equityInvested)}</span></div>
                  <div>משכנתא: <span className="font-semibold text-foreground">{formatCurrency(row.mortgageAmount)}</span></div>
                  <div>שכ״ד: <span className="font-semibold text-foreground">{formatCurrency(row.expectedMonthlyRent)}</span></div>
                  <div className="col-span-2">שווי בסוף תקופה: <span className="font-semibold text-foreground">{formatCurrency(row.propertyValueAtEnd)}</span></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="hidden md:block border-0 shadow-sm overflow-hidden">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1320px] border-collapse text-xs">
                <thead className="bg-muted/80 sticky top-0 z-10">
                  <tr className="text-right">
                    {['עסקה', 'אזור', 'שטח', 'מחיר למ״ר', 'תרחיש', 'עלייה שנתית', 'מחיר רכישה', 'הון עצמי', 'משכנתא', 'החזר חודשי', 'שכ״ד', 'תזרים חודשי', 'COC', 'IRR', 'רווח כולל', 'שווי בסוף', 'תקופה', 'נשמר', 'פעולות'].map((head) => (
                      <th key={head} className="border-b border-l px-3 py-2 font-semibold whitespace-nowrap">{head}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.id} className="hover:bg-muted/40">
                      <td className="border-b border-l px-3 py-2 font-semibold max-w-[180px] truncate" title={row.notes ?? row.name}>{row.name}</td>
                      <td className="border-b border-l px-3 py-2 max-w-[140px] truncate">{row.propertyArea || '—'}</td>
                      <td className="border-b border-l px-3 py-2 whitespace-nowrap">{row.propertySqm ? `${row.propertySqm} מ״ר` : '—'}</td>
                      <td className="border-b border-l px-3 py-2 whitespace-nowrap">{row.pricePerSqm ? formatCurrency(row.pricePerSqm) : '—'}</td>
                      <td className="border-b border-l px-3 py-2"><Badge variant="outline" className={getScenarioTone(row.scenarioLabel)}>{row.scenarioLabel}</Badge></td>
                      <td className="border-b border-l px-3 py-2 text-center">{row.annualAppreciation}%</td>
                      <td className="border-b border-l px-3 py-2">{formatCurrency(row.purchasePrice)}</td>
                      <td className="border-b border-l px-3 py-2">{formatCurrency(row.equityInvested)}</td>
                      <td className="border-b border-l px-3 py-2">{formatCurrency(row.mortgageAmount)}</td>
                      <td className="border-b border-l px-3 py-2">{formatCurrency(row.mortgageMonthlyPayment)}</td>
                      <td className="border-b border-l px-3 py-2">{formatCurrency(row.expectedMonthlyRent)}</td>
                      <td className={cn('border-b border-l px-3 py-2', row.monthlyCashflow >= 0 ? 'text-green-600' : 'text-red-600', bestClass(row.monthlyCashflow, best.monthlyCashflow))}>{formatCurrency(row.monthlyCashflow)}</td>
                      <td className={cn('border-b border-l px-3 py-2', bestClass(row.cocYield, best.cocYield))}>{formatPercent(row.cocYield)}</td>
                      <td className={cn('border-b border-l px-3 py-2', bestClass(row.irr ?? -Infinity, best.irr))}>{formatPercent(row.irr)}</td>
                      <td className={cn('border-b border-l px-3 py-2', row.totalProfit >= 0 ? 'text-green-600' : 'text-red-600', bestClass(row.totalProfit, best.totalProfit))}>{formatCurrency(row.totalProfit)}</td>
                      <td className="border-b border-l px-3 py-2">{formatCurrency(row.propertyValueAtEnd)}</td>
                      <td className="border-b border-l px-3 py-2 text-center">{row.holdingPeriodYears} שנים</td>
                      <td className="border-b border-l px-3 py-2 whitespace-nowrap">{new Date(row.createdAt).toLocaleDateString('he-IL')}</td>
                      <td className="border-b px-3 py-2 whitespace-nowrap">
                        {snapshotsById.get(row.snapshotId) && (
                          <div className="flex gap-1">
                            <Button variant="ghost" size="sm" className="h-7 px-2" onClick={() => editDeal(snapshotsById.get(row.snapshotId)!)}>ערוך</Button>
                            <Button variant="ghost" size="sm" className="h-7 px-2 text-destructive" onClick={() => removeDeal(snapshotsById.get(row.snapshotId)!)}>מחק</Button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
        </>
      )}
    </div>
  );
}
