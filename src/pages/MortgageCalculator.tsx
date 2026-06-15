import { useState, useMemo, useEffect, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  calculateMortgage,
  generateAmortizationSchedule,
  sensitivityAnalysis,
  MARKET_CONSTANTS,
  simulateMadadImpact,
} from '@/lib/calculations/mortgage-calculator';
import {
  MortgageTrack,
  MortgageCalculatorOutput,
  MortgageTrackType,
  AmortizationRow,
  SensitivityResult,
} from '@/types/mortgage-calculator';
import { Plus, Trash2, Home as HomeIcon, Import, RotateCcw, ArrowLeft } from 'lucide-react';
import { SaveSnapshotButton } from '@/components/SaveSnapshotButton';
import { formatCurrency } from '@/lib/validation/validators';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend,
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  BarChart, Bar,
} from 'recharts';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { save, load, clear } from '@/lib/storage';
import { useAuth } from '@/contexts/AuthContext';
import { getBudgetResults, getBusinessPlanData } from '@/lib/flow';
import { ExportButton } from '@/components/ExportButton';
import { InfoTooltip } from '@/components/InfoTooltip';
import { LABELS } from '@/lib/content/labels';
import { indexLawNote } from '@/lib/constants/regulations';
import { EmptyState } from '@/components/ui/empty-state';
import NextStepCard from '@/components/NextStepCard';
import { useJourney } from '@/hooks/useJourney';
import { GlossaryLink } from '@/components/GlossaryLink';
import { CHART, CHART_SERIES } from '@/lib/chart-colors';
import { Link } from 'react-router-dom';

const TRACK_COLORS = CHART_SERIES;
const PI_COLORS = [CHART.emeraldDeep, CHART.gold];

const trackTypeLabels: Record<MortgageTrackType, string> = {
  fixedUnlinked: 'קבועה לא צמודה',
  fixedLinked: 'קבועה צמודה',
  prime: 'פריים',
  variableLinked: 'משתנה צמודה',
};

function KPICard({ title, value, subtitle, color }: { title: string; value: string; subtitle?: string; color?: string }) {
  return (
    <Card className="border-0 shadow-sm">
      <CardContent className="p-4">
        <p className="text-[11px] text-muted-foreground mb-1">{title}</p>
        <p className={cn('text-2xl font-bold', color)}>{value}</p>
        {subtitle && <p className="text-[11px] text-muted-foreground mt-0.5">{subtitle}</p>}
      </CardContent>
    </Card>
  );
}

const DEFAULT_TRACK: MortgageTrack = { id: '1', name: 'קבועה לא צמודה', type: 'fixedUnlinked', principal: 800000, annualInterestRate: 5.5, years: 25 };

function resolveTrackPrincipals(tracks: MortgageTrack[], totalMortgageAmount: number): MortgageTrack[] {
  const usesAllocation = tracks.some((t) => t.allocationMode && t.allocationMode !== 'amount');
  if (!usesAllocation) return tracks;

  const amountTracks = tracks.filter((t) => !t.allocationMode || t.allocationMode === 'amount');
  const percentTracks = tracks.filter((t) => t.allocationMode === 'percent');
  const remainderTracks = tracks.filter((t) => t.allocationMode === 'remainder');

  const amountSum = amountTracks.reduce((sum, t) => sum + (t.principal || 0), 0);
  const percentSum = percentTracks.reduce((sum, t) => sum + (t.allocationValue || 0), 0);
  const percentAmount = totalMortgageAmount * (percentSum / 100);
  const remainderAmount = Math.max(0, totalMortgageAmount - amountSum - percentAmount);
  const remainderPerTrack = remainderTracks.length > 0 ? remainderAmount / remainderTracks.length : 0;

  return tracks.map((track) => {
    if (!track.allocationMode || track.allocationMode === 'amount') return track;
    if (track.allocationMode === 'percent') {
      return { ...track, principal: Math.round(totalMortgageAmount * ((track.allocationValue || 0) / 100)) };
    }
    return { ...track, principal: Math.round(remainderPerTrack) };
  });
}

