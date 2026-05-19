import { useState, useMemo, useEffect, type ReactNode } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { BarChart3, Import, RotateCcw, TrendingUp } from 'lucide-react';
import { SaveSnapshotButton } from '@/components/SaveSnapshotButton';
import { calculateBusinessPlan, BusinessPlanOutput, ScenarioResult } from '@/lib/calculations/business-plan';
import { calculateMortgageMonthlyPayment } from '@/lib/calculations/mortgage-calculator';
import { formatCurrency } from '@/lib/validation/validators';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { save, load, clear } from '@/lib/storage';
import { useAuth } from '@/contexts/AuthContext';
import { getBudgetResults } from '@/lib/flow';
import { ExportButton } from '@/components/ExportButton';
import { InfoTooltip } from '@/components/InfoTooltip';

const SCENARIO_COLORS = {
  pessimistic: { bg: 'bg-red-50 dark:bg-red-950/30', border: 'border-red-200 dark:border-red-800', text: 'text-red-600 dark:text-red-400', chart: '#EF4444' },
  average: { bg: 'bg-blue-50 dark:bg-blue-950/30', border: 'border-blue-200 dark:border-blue-800', text: 'text-blue-600 dark:text-blue-400', chart: '#3B82F6' },
  optimistic: { bg: 'bg-green-50 dark:bg-green-950/30', border: 'border-green-200 dark:border-green-800', text: 'text-green-600 dark:text-green-400', chart: '#22C55E' },
};

const SCENARIO_HELP: Record<string, string> = {
  'מחמיר': 'בודק אם העסקה עדיין סבירה גם בלי עליית ערך.',
  'בינוני': 'תרחיש שמרני-ריאלי לקבלת החלטה יומיומית.',
  'טוב': 'בודק את פוטנציאל העסקה אם השוק עולה בקצב מתון.',
};

function ScenarioCard({ scenario, style, monthlyCashflow }: { scenario: ScenarioResult; style: typeof SCENARIO_COLORS.pessimistic; monthlyCashflow: number }) {
  return (
    <Card className={cn('h-full border', style.border, style.bg)}>
      <CardContent className="p-4 h-full flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className={cn('text-sm font-bold', style.text)}>{scenario.label}</span>
          <span className={cn('text-xs font-semibold px-2 py-0.5 rounded-full', style.bg, style.text)}>
            {scenario.annualAppreciation}% שנתי
          </span>
        </div>

        <div className="grid flex-1 gap-2">
          <div className="min-w-0">
            <p className="text-[11px] text-muted-foreground">שווי נכס בסוף תקופה</p>
            <p className="text-lg font-bold tabular-nums leading-tight break-words">{formatCurrency(scenario.propertyValueAtEnd)}</p>
          </div>
          <div className="min-w-0">
            <p className="text-[11px] text-muted-foreground">רווח כולל</p>
            <p className={cn('text-lg font-bold tabular-nums leading-tight break-words', scenario.totalProfit >= 0 ? 'text-green-600' : 'text-red-600')}>
              {formatCurrency(scenario.totalProfit)}
            </p>
          </div>
          <div className="min-w-0">
            <p className="text-[11px] text-muted-foreground">תזרים חודשי</p>
            <p className={cn('text-base font-semibold tabular-nums leading-tight break-words', monthlyCashflow >= 0 ? 'text-green-600' : 'text-red-600')}>
              {formatCurrency(monthlyCashflow)}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <p className="text-[11px] text-muted-foreground flex items-center gap-1">תשואה שנתית על ההון <InfoTooltip text="התזרים השנתי נטו ביחס להון שנכנס לעסקה" /></p>
              <p className="text-base font-semibold tabular-nums">{(scenario.annualEquityReturn * 100).toFixed(1)}%</p>
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground flex items-center gap-1">תשואה כוללת על ההון <InfoTooltip text="הרווח הכולל בסוף תקופת ההחזקה ביחס להון שהושקע" /></p>
              <p className="text-base font-semibold tabular-nums">{(scenario.totalEquityReturn * 100).toFixed(1)}%</p>
            </div>
          </div>
          <p className="text-[11px] text-muted-foreground border-t pt-2 leading-relaxed">
            {SCENARIO_HELP[scenario.label]}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

function InputSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <Card className="border-0 shadow-sm bg-background/80">
      <CardContent className="p-3 space-y-3">
        <div className="space-y-1">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{title}</p>
          {description && <p className="text-[11px] leading-relaxed text-muted-foreground">{description}</p>}
        </div>
        {children}
      </CardContent>
    </Card>
  );
}

