import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AlertTriangle, BarChart3, Edit3, Loader2, Plus, RefreshCw, Trash2, TrendingUp } from 'lucide-react';
import { DealComparisonTable, computeBestByScenario } from '@/components/deals/DealComparisonTable';
import { DealVerdictPanel } from '@/components/deals/DealVerdictPanel';
import { DealSideBySide, type SideBySideDeal } from '@/components/deals/DealSideBySide';
import { DealCharts, type ChartDeal } from '@/components/deals/DealCharts';
import { QuickAddDealDialog } from '@/components/deals/QuickAddDealDialog';
import { ExportButton } from '@/components/ExportButton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CHART_SERIES } from '@/lib/chart-colors';
import { rankDeals, PREFERENCE_LABELS, type RankingPreference } from '@/lib/deal-ranking';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { LoadingState } from '@/components/ui/loading-state';
import { ErrorState } from '@/components/ui/error-state';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { deleteSnapshot, listSnapshots, updateSnapshot, type Snapshot } from '@/lib/snapshots';
import {
  DEFAULT_SCENARIO,
  dealMetricsFromSnapshot,
  getDealSnapshotData,
  getDealSummary,
  isDealBroken,
  isDealStale,
  recomputeDealSnapshot,
  rowsFromDealSnapshot,
  type DealScenarioFilter,
} from '@/lib/deals';
import { formatCurrency } from '@/lib/validation/validators';
import { cn } from '@/lib/utils';
import { PropertyAreaNav } from '@/components/PropertyAreaNav';
import { save } from '@/lib/storage';
import { toast } from 'sonner';