export default function MortgageCalculator() {
  const { user } = useAuth();
  const uid = user?.id;
  const savedM = load<{ tracks: MortgageTrack[]; totalMortgageAmount: number; freeCashFlow: number; isOffPlan: boolean; propertyPrice: number; madadRate: number; madadYears: number; touched?: boolean }>('mortgage');
  const budgetData = getBudgetResults();
  // Business-plan numbers (the actual deal) take priority over the budget
  // ceiling — but only when the student really filled them in.
  const bpData = (() => {
    const d = getBusinessPlanData();
    return d?.touched ? d : null;
  })();
  const [tracks, setTracks] = useState<MortgageTrack[]>(savedM?.tracks ?? [DEFAULT_TRACK]);
  const [totalMortgageAmount, setTotalMortgageAmount] = useState(
    savedM?.totalMortgageAmount ?? bpData?.mortgageAmount ?? budgetData?.maxMortgage ?? DEFAULT_TRACK.principal,
  );
  const [freeCashFlow, setFreeCashFlow] = useState(savedM?.freeCashFlow ?? budgetData?.freeCashFlow ?? 20000);
  const [isOffPlan, setIsOffPlan] = useState(savedM?.isOffPlan ?? false);
  const [propertyPrice, setPropertyPrice] = useState(savedM?.propertyPrice ?? 1600000);
  const [madadRate, setMadadRate] = useState(savedM?.madadRate ?? MARKET_CONSTANTS.DEFAULT_MADAD_RATE);
  const [madadYears, setMadadYears] = useState(savedM?.madadYears ?? 3);
  // True only after real user input — prefilled defaults must not complete milestones.
  const [touched, setTouched] = useState(!!savedM?.touched);
  const touch = () => setTouched(true);

  // Auto-save
  useEffect(() => {
    save('mortgage', { tracks, totalMortgageAmount, freeCashFlow, monthlyIncome: freeCashFlow, isOffPlan, propertyPrice, madadRate, madadYears, touched }, uid);
  }, [tracks, totalMortgageAmount, freeCashFlow, isOffPlan, propertyPrice, madadRate, madadYears, touched, uid]);

  const handleImportBudget = () => {
    if (!budgetData) return;
    touch();
    setTotalMortgageAmount(budgetData.maxMortgage);
    setFreeCashFlow(budgetData.freeCashFlow);
    setTracks([{ ...DEFAULT_TRACK, principal: budgetData.maxMortgage, allocationMode: 'amount', allocationValue: budgetData.maxMortgage }]);
  };

  const handleImportBusinessPlan = () => {
    if (!bpData) return;
    touch();
    setTotalMortgageAmount(bpData.mortgageAmount);
    setTracks([{
      ...DEFAULT_TRACK,
      principal: bpData.mortgageAmount,
      annualInterestRate: bpData.mortgageInterestRate,
      years: bpData.mortgageYears,
      allocationMode: 'amount',
      allocationValue: bpData.mortgageAmount,
    }]);
  };

  const handleReset = () => {
    if (!window.confirm('בטוח? כל הנתונים יימחקו')) return;
    setTracks([DEFAULT_TRACK]); setTotalMortgageAmount(DEFAULT_TRACK.principal); setFreeCashFlow(20000); setIsOffPlan(false);
    setPropertyPrice(1600000); setMadadRate(MARKET_CONSTANTS.DEFAULT_MADAD_RATE); setMadadYears(3);
    setTouched(false);
    clear('mortgage', uid); clear('mortgage_results', uid);
  };

  // Real-time calculation
  const resolvedTracks = useMemo(() => resolveTrackPrincipals(tracks, totalMortgageAmount), [tracks, totalMortgageAmount]);
  const results: MortgageCalculatorOutput | null = useMemo(() => {
    const hasValidTrack = resolvedTracks.some(t => t.principal > 0);
    if (!hasValidTrack) return null;
    return calculateMortgage({ tracks: resolvedTracks });
  }, [resolvedTracks]);

  const amortization: AmortizationRow[] = useMemo(() => {
    if (!results) return [];
    return generateAmortizationSchedule(resolvedTracks);
  }, [results, resolvedTracks]);

  const sensitivity: SensitivityResult[] = useMemo(() => {
    if (!results) return [];
    return sensitivityAnalysis(resolvedTracks);
  }, [results, resolvedTracks]);

  const totalPrincipal = resolvedTracks.reduce((sum, t) => sum + t.principal, 0);
  const dtiRatio =
    results && freeCashFlow > 0 && Number.isFinite(results.totalMonthlyPayment)
      ? results.totalMonthlyPayment / freeCashFlow
      : null;
  const dtiPercent = dtiRatio !== null ? dtiRatio * 100 : 0;

  // Save results for flow (clear if null)
  useEffect(() => {
    if (results) save('mortgage_results', results, uid);
    else clear('mortgage_results', uid);
  }, [results, uid]);

  // Auto-mark mortgage milestone — only after real user input (not defaults).
  const { complete: completeMilestone, isDone } = useJourney();
  const markedRef = useRef(false);
  useEffect(() => {
    if (
      !markedRef.current &&
      uid &&
      touched &&
      results &&
      results.totalMonthlyPayment > 0 &&
      !isDone('mortgage')
    ) {
      markedRef.current = true;
      completeMilestone('mortgage', {
        totalMonthlyPayment: results.totalMonthlyPayment,
      }).catch(() => {
        markedRef.current = false;
      });
    }
  }, [uid, touched, results, isDone, completeMilestone]);

  const madadResult = isOffPlan && propertyPrice > 0
    ? simulateMadadImpact({ linkedAmount: propertyPrice, annualMadadRate: madadRate, years: madadYears })
    : null;

  const addTrack = () => {
    touch();
    setTracks([...tracks, {
      id: Date.now().toString(),
      name: 'מסלול חדש',
      type: 'fixedUnlinked',
      principal: 0,
      annualInterestRate: 5.5,
      years: 25,
    }]);
  };

  const removeTrack = (id: string) => { touch(); setTracks(tracks.filter((t) => t.id !== id)); };
  const updateTrack = (id: string, updates: Partial<MortgageTrack>) => {
    touch();
    setTracks(tracks.map((t) => (t.id === id ? { ...t, ...updates } : t)));
  };

  return (
    <div className="space-y-6">
      <div className="md:grid md:grid-cols-5 md:gap-8">
        {/* Input Section */}
        <div className="md:col-span-2 space-y-4 md:sticky md:top-28 md:self-start">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <HomeIcon className="w-6 h-6 text-primary" />
              מחשבון משכנתא
            </h1>
            <div className="flex items-center gap-1">
              <SaveSnapshotButton
                toolKey="mortgage"
                disabled={!results}
                getData={() => ({
                  inputs: { tracks: resolvedTracks, totalMortgageAmount, freeCashFlow, isOffPlan, propertyPrice, madadRate, madadYears },
                  results,
                })}
              />
              <Button variant="ghost" size="sm" onClick={handleReset} className="text-muted-foreground h-8 gap-1">
                <RotateCcw className="w-3.5 h-3.5" /> אפס
              </Button>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            בנה תמהיל, השווה מסלולים וראה כמה תשלם.
          </p>

          {bpData && (
            <Button variant="outline" size="sm" onClick={handleImportBusinessPlan} className="w-full gap-1.5 border-primary/30 text-primary">
              <Import className="w-4 h-4" /> ייבא מהתוכנית העסקית ({formatCurrency(bpData.mortgageAmount)})
            </Button>
          )}
          {budgetData && (
            <Button variant="outline" size="sm" onClick={handleImportBudget} className="w-full gap-1.5">
              <Import className="w-4 h-4" /> ייבא ממחשבון התקציב
            </Button>
          )}
          <div className="text-xs bg-muted/50 p-2.5 rounded-lg">
            פריים {MARKET_CONSTANTS.PRIME_RATE}% · ריבית בנק ישראל {MARKET_CONSTANTS.BOI_RATE}%
          </div>

          <Card className="border-0 shadow-sm bg-muted/40">
            <CardContent className="p-3 flex items-center justify-between gap-3">
              <div>
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">תזרים פנוי</p>
                <p className="text-xs text-muted-foreground">מגיע ממחשבון התקציב ומשמש כמגבלת ההחזר החודשי</p>
              </div>
              <div className="text-left">
                <p className="text-lg font-bold tabular-nums">{formatCurrency(freeCashFlow)}</p>
                <p className="text-[11px] text-muted-foreground">לעריכה ידנית במקרה הצורך</p>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-1.5">
            <Label className="text-xs">סך משכנתא כולל</Label>
            <Input type="number" min="0" value={totalMortgageAmount ?? ''} onChange={(e) => { touch(); setTotalMortgageAmount(Number(e.target.value)); }} />
            <p className="text-[11px] text-muted-foreground">זהו הסכום הכולל שצריך להתפזר בין המסלולים. אפשר לחלק באחוזים, בסכומים או כיתרה.</p>
          </div>

          {/* Tracks */}
          {tracks.map((track, index) => (
            <Card key={track.id} className="border shadow-sm">
              <CardContent className="p-3 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold">מסלול {index + 1}</span>
                  {tracks.length > 1 && (
                    <Button variant="ghost" size="sm" onClick={() => removeTrack(track.id)} className="h-7 w-7 p-0 text-destructive">
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="col-span-2">
                    <Label className="text-[11px]">סוג מסלול</Label>
                    <Select value={track.type} onValueChange={(v: MortgageTrackType) => updateTrack(track.id, { type: v, name: trackTypeLabels[v] })}>
                      <SelectTrigger className="h-9" aria-label="סוג מסלול"><SelectValue placeholder={LABELS.common.selectPlaceholder} /></SelectTrigger>
                      <SelectContent>
                        {Object.entries(trackTypeLabels).map(([k, v]) => (
                          <SelectItem key={k} value={k}>{v}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="col-span-2">
                    <Label className="text-[11px]">אופן הקצאה</Label>
                    <Select
                      value={track.allocationMode ?? 'amount'}
                      onValueChange={(v) => updateTrack(track.id, { allocationMode: (v as MortgageTrack['allocationMode']) ?? 'amount' })}
                    >
                      <SelectTrigger className="h-9" aria-label="אופן הקצאה"><SelectValue placeholder={LABELS.common.selectPlaceholder} /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="amount">סכום</SelectItem>
                        <SelectItem value="percent">אחוז מסך המשכנתא</SelectItem>
                        <SelectItem value="remainder">יתרה</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {((track.allocationMode ?? 'amount') === 'amount') && (
                    <div>
                      <Label className="text-[11px]">סכום (₪)</Label>
                      <Input type="number" min="0" className="h-9" value={track.principal ?? ''} onChange={(e) => updateTrack(track.id, { principal: Number(e.target.value) })} />
                    </div>
                  )}
                  {track.allocationMode === 'percent' && (
                    <div>
                      <Label className="text-[11px]">אחוז (%)</Label>
                      <Input type="number" min="0" max="100" step="0.1" className="h-9" value={track.allocationValue ?? ''} onChange={(e) => updateTrack(track.id, { allocationValue: Number(e.target.value) })} />
                    </div>
                  )}
                  {track.allocationMode === 'remainder' && (
                    <div className="col-span-2 text-[11px] text-muted-foreground rounded-lg bg-muted/60 px-3 py-2">
                      מסלול זה יקבל את היתרה אחרי המסלולים האחרים.
                    </div>
                  )}
                  <div>
                    <Label className="text-[11px]">ריבית (%)</Label>
                    <Input type="number" min="0" step="0.1" className="h-9" value={track.annualInterestRate ?? ''} onChange={(e) => updateTrack(track.id, { annualInterestRate: Number(e.target.value) })} />
                  </div>
                  <div>
                    <Label className="text-[11px]">שנים</Label>
                    <Input type="number" min="1" className="h-9" value={track.years ?? ''} onChange={(e) => updateTrack(track.id, { years: Number(e.target.value) })} />
                  </div>
                  <div className="col-span-2 text-[11px] text-muted-foreground flex justify-between">
                    <span>סכום מחושב</span>
                    <span className="font-semibold tabular-nums">{formatCurrency(resolvedTracks[index]?.principal ?? track.principal)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          <Button onClick={addTrack} variant="outline" size="sm" className="w-full">
            <Plus className="h-4 w-4 ml-1" /> הוסף מסלול
          </Button>

          {/* Madad */}
          <Card className="border shadow-sm">
            <CardContent className="p-3 space-y-3">
              <div className="flex items-center gap-2">
                <Switch checked={isOffPlan} onCheckedChange={(v) => { touch(); setIsOffPlan(v); }} />
                <Label className="text-xs flex items-center gap-1">רכישה מקבלן (מדד תשומות) <InfoTooltip text={indexLawNote()} /></Label>
              </div>
              {isOffPlan && (
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <Label className="text-[10px]">מחיר נכס</Label>
                    <Input type="number" min="0" className="h-8 text-sm" value={propertyPrice ?? ''} onChange={(e) => { touch(); setPropertyPrice(Number(e.target.value)); }} />
                  </div>
                  <div>
                    <Label className="text-[10px]">מדד שנתי %</Label>
                    <Input type="number" min="0" step="0.1" className="h-8 text-sm" value={madadRate} onChange={(e) => { touch(); setMadadRate(Number(e.target.value)); }} />
                  </div>
                  <div>
                    <Label className="text-[10px]">תקופת בנייה צפויה</Label>
                    <Input type="number" min="1" className="h-8 text-sm" value={madadYears} onChange={(e) => { touch(); setMadadYears(Number(e.target.value)); }} />
                  </div>
                  {madadResult && (
                    <div className="col-span-3 text-center p-2 bg-muted/50 rounded-lg">
                      <span className="text-xs text-muted-foreground">תוספת מדד: </span>
                      <span className="text-sm font-bold text-destructive">{formatCurrency(madadResult.additionalCost)}</span>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Results Section */}
        <div className="md:col-span-3 mt-6 md:mt-0 space-y-4">
          {results ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
              {/* KPIs */}
              <div className="grid grid-cols-2 gap-3">
                <KPICard
                  title="תשלום חודשי"
                  value={formatCurrency(results.totalMonthlyPayment)}
                  subtitle={dtiRatio !== null ? `מתוך תזרים פנוי: ${dtiPercent.toFixed(1)}%` : 'אין תזרים פנוי למימון'}
                  color={dtiRatio && dtiRatio > 1 ? 'text-red-600' : undefined}
                />
                <KPICard
                  title="תזרים פנוי"
                  value={formatCurrency(freeCashFlow)}
                />
                <KPICard
                  title="ריבית משוקללת"
                  value={`${results.weightedAverageInterest.toFixed(2)}%`}
                />
                <KPICard
                  title="סך קרן"
                  value={formatCurrency(totalPrincipal)}
                />
                <KPICard
                  title="סך ריבית"
                  value={formatCurrency(results.totalInterestPaid)}
                  subtitle={totalPrincipal > 0 ? `${((results.totalInterestPaid / totalPrincipal) * 100).toFixed(0)}% מהקרן` : undefined}
                />
              </div>

              {/* Cash Flow Bar */}
              {dtiRatio !== null ? (
                <Card className="border-0 shadow-sm">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span className="text-muted-foreground flex items-center gap-1">
                        <GlossaryLink term="dti">החזר מול תזרים פנוי</GlossaryLink>
                        <InfoTooltip text="כאן רואים אם ההחזר החודשי נשאר בתוך התזרים הפנוי של משק הבית" />
                      </span>
                      <span className={cn('font-semibold', results.totalMonthlyPayment <= freeCashFlow ? 'text-green-600' : 'text-red-600')}>
                        {formatCurrency(results.totalMonthlyPayment)} / {formatCurrency(freeCashFlow)}
                      </span>
                    </div>
                    <div className="h-2.5 bg-muted rounded-full overflow-hidden">
                      <motion.div
                        className={cn('h-full rounded-full', results.totalMonthlyPayment <= freeCashFlow ? 'bg-green-500' : 'bg-red-500')}
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min((freeCashFlow > 0 ? results.totalMonthlyPayment / freeCashFlow : 1) * 100, 100)}%` }}
                        transition={{ duration: 0.5 }}
                      />
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <EmptyState compact description={LABELS.empty.dtiNeedsIncome} />
              )}

              {/* Principal vs Interest Donut */}
              <Card className="border-0 shadow-sm">
                <CardContent className="p-4">
                  <p className="text-sm font-semibold mb-2">קרן מול ריבית</p>
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'קרן', value: totalPrincipal },
                          { name: 'ריבית', value: results.totalInterestPaid },
                        ]}
                        cx="50%" cy="50%" innerRadius={65} outerRadius={100}
                        paddingAngle={3} dataKey="value"
                      >
                        <Cell fill={PI_COLORS[0]} />
                        <Cell fill={PI_COLORS[1]} />
                      </Pie>
                      <Tooltip formatter={(v) => formatCurrency(Number(v))} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Amortization Chart */}
              {amortization.length > 0 && (
                <Card className="border-0 shadow-sm">
                  <CardContent className="p-4">
                    <p className="text-sm font-semibold mb-2">גרף אמורטיזציה</p>
                    <div id="mortgage-chart">
                    <ResponsiveContainer width="100%" height={280}>
                      <AreaChart data={amortization}>
                        <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                        <XAxis dataKey="year" reversed />
                        <YAxis tickFormatter={(v) => `₪${(v / 1000).toFixed(0)}k`} />
                        <Tooltip formatter={(v) => formatCurrency(Number(v))} />
                        <Legend />
                        <Area type="monotone" dataKey="principalPayment" name="קרן" stackId="1" stroke={CHART.emeraldDeep} fill={CHART.emeraldDeep} fillOpacity={0.7} />
                        <Area type="monotone" dataKey="interestPayment" name="ריבית" stackId="1" stroke={CHART.gold} fill={CHART.gold} fillOpacity={0.5} />
                      </AreaChart>
                    </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Sensitivity Analysis */}
              {sensitivity.length > 0 && (
                <Card className="border-0 shadow-sm">
                  <CardContent className="p-4">
                    <p className="text-sm font-semibold mb-2">ניתוח רגישות — מה קורה אם הריבית זזה</p>
                    <p className="text-[11px] text-muted-foreground mb-3">התרשים מציג את ההחזר החודשי הכולל בכל תרחיש ריבית, ביחס למסלול הנוכחי.</p>
                    <Tabs defaultValue="chart">
                      <TabsList className="grid w-full grid-cols-2 mb-4">
                        <TabsTrigger value="chart">גרף</TabsTrigger>
                        <TabsTrigger value="table">טבלה</TabsTrigger>
                      </TabsList>
                      <TabsContent value="chart">
                        <ResponsiveContainer width="100%" height={250}>
                          <BarChart data={sensitivity.map(s => ({
                            name: s.deltaPercent === 0 ? 'נוכחי' : `${s.deltaPercent > 0 ? '+' : ''}${s.deltaPercent}%`,
                            payment: Math.round(s.totalMonthlyPayment),
                          }))}>
                            <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                            <XAxis dataKey="name" />
                            <YAxis tickFormatter={(v) => `₪${(v / 1000).toFixed(1)}k`} />
                            <Tooltip formatter={(v) => formatCurrency(Number(v))} />
                            <Bar dataKey="payment" name="החזר חודשי" fill={CHART.emerald} radius={[6, 6, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </TabsContent>
                      <TabsContent value="table">
                        <div className="overflow-x-auto">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>שינוי ריבית</TableHead>
                                <TableHead className="text-right">החזר חודשי</TableHead>
                                <TableHead className="text-right">פער מהבסיס</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {sensitivity.map((s) => {
                                const base = sensitivity.find(x => x.deltaPercent === 0)?.totalMonthlyPayment || 0;
                                const diff = s.totalMonthlyPayment - base;
                                return (
                                  <TableRow key={s.deltaPercent} className={s.deltaPercent === 0 ? 'bg-primary/5 font-bold' : ''}>
                                    <TableCell>{s.deltaPercent === 0 ? 'נוכחי' : `${s.deltaPercent > 0 ? '+' : ''}${s.deltaPercent}%`}</TableCell>
                                    <TableCell className="text-right tabular-nums">{formatCurrency(s.totalMonthlyPayment)}</TableCell>
                                    <TableCell className={cn('text-right tabular-nums', diff > 0 ? 'text-red-600' : diff < 0 ? 'text-green-600' : '')}>
                                      {diff === 0 ? '—' : `${diff > 0 ? '+' : ''}${formatCurrency(diff)}`}
                                    </TableCell>
                                  </TableRow>
                                );
                              })}
                            </TableBody>
                          </Table>
                        </div>
                      </TabsContent>
                    </Tabs>
                  </CardContent>
                </Card>
              )}

              {/* Track Details */}
              {tracks.length > 1 && results.tracks.length > 1 && (
                <Card className="border-0 shadow-sm">
                  <CardContent className="p-4">
                    <p className="text-sm font-semibold mb-2">פירוט מסלולים</p>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>מסלול</TableHead>
                            <TableHead className="text-right">הקצאה</TableHead>
                            <TableHead className="text-right">החזר חודשי</TableHead>
                            <TableHead className="text-right">ריבית כוללת</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {results.tracks.map((tr) => {
                            const track = tracks.find(t => t.id === tr.trackId);
                            if (!track) return null;
                            return (
                              <TableRow key={tr.trackId}>
                                <TableCell className="font-medium">{track.name}</TableCell>
                                <TableCell className="text-right tabular-nums">{formatCurrency(track.principal)}</TableCell>
                                <TableCell className="text-right tabular-nums">{formatCurrency(tr.monthlyPayment)}</TableCell>
                                <TableCell className="text-right tabular-nums">{formatCurrency(tr.totalInterestPaid)}</TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              )}
              {/* Next step in the journey */}
              <NextStepCard currentMilestone="mortgage" />

              {/* CTA + Export */}
              <div className="flex flex-col sm:flex-row gap-2">
                <Link to="/business-plan" className="flex-1">
                  <Button variant="default" className="w-full gap-1.5">
                    תוכנית עסקית <ArrowLeft className="w-4 h-4" />
                  </Button>
                </Link>
                <ExportButton
                  title="דוח משכנתא"
                  chartElementId="mortgage-chart"
                  executiveSummary={[
                    `סך משכנתא: ${formatCurrency(totalMortgageAmount)}`,
                    `תשלום חודשי: ${formatCurrency(results.totalMonthlyPayment)}`,
                    `תזרים פנוי: ${formatCurrency(freeCashFlow)}`,
                    `ריבית משוקללת: ${results.weightedAverageInterest.toFixed(2)}%`,
                  ]}
                  sections={[
                    { title: 'סיכום', items: [
                      { label: 'סך משכנתא', value: formatCurrency(totalMortgageAmount) },
                      { label: 'תשלום חודשי', value: formatCurrency(results.totalMonthlyPayment) },
                      { label: 'תזרים פנוי', value: formatCurrency(freeCashFlow) },
                      { label: 'ריבית משוקללת', value: `${results.weightedAverageInterest.toFixed(2)}%` },
                      { label: 'סך קרן', value: formatCurrency(totalPrincipal) },
                      { label: 'סך ריבית', value: formatCurrency(results.totalInterestPaid) },
                    ]},
                    { title: 'מסלולים', items: tracks.map(t => (
                      { label: t.name, value: `${formatCurrency(t.principal)} · ${t.annualInterestRate}% · ${t.years} שנים` }
                    ))},
                  ]}
                />
              </div>
            </motion.div>
          ) : (
            <EmptyState
              icon={<HomeIcon className="w-6 h-6" />}
              description="הזן סך משכנתא והקצה אותה למסלולים כדי לראות תוצאות"
            />
          )}
        </div>
      </div>
    </div>
  );
}