function Field({
  label,
  hint,
  action,
  children,
  className,
}: {
  label: string;
  hint?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('min-w-0 space-y-1.5', className)}>
      <div className="flex min-h-6 items-center justify-between gap-2">
        <Label className="text-xs font-medium text-foreground/80">{label}</Label>
        {action}
      </div>
      {children}
      {hint && <p className="text-[10px] leading-relaxed text-muted-foreground">{hint}</p>}
    </div>
  );
}

const BP_DEFAULTS = {
  purchasePrice: 1200000,
  sideCosts: 40000,
  renovationCost: 0,
  equityInvested: 400000,
  mortgageAmount: 800000,
  mortgageMonthlyPayment: 4500,
  mortgageInterestRate: 5,
  mortgageYears: 25,
  expectedMonthlyRent: 4000,
  annualOperatingCosts: 8000,
  holdingPeriodYears: 10,
  baseAppreciation: 1,
  manualMode: true,
  customRates: { pessimistic: 0, average: 1, optimistic: 2 },
  urbanRenewalUpliftMode: 'amount' as const,
  urbanRenewalUpliftValue: 0,
  manualMortgageAmount: false,
  manualMortgageMonthlyPayment: false,
};

type EditingDeal = { id: string; name: string; notes?: string | null };

type UpliftMode = 'amount' | 'percent';