export default function DealComparison() {
  const navigate = useNavigate();
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [scenarioFilter, setScenarioFilter] = useState<DealScenarioFilter>('בינוני');
  const [showAllColumns, setShowAllColumns] = useState(false);
  const [preference, setPreference] = useState<RankingPreference>('balanced');
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

  // המדדים הטובים ביותר מחושבים בתוך כל תרחיש בנפרד — לא בין תרחישים
  const bestByScenario = useMemo(() => computeBestByScenario(rows), [rows]);

  // דירוג ופסק דין — תמיד על תרחיש קבוע (בינוני או התרחיש המסונן)
  const ranking = useMemo(() => {
    const scenario = scenarioFilter === 'all' ? DEFAULT_SCENARIO : scenarioFilter;
    const metrics = snapshots
      .filter((snapshot) => selectedIds.has(snapshot.id))
      .map((snapshot) => dealMetricsFromSnapshot(snapshot, scenario))
      .filter((m): m is NonNullable<typeof m> => m !== null);
    return rankDeals(metrics, preference);
  }, [snapshots, selectedIds, scenarioFilter, preference]);

  // נתונים למול-מול ולגרפים — צבע קבוע לעסקה לפי סדר הבחירה
  const comparisonDeals = useMemo(() => {
    const scenario = scenarioFilter === 'all' ? DEFAULT_SCENARIO : scenarioFilter;
    const assessmentById = new Map(ranking.ranked.map((a) => [a.snapshotId, a]));
    return snapshots
      .filter((snapshot) => selectedIds.has(snapshot.id))
      .map((snapshot, i) => {
        const metrics = dealMetricsFromSnapshot(snapshot, scenario);
        if (!metrics) return null;
        const data = getDealSnapshotData(snapshot);
        const scenarios = data.results?.scenarios ?? [];
        return {
          metrics,
          assessment: assessmentById.get(snapshot.id),
          scenario: scenarios.find((sc) => sc.label === metrics.scenarioLabel) ?? scenarios[0],
          color: CHART_SERIES[i % CHART_SERIES.length],
        };
      })
      .filter((d): d is NonNullable<typeof d> => d !== null);
  }, [snapshots, selectedIds, scenarioFilter, ranking]);

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

  const [deleteTarget, setDeleteTarget] = useState<Snapshot | null>(null);
  const [quickAddOpen, setQuickAddOpen] = useState(false);

  // דוח PDF של ההשוואה — פסק הדין, סקשן לכל עסקה, וצילום הגרפים
  const exportSections = useMemo(() => {
    const fmtPct = (v: number | null) => (v === null ? '—' : `${(v * 100).toFixed(1)}%`);
    return ranking.ranked.map((assessment) => {
      const deal = comparisonDeals.find((d) => d.metrics.snapshotId === assessment.snapshotId);
      const m = deal?.metrics;
      return {
        title: `${assessment.rank}. ${assessment.name} — ${assessment.score}/100 (${assessment.grade})`,
        items: m ? [
          { label: 'מחיר רכישה', value: formatCurrency(m.purchasePrice) },
          { label: 'הון עצמי', value: formatCurrency(m.equityInvested) },
          { label: 'תזרים חודשי', value: formatCurrency(m.monthlyCashflow) },
          { label: 'IRR', value: fmtPct(m.irr) },
          { label: 'תשואה על ההון (COC)', value: fmtPct(m.cocYield) },
          { label: 'רווח כולל (בינוני)', value: formatCurrency(m.totalProfit) },
          ...(assessment.strengths.length ? [{ label: 'חוזקות', value: assessment.strengths.join(' · ') }] : []),
          ...(assessment.risks.length ? [{ label: 'סיכונים', value: assessment.risks.join(' · ') }] : []),
        ] : [],
      };
    });
  }, [ranking, comparisonDeals]);

  const handleQuickAdded = (snapshot: Snapshot) => {
    setSnapshots((current) => [snapshot, ...current]);
    setSelectedIds((current) => new Set(current).add(snapshot.id));
  };

  // עסקאות שנשמרו עם מנוע ישן או בלי תרחישים — מוצגות עם אזהרה ופעולת תיקון
  const staleDeals = useMemo(
    () => snapshots.filter((s) => !isDealBroken(getDealSnapshotData(s)) && isDealStale(getDealSnapshotData(s))),
    [snapshots],
  );
  const brokenDeals = useMemo(
    () => snapshots.filter((s) => isDealBroken(getDealSnapshotData(s))),
    [snapshots],
  );
  const [recomputingId, setRecomputingId] = useState<string | null>(null);

  const recomputeDeal = async (snapshot: Snapshot) => {
    const recomputed = recomputeDealSnapshot(getDealSnapshotData(snapshot));
    if (!recomputed) {
      toast.error('אין מספיק נתונים שמורים כדי לחשב מחדש — ערוך את העסקה בתוכנית העסקית');
      return;
    }
    setRecomputingId(snapshot.id);
    try {
      const updated = await updateSnapshot({ id: snapshot.id, name: snapshot.name, data: recomputed, notes: snapshot.notes });
      setSnapshots((current) => current.map((s) => (s.id === snapshot.id ? updated : s)));
      toast.success(`"${snapshot.name}" חושבה מחדש עם המנוע העדכני`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'שגיאה בחישוב מחדש');
    } finally {
      setRecomputingId(null);
    }
  };

  const removeDeal = async (snapshot: Snapshot) => {
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
        <div className="flex items-center gap-2">
          <Button size="sm" onClick={() => setQuickAddOpen(true)} className="gap-1.5">
            <Plus className="w-4 h-4" /> הוסף עסקה
          </Button>
          {ranking.winner && (
            <ExportButton
              title="השוואת עסקאות — הדרך לדירה"
              executiveSummary={[ranking.headline, ranking.subline].filter(Boolean)}
              sections={exportSections}
              chartElementId="deal-comparison-charts"
            />
          )}
          <Button variant="outline" size="sm" onClick={load} disabled={loading} className="gap-1.5">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            רענן
          </Button>
        </div>
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
                      <button type="button" onClick={() => setDeleteTarget(deal.snapshot)} className="rounded-full p-1 text-destructive hover:bg-background" aria-label="מחק עסקה">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-2 min-w-[220px]">
              <p className="text-xs font-semibold text-muted-foreground">מה חשוב לך?</p>
              <div className="grid grid-cols-3 gap-1 rounded-xl bg-muted p-1 text-xs">
                {(['cashflow', 'balanced', 'longterm'] as const).map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setPreference(value)}
                    className={cn(
                      'rounded-lg px-2 py-1.5 transition',
                      preference === value ? 'bg-background shadow-sm font-semibold' : 'text-muted-foreground',
                    )}
                  >
                    {PREFERENCE_LABELS[value]}
                  </button>
                ))}
              </div>
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

      {!loading && !error && (staleDeals.length > 0 || brokenDeals.length > 0) && (
        <div className="space-y-2">
          {brokenDeals.map((snapshot) => (
            <div key={snapshot.id} className="flex flex-wrap items-center gap-2 rounded-xl border border-red-300 bg-red-50 dark:border-red-800 dark:bg-red-950/40 px-4 py-3 text-sm text-red-800 dark:text-red-300">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span className="flex-1 min-w-[200px]">לא ניתן להציג את "{snapshot.name}" — חסרים נתוני תרחישים.</span>
              <Button size="sm" variant="outline" className="h-7" disabled={recomputingId === snapshot.id} onClick={() => recomputeDeal(snapshot)}>
                {recomputingId === snapshot.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'חשב מחדש'}
              </Button>
              <Button size="sm" variant="ghost" className="h-7 text-destructive" onClick={() => setDeleteTarget(snapshot)}>מחק</Button>
            </div>
          ))}
          {staleDeals.map((snapshot) => (
            <div key={snapshot.id} className="flex flex-wrap items-center gap-2 rounded-xl border border-amber-300 bg-amber-50 dark:border-amber-700 dark:bg-amber-950/40 px-4 py-3 text-sm text-amber-800 dark:text-amber-300">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span className="flex-1 min-w-[200px]">"{snapshot.name}" חושבה עם גרסה ישנה של המנוע (לפני תיקון מס הרכישה) — המספרים עלולים להטעות בהשוואה.</span>
              <Button size="sm" variant="outline" className="h-7" disabled={recomputingId === snapshot.id} onClick={() => recomputeDeal(snapshot)}>
                {recomputingId === snapshot.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'חשב מחדש'}
              </Button>
            </div>
          ))}
        </div>
      )}

      {!loading && !error && <DealVerdictPanel ranking={ranking} />}

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
            <p className="text-sm text-muted-foreground">הוסף עסקה מהירה כאן, או שמור עסקה מתוך התוכנית העסקית.</p>
            <div className="flex justify-center gap-2">
              <Button onClick={() => setQuickAddOpen(true)} className="gap-1.5"><Plus className="w-4 h-4" /> הוסף עסקה מהירה</Button>
              <Button asChild variant="outline">
                <Link to="/business-plan">עבור לתוכנית עסקית</Link>
              </Button>
            </div>
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
        <Tabs defaultValue="overview" dir="rtl">
          <TabsList className="mb-3">
            <TabsTrigger value="overview">סקירה</TabsTrigger>
            <TabsTrigger value="side-by-side">מול-מול</TabsTrigger>
            <TabsTrigger value="charts">גרפים</TabsTrigger>
          </TabsList>
          <TabsContent value="overview">
            <DealComparisonTable
              rows={rows}
              bestByScenario={bestByScenario}
              grouped={scenarioFilter === 'all'}
              showAllColumns={showAllColumns}
              onToggleColumns={() => setShowAllColumns((v) => !v)}
              snapshotsById={snapshotsById}
              onEdit={editDeal}
              onDelete={setDeleteTarget}
            />
          </TabsContent>
          <TabsContent value="side-by-side">
            <DealSideBySide deals={comparisonDeals as SideBySideDeal[]} />
          </TabsContent>
          {/* forceMount: הגרפים חיים תמיד כדי שייצוא ה-PDF יוכל לצלם אותם
              מכל טאב; כשהטאב לא פעיל הם מוזזים מחוץ למסך (לא display:none) */}
          <TabsContent
            value="charts"
            forceMount
            className="data-[state=inactive]:fixed data-[state=inactive]:top-0 data-[state=inactive]:-start-[10000px] data-[state=inactive]:w-[900px] data-[state=inactive]:pointer-events-none"
            aria-hidden={undefined}
          >
            <DealCharts deals={comparisonDeals as ChartDeal[]} />
          </TabsContent>
        </Tabs>
        </>
      )}
      <QuickAddDealDialog open={quickAddOpen} onOpenChange={setQuickAddOpen} onSaved={handleQuickAdded} />

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>למחוק את העסקה?</AlertDialogTitle>
            <AlertDialogDescription>
              "{deleteTarget?.name}" תימחק לצמיתות מההשוואה. אי אפשר לבטל את הפעולה.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>ביטול</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => { if (deleteTarget) removeDeal(deleteTarget); setDeleteTarget(null); }}
            >
              מחק
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