export default function BusinessPlan() {
  const { user } = useAuth();
  const uid = user?.id;
  const saved = load<typeof BP_DEFAULTS>('business_plan');
  const [editingDeal, setEditingDeal] = useState<EditingDeal | null>(() => load<EditingDeal>('business_plan_editing'));
  const [purchasePrice, setPurchasePrice] = useState(saved?.purchasePrice ?? BP_DEFAULTS.purchasePrice);
  const [sideCosts, setSideCosts] = useState(saved?.sideCosts ?? BP_DEFAULTS.sideCosts);
  const [renovationCost, setRenovationCost] = useState(saved?.renovationCost ?? BP_DEFAULTS.renovationCost);
  const [equityInvested, setEquityInvested] = useState(saved?.equityInvested ?? BP_DEFAULTS.equityInvested);
  const [mortgageAmount, setMortgageAmount] = useState(saved?.mortgageAmount ?? BP_DEFAULTS.mortgageAmount);
  const [mortgageMonthlyPayment, setMortgageMonthlyPayment] = useState(saved?.mortgageMonthlyPayment ?? BP_DEFAULTS.mortgageMonthlyPayment);
  const [mortgageInterestRate, setMortgageInterestRate] = useState(saved?.mortgageInterestRate ?? BP_DEFAULTS.mortgageInterestRate);
  const [mortgageYears, setMortgageYears] = useState(saved?.mortgageYears ?? BP_DEFAULTS.mortgageYears);
  const [expectedMonthlyRent, setExpectedMonthlyRent] = useState(saved?.expectedMonthlyRent ?? BP_DEFAULTS.expectedMonthlyRent);
  const [annualOperatingCosts, setAnnualOperatingCosts] = useState(saved?.annualOperatingCosts ?? BP_DEFAULTS.annualOperatingCosts);
  const [holdingPeriodYears, setHoldingPeriodYears] = useState(saved?.holdingPeriodYears ?? BP_DEFAULTS.holdingPeriodYears);
  const [baseAppreciation, setBaseAppreciation] = useState(saved?.baseAppreciation ?? BP_DEFAULTS.baseAppreciation);
  const [manualMode, setManualMode] = useState(saved?.manualMode ?? BP_DEFAULTS.manualMode);
  const [customRates, setCustomRates] = useState(saved?.customRates ?? BP_DEFAULTS.customRates);
  const [urbanRenewalUpliftMode, setUrbanRenewalUpliftMode] = useState<UpliftMode>(saved?.urbanRenewalUpliftMode ?? BP_DEFAULTS.urbanRenewalUpliftMode);
  const [urbanRenewalUpliftValue, setUrbanRenewalUpliftValue] = useState(saved?.urbanRenewalUpliftValue ?? BP_DEFAULTS.urbanRenewalUpliftValue);
  const [manualMortgageAmount, setManualMortgageAmount] = useState(saved?.manualMortgageAmount ?? BP_DEFAULTS.manualMortgageAmount);
  const [manualMortgageMonthlyPayment, setManualMortgageMonthlyPayment] = useState(saved?.manualMortgageMonthlyPayment ?? BP_DEFAULTS.manualMortgageMonthlyPayment);
  const [useSideCostPreset, setUseSideCostPreset] = useState(saved?.useSideCostPreset ?? true);
  const [selectedSideCosts, setSelectedSideCosts] = useState(saved?.selectedSideCosts ?? {
    broker: true,
    mortgageAdvice: true,
    lawyer: true,
    appraiser: true,
    extras: true,
  });

  // Auto-save
  useEffect(() => {
    save('business_plan', {
      purchasePrice, sideCosts, renovationCost, equityInvested, mortgageAmount,
      mortgageMonthlyPayment, mortgageInterestRate, mortgageYears, expectedMonthlyRent,
      annualOperatingCosts, holdingPeriodYears, baseAppreciation, manualMode, customRates,
      urbanRenewalUpliftMode, urbanRenewalUpliftValue, manualMortgageAmount,
      manualMortgageMonthlyPayment, useSideCostPreset, selectedSideCosts,
    }, uid);
  }, [purchasePrice, sideCosts, renovationCost, equityInvested, mortgageAmount,
    mortgageMonthlyPayment, mortgageInterestRate, mortgageYears, expectedMonthlyRent,
    annualOperatingCosts, holdingPeriodYears, baseAppreciation, manualMode, customRates,
    urbanRenewalUpliftMode, urbanRenewalUpliftValue, manualMortgageAmount,
    manualMortgageMonthlyPayment, useSideCostPreset, selectedSideCosts, uid]);

  const budgetData = getBudgetResults();

  const sideCostPresetTotal = useMemo(() => {
    const broker = selectedSideCosts.broker ? purchasePrice * 0.02 : 0;
    const mortgageAdvice = selectedSideCosts.mortgageAdvice ? 7000 : 0;
    const lawyer = selectedSideCosts.lawyer ? purchasePrice * 0.01 : 0;
    const appraiser = selectedSideCosts.appraiser ? 2000 : 0;
    const extras = selectedSideCosts.extras ? 5000 : 0;
    return broker + mortgageAdvice + lawyer + appraiser + extras;
  }, [purchasePrice, selectedSideCosts]);

  useEffect(() => {
    if (useSideCostPreset) {
      setSideCosts(Math.round(sideCostPresetTotal));
    }
  }, [sideCostPresetTotal, useSideCostPreset]);

  const autoMortgageAmount = useMemo(() => Math.max(0, purchasePrice - equityInvested), [purchasePrice, equityInvested]);
  const effectiveMortgageAmount = manualMortgageAmount ? mortgageAmount : autoMortgageAmount;
  const autoMortgageMonthlyPayment = useMemo(
    () => calculateMortgageMonthlyPayment(effectiveMortgageAmount, mortgageInterestRate, mortgageYears),
    [effectiveMortgageAmount, mortgageInterestRate, mortgageYears],
  );
  const effectiveMortgageMonthlyPayment = manualMortgageMonthlyPayment ? mortgageMonthlyPayment : autoMortgageMonthlyPayment;
  const effectiveUpliftValue = useMemo(() => {
    if (urbanRenewalUpliftMode === 'amount') return Math.max(0, urbanRenewalUpliftValue);
    return Math.max(0, purchasePrice * (urbanRenewalUpliftValue / 100));
  }, [urbanRenewalUpliftMode, urbanRenewalUpliftValue, purchasePrice]);

  const handleImportBudget = () => {
    if (!budgetData) return;
    setPurchasePrice(budgetData.maxPropertyValue);
    setEquityInvested(budgetData.equity);
    setMortgageAmount(budgetData.maxMortgage);
    setMortgageMonthlyPayment(budgetData.monthlyPayment);
    setManualMortgageAmount(false);
    setManualMortgageMonthlyPayment(false);
    setSideCosts(budgetData.purchaseTax + budgetData.sideCosts);
    setUseSideCostPreset(false);
    // Import interest rate from mortgage results if available
    const mortgageData = load<{ weightedAverageInterest?: number }>('mortgage_results');
    if (mortgageData?.weightedAverageInterest) {
      setMortgageInterestRate(mortgageData.weightedAverageInterest);
    }
  };

  const handleReset = () => {
    if (!window.confirm('בטוח? כל הנתונים יימחקו')) return;
    setPurchasePrice(BP_DEFAULTS.purchasePrice);
    setSideCosts(BP_DEFAULTS.sideCosts);
    setRenovationCost(BP_DEFAULTS.renovationCost);
    setEquityInvested(BP_DEFAULTS.equityInvested);
    setMortgageAmount(BP_DEFAULTS.mortgageAmount);
    setMortgageMonthlyPayment(BP_DEFAULTS.mortgageMonthlyPayment);
    setMortgageInterestRate(BP_DEFAULTS.mortgageInterestRate);
    setMortgageYears(BP_DEFAULTS.mortgageYears);
    setExpectedMonthlyRent(BP_DEFAULTS.expectedMonthlyRent);
    setAnnualOperatingCosts(BP_DEFAULTS.annualOperatingCosts);
    setHoldingPeriodYears(BP_DEFAULTS.holdingPeriodYears);
    setBaseAppreciation(BP_DEFAULTS.baseAppreciation);
    setManualMode(BP_DEFAULTS.manualMode);
    setCustomRates(BP_DEFAULTS.customRates);
    setUrbanRenewalUpliftMode(BP_DEFAULTS.urbanRenewalUpliftMode);
    setUrbanRenewalUpliftValue(BP_DEFAULTS.urbanRenewalUpliftValue);
    setManualMortgageAmount(BP_DEFAULTS.manualMortgageAmount);
    setManualMortgageMonthlyPayment(BP_DEFAULTS.manualMortgageMonthlyPayment);
    setUseSideCostPreset(true);
    setSelectedSideCosts({ broker: true, mortgageAdvice: true, lawyer: true, appraiser: true, extras: true });
    clear('business_plan', uid);
    clear('business_plan_editing');
    setEditingDeal(null);
  };

  const result: BusinessPlanOutput | null = useMemo(() => {
    if (purchasePrice <= 0) return null;
    return calculateBusinessPlan(
      {
        purchasePrice,
        sideCosts,
        renovationCost,
        equityInvested,
        mortgageAmount: effectiveMortgageAmount,
        mortgageMonthlyPayment: effectiveMortgageMonthlyPayment,
        mortgageInterestRate,
        mortgageYears,
        expectedMonthlyRent,
        annualOperatingCosts,
        holdingPeriodYears,
        urbanRenewalUpliftAmount: effectiveUpliftValue,
        urbanRenewalUpliftPercent: urbanRenewalUpliftMode === 'percent' ? urbanRenewalUpliftValue : undefined,
      },
      baseAppreciation,
      customRates,
    );
  }, [purchasePrice, sideCosts, renovationCost, equityInvested, effectiveMortgageAmount,
    effectiveMortgageMonthlyPayment, mortgageInterestRate, mortgageYears, expectedMonthlyRent,
    annualOperatingCosts, holdingPeriodYears, baseAppreciation, customRates,
    effectiveUpliftValue, urbanRenewalUpliftMode, urbanRenewalUpliftValue]);

  return (
    <div className="space-y-6">
      <div className="md:grid md:grid-cols-12 md:gap-6">
        {/* Input Section */}
        <div className="md:col-span-5 space-y-3 md:sticky md:top-28 md:self-start">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <TrendingUp className="w-6 h-6 text-primary" />
              תוכנית עסקית
            </h1>
            <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pb-1 sm:pb-0">
              <SaveSnapshotButton
                toolKey="business_plan"
                disabled={!result}
                buttonLabel={editingDeal ? 'עדכן עסקה' : 'שמור עסקה'}
                dialogTitle={editingDeal ? 'עדכן עסקה שמורה' : 'שמור עסקה בשם'}
                dialogDescription={editingDeal ? 'העסקה השמורה תתעדכן לפי הנתונים שמופיעים עכשיו.' : 'שמירת העסקה כדי להשוות אותה מול עסקאות אחרות בהמשך.'}
                nameLabel="שם העסקה"
                namePlaceholder='לדוגמה: "דירת 3 חדרים בחיפה — רח׳ הרצל"'
                defaultName={`עסקה ב-${formatCurrency(purchasePrice)} — ${new Date().toLocaleDateString('he-IL')}`}
                snapshotId={editingDeal?.id ?? null}
                initialName={editingDeal?.name ?? ''}
                initialNotes={editingDeal?.notes ?? ''}
                onSaved={() => {
                  clear('business_plan_editing');
                  setEditingDeal(null);
                }}
                getData={() => ({
                  inputs: {
                    purchasePrice, sideCosts, renovationCost, equityInvested,
                    mortgageAmount: effectiveMortgageAmount, mortgageMonthlyPayment: effectiveMortgageMonthlyPayment, mortgageInterestRate,
                    mortgageYears, expectedMonthlyRent, annualOperatingCosts,
                    holdingPeriodYears, baseAppreciation, manualMode, customRates,
                    urbanRenewalUpliftMode, urbanRenewalUpliftValue, manualMortgageAmount,
                    manualMortgageMonthlyPayment, useSideCostPreset, selectedSideCosts,
                  },
                  results: result,
                })}
              />
              <Button variant="ghost" size="sm" onClick={handleReset} className="text-muted-foreground h-8 gap-1">
                <RotateCcw className="w-3.5 h-3.5" /> אפס
              </Button>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            הזן את פרטי העסקה וראה 3 תרחישים לפי אחוז עלייה שנתי.
          </p>
          <p className="text-[11px] text-muted-foreground">
            מתאים בעיקר לעסקאות השקעה; לדירת מגורים עדיף להישען קודם על מחשבון התקציב והמשכנתא.
          </p>
          {editingDeal && (
            <div className="rounded-xl border border-primary/25 bg-primary/5 p-3 text-xs text-primary">
              עורך עכשיו את העסקה השמורה: <span className="font-bold">{editingDeal.name}</span>
            </div>
          )}

          {budgetData && (
            <Button variant="outline" size="sm" onClick={handleImportBudget} className="w-full gap-1.5 border-primary/30 text-primary">
              <Import className="w-4 h-4" /> ייבא נתונים ממחשבון התקציב
            </Button>
          )}

          <div className="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
            <Card className="border-0 shadow-sm bg-background/80">
              <CardContent className="p-3 space-y-4">
                <div className="space-y-3">
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">1. ???? ????</p>
                    <p className="text-[11px] leading-relaxed text-muted-foreground">????? ???? ?? ???? ?????? ???? ????? ??????.</p>
                  </div>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <Field label="???? ?????">
                      <Input className="h-10 text-base font-semibold" type="number" min="0" value={purchasePrice ?? ''} onChange={(e) => setPurchasePrice(Number(e.target.value))} />
                    </Field>
                    <Field label="???? ?????">
                      <Input className="h-10" type="number" min="0" value={renovationCost ?? ''} onChange={(e) => setRenovationCost(Number(e.target.value))} />
                    </Field>
                    <Field label="????? ?????" hint="?????">
                      <Input className="h-10" type="number" min="0" value={holdingPeriodYears ?? ''} onChange={(e) => setHoldingPeriodYears(Number(e.target.value))} />
                    </Field>
                  </div>
                </div>

                <div className="border-t pt-4 space-y-3">
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">2. ?????</p>
                    <p className="text-[11px] leading-relaxed text-muted-foreground">??? ????, ?????? ????? ?????.</p>
                  </div>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <Field label="??? ????">
                      <Input className="h-10 text-base font-semibold" type="number" min="0" value={equityInvested ?? ''} onChange={(e) => setEquityInvested(Number(e.target.value))} />
                    </Field>
                    <Field
                      label="???? ??????"
                      hint={!manualMortgageAmount ? '????? ????? ??? ???? ???? ?????' : undefined}
                      action={(
                        <Button type="button" variant="ghost" size="sm" className="h-6 px-2 text-[11px]" onClick={() => setManualMortgageAmount((v) => !v)}>
                          {manualMortgageAmount ? '???????' : '????? ?????'}
                        </Button>
                      )}
                    >
                      <Input className="h-10" type="number" min="0" value={manualMortgageAmount ? mortgageAmount : effectiveMortgageAmount} readOnly={!manualMortgageAmount} onChange={(e) => setMortgageAmount(Number(e.target.value))} />
                    </Field>
                    <Field
                      label="???? ?????"
                      hint={!manualMortgageMonthlyPayment ? '????? ??? ?????, ?????? ???????' : undefined}
                      action={(
                        <Button type="button" variant="ghost" size="sm" className="h-6 px-2 text-[11px]" onClick={() => setManualMortgageMonthlyPayment((v) => !v)}>
                          {manualMortgageMonthlyPayment ? '???????' : '????? ?????'}
                        </Button>
                      )}
                    >
                      <Input className="h-10" type="number" min="0" value={manualMortgageMonthlyPayment ? mortgageMonthlyPayment : effectiveMortgageMonthlyPayment} readOnly={!manualMortgageMonthlyPayment} onChange={(e) => setMortgageMonthlyPayment(Number(e.target.value))} />
                    </Field>
                    <Field label="????? (%)">
                      <Input className="h-10" type="number" min="0" step="0.1" value={mortgageInterestRate} onChange={(e) => setMortgageInterestRate(Number(e.target.value))} />
                    </Field>
                    <Field label="????? ??????" hint="?????" className="sm:col-span-2">
                      <Input className="h-10" type="number" min="0" value={mortgageYears ?? ''} onChange={(e) => setMortgageYears(Number(e.target.value))} />
                    </Field>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm bg-muted/40 lg:self-start">
              <CardContent className="p-3 space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">?????? ?????</p>
                    <p className="text-[11px] text-muted-foreground">???? ????, ???? ????.</p>
                  </div>
                  <Button type="button" variant="outline" size="sm" onClick={() => setUseSideCostPreset((v) => !v)}>
                    {useSideCostPreset ? '????? ?????' : '???? ??????'}
                  </Button>
                </div>
                <div className="grid grid-cols-1 gap-2">
                  {[
                    { key: 'broker', label: '????? 2%', value: purchasePrice * 0.02 },
                    { key: 'mortgageAdvice', label: '????? ?????? 7,000 ???', value: 7000 },
                    { key: 'lawyer', label: '???? 1%', value: purchasePrice * 0.01 },
                    { key: 'appraiser', label: '???? 2,000 ???', value: 2000 },
                    { key: 'extras', label: '?????? 5,000 ???', value: 5000 },
                  ].map((item) => (
                    <label key={item.key} className="flex items-center gap-3 rounded-xl border bg-background px-3 py-2 text-sm">
                      <Checkbox
                        checked={(selectedSideCosts as Record<string, boolean>)[item.key]}
                        onCheckedChange={(checked) => setSelectedSideCosts((current) => ({ ...current, [item.key]: !!checked }))}
                        disabled={!useSideCostPreset}
                      />
                      <span className="flex-1">{item.label}</span>
                      <span className="text-xs text-muted-foreground tabular-nums">{formatCurrency(item.value)}</span>
                    </label>
                  ))}
                </div>
                <div className="rounded-xl bg-background px-3 py-2 flex items-center justify-between">
                  <span className="text-sm font-medium">???? ?????? ?????</span>
                  <span className="text-lg font-bold tabular-nums">{formatCurrency(sideCosts)}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          <InputSection title="3. ?????? ???????" description="?????? ????? ??? ?????? ????? ??????.">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field label="???? ????? ????">
                <Input className="h-10" type="number" min="0" value={expectedMonthlyRent ?? ''} onChange={(e) => setExpectedMonthlyRent(Number(e.target.value))} />
              </Field>
              <Field label="?????? ????? ??????">
                <Input className="h-10" type="number" min="0" value={annualOperatingCosts ?? ''} onChange={(e) => setAnnualOperatingCosts(Number(e.target.value))} />
              </Field>
            </div>
          </InputSection>

                    <Card className="border-0 shadow-sm bg-muted/40">
            <CardContent className="p-3 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">השבחה מתחדשות עירונית</p>
                  <p className="text-[11px] text-muted-foreground">אפשר להזין השבחה בש״ח או באחוזים; היא תיכנס לחישוב התרחישים והיציאה.</p>
                </div>
                <Button type="button" variant="outline" size="sm" onClick={() => setUrbanRenewalUpliftMode((m) => m === 'amount' ? 'percent' : 'amount')}>
                  {urbanRenewalUpliftMode === 'amount' ? 'לעבור לאחוזים' : 'לעבור לש״ח'}
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">השבחה צפויה</Label>
                <Input className="h-10" type="number" min="0" value={urbanRenewalUpliftValue ?? ''} onChange={(e) => setUrbanRenewalUpliftValue(Number(e.target.value))} />
                </div>
                <div className="flex items-end text-[11px] text-muted-foreground">
                  {urbanRenewalUpliftMode === 'amount' ? 'מוזן כש״ח ומתווסף לשווי הסופי' : 'מוזן כאחוז משווי הרכישה'}
                </div>
              </div>
            </CardContent>
          </Card>

        </div>

        {/* Results Section */}
        <div className="md:col-span-7 mt-6 md:mt-0">
          <AnimatePresence mode="wait">
            {result ? (
              <motion.div
                key="results"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-4"
              >
                {/* Cashflow Summary */}
                <Card className="border-0 shadow-sm">
                  <CardContent className="p-4">
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <p className="text-[11px] text-muted-foreground">עלות עסקה כוללת</p>
                        <p className="text-lg font-bold">{formatCurrency(result.totalDealCost)}</p>
                      </div>
                      <div>
                        <p className="text-[11px] text-muted-foreground">תזרים חודשי נטו</p>
                        <p className={cn('text-lg font-bold', result.monthlyCashflow >= 0 ? 'text-green-600' : 'text-red-600')}>
                          {formatCurrency(result.monthlyCashflow)}
                        </p>
                      </div>
                      <div>
                        <p className="text-[11px] text-muted-foreground">תזרים שנתי נטו</p>
                        <p className={cn('text-lg font-bold', result.annualNetCashflow >= 0 ? 'text-green-600' : 'text-red-600')}>
                          {formatCurrency(result.annualNetCashflow)}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* 3 Scenario Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <ScenarioCard scenario={result.scenarios[0]} style={SCENARIO_COLORS.pessimistic} monthlyCashflow={result.monthlyCashflow} />
                  <ScenarioCard scenario={result.scenarios[1]} style={SCENARIO_COLORS.average} monthlyCashflow={result.monthlyCashflow} />
                  <ScenarioCard scenario={result.scenarios[2]} style={SCENARIO_COLORS.optimistic} monthlyCashflow={result.monthlyCashflow} />
                </div>

                {/* Scenario appreciation rates */}
                <Card className="border-0 bg-muted/50">
                  <CardContent className="p-4 space-y-3">
                    <div>
                      <Label className="text-sm font-semibold">אחוזי עליית ערך לפי תרחיש</Label>
                      <p className="text-[11px] text-muted-foreground mt-1">
                        שנה את ההנחות כדי לראות מיד איך העסקה משתנה. ברירת המחדל: מחמיר 0%, בינוני 1%, טוב 2%.
                      </p>
                    </div>
                    <div className="grid grid-cols-3 gap-2 pt-1">
                      <div>
                        <Label className="text-[10px] text-red-500">מחמיר %</Label>
                        <Input
                          type="number" step="0.5" className="h-8 text-sm"
                          value={customRates.pessimistic}
                          onChange={(e) => setCustomRates({ ...customRates, pessimistic: Number(e.target.value) })}
                        />
                      </div>
                      <div>
                        <Label className="text-[10px] text-blue-500">בינוני %</Label>
                        <Input
                          type="number" step="0.5" className="h-8 text-sm"
                          value={customRates.average}
                          onChange={(e) => setCustomRates({ ...customRates, average: Number(e.target.value) })}
                        />
                      </div>
                      <div>
                        <Label className="text-[10px] text-green-500">טוב %</Label>
                        <Input
                          type="number" step="0.5" className="h-8 text-sm"
                          value={customRates.optimistic}
                          onChange={(e) => setCustomRates({ ...customRates, optimistic: Number(e.target.value) })}
                        />
                      </div>
                    </div>
                    {customRates.pessimistic > customRates.optimistic && (
                      <p className="text-[11px] text-amber-500">שים לב — התרחיש המחמיר גבוה מהתרחיש הטוב</p>
                    )}
                  </CardContent>
                </Card>

                {/* PDF Export */}
                <div className="flex justify-end">
                  <ExportButton
                    title="תוכנית עסקית"
                    executiveSummary={[
                      `עלות עסקה כוללת: ${formatCurrency(result.totalDealCost)}`,
                      `תזרים חודשי נטו: ${formatCurrency(result.monthlyCashflow)}`,
                      `תשואה כוללת על ההון: ${(result.scenarios[1].totalEquityReturn * 100).toFixed(1)}%`,
                    ]}
                    sections={[
                      { title: 'נתוני עסקה', items: [
                        { label: 'מחיר רכישה', value: formatCurrency(purchasePrice) },
                        { label: 'הון עצמי', value: formatCurrency(equityInvested) },
                        { label: 'סכום משכנתא', value: formatCurrency(mortgageAmount) },
                        { label: 'שכ״ד חודשי', value: formatCurrency(expectedMonthlyRent) },
                        { label: 'תקופת החזקה', value: `${holdingPeriodYears} שנים` },
                      ]},
                      ...result.scenarios.map(s => ({
                        title: `תרחיש ${s.label} (${s.annualAppreciation}%)`,
                        items: [
                          { label: 'שווי נכס בסוף תקופה', value: formatCurrency(s.propertyValueAtEnd) },
                          { label: 'רווח כולל', value: formatCurrency(s.totalProfit) },
                          { label: 'תשואה שנתית על ההון', value: `${(s.annualEquityReturn * 100).toFixed(1)}%` },
                          { label: 'תשואה כוללת על ההון', value: `${(s.totalEquityReturn * 100).toFixed(1)}%` },
                        ],
                      })),
                    ]}
                  />
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center py-20 text-center"
              >
                <div className="w-16 h-16 bg-muted rounded-2xl flex items-center justify-center mb-4">
                  <BarChart3 className="w-8 h-8 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground text-sm">הזן מחיר רכישה כדי לראות תוצאות</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
