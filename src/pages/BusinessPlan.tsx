import { useState, useMemo, useEffect, useRef, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { BarChart3, ChevronDown, Import, RotateCcw, TrendingUp } from 'lucide-react';
import { SaveSnapshotButton } from '@/components/SaveSnapshotButton';
import { calculateBusinessPlan, BusinessPlanOutput, ScenarioResult } from '@/lib/calculations/business-plan';
import { calculateMortgageMonthlyPayment } from '@/lib/calculations/mortgage-calculator';
import { calculatePurchaseTax, type BuyerType } from '@/lib/calculations/purchase-tax';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatCurrency, numInput } from '@/lib/validation/validators';
import { Checkbox } from '@/components/ui/checkbox';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { save, load, clear } from '@/lib/storage';
import { useAuth } from '@/contexts/AuthContext';
import { getBudgetResults } from '@/lib/flow';
import { ExportButton } from '@/components/ExportButton';
import { InfoTooltip } from '@/components/InfoTooltip';
import { EmptyState } from '@/components/ui/empty-state';
import { LABELS } from '@/lib/content/labels';
import { CHART } from '@/lib/chart-colors';
import NextStepCard from '@/components/NextStepCard';
import { useJourney } from '@/hooks/useJourney';

const SCENARIO_COLORS = {
  pessimistic: { bg: 'bg-red-50 dark:bg-red-950/30', border: 'border-red-200 dark:border-red-800', text: 'text-red-600 dark:text-red-400', chart: CHART.red },
  average: { bg: 'bg-orange-50 dark:bg-orange-950/30', border: 'border-orange-200 dark:border-orange-800', text: 'text-orange-700 dark:text-orange-400', chart: CHART.terracotta },
  optimistic: { bg: 'bg-emerald-50 dark:bg-emerald-950/30', border: 'border-emerald-200 dark:border-emerald-800', text: 'text-emerald-700 dark:text-emerald-400', chart: CHART.emerald },
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
  propertyArea: '',
  propertySqm: 0,
  propertyFloor: '',
  propertyRooms: '',
  propertyNotes: '',
  buyerType: 'additionalApartment' as BuyerType,
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
  const saved = load<typeof BP_DEFAULTS & { touched?: boolean }>('business_plan');
  const [editingDeal, setEditingDeal] = useState<EditingDeal | null>(() => load<EditingDeal>('business_plan_editing'));
  // True only after real user input — prefilled defaults must not complete milestones.
  const [touched, setTouched] = useState(!!saved?.touched);
  const touch = () => setTouched(true);
  const [purchasePrice, setPurchasePrice] = useState(saved?.purchasePrice ?? BP_DEFAULTS.purchasePrice);
  const [propertyArea, setPropertyArea] = useState(saved?.propertyArea ?? BP_DEFAULTS.propertyArea);
  const [propertySqm, setPropertySqm] = useState(saved?.propertySqm ?? BP_DEFAULTS.propertySqm);
  const [propertyFloor, setPropertyFloor] = useState(saved?.propertyFloor ?? BP_DEFAULTS.propertyFloor);
  const [propertyRooms, setPropertyRooms] = useState(saved?.propertyRooms ?? BP_DEFAULTS.propertyRooms);
  const [propertyNotes, setPropertyNotes] = useState(saved?.propertyNotes ?? BP_DEFAULTS.propertyNotes);
  const [buyerType, setBuyerType] = useState<BuyerType>(saved?.buyerType ?? BP_DEFAULTS.buyerType);
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
      purchasePrice, propertyArea, propertySqm, propertyFloor, propertyRooms,
      propertyNotes, buyerType, sideCosts, renovationCost, equityInvested, mortgageAmount,
      mortgageMonthlyPayment, mortgageInterestRate, mortgageYears, expectedMonthlyRent,
      annualOperatingCosts, holdingPeriodYears, baseAppreciation, customRates,
      urbanRenewalUpliftMode, urbanRenewalUpliftValue, manualMortgageAmount,
      manualMortgageMonthlyPayment, useSideCostPreset, selectedSideCosts, touched,
    }, uid);
  }, [purchasePrice, propertyArea, propertySqm, propertyFloor, propertyRooms,
    propertyNotes, buyerType, sideCosts, renovationCost, equityInvested, mortgageAmount,
    mortgageMonthlyPayment, mortgageInterestRate, mortgageYears, expectedMonthlyRent,
    annualOperatingCosts, holdingPeriodYears, baseAppreciation, customRates,
    urbanRenewalUpliftMode, urbanRenewalUpliftValue, manualMortgageAmount,
    manualMortgageMonthlyPayment, useSideCostPreset, selectedSideCosts, touched, uid]);

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

  // מס רכישה — מחושב תמיד לפי סוג הרוכש, שורה נפרדת שאי אפשר לשכוח
  const purchaseTaxAmount = useMemo(
    () => Math.round(calculatePurchaseTax({ purchasePrice, buyerType }).totalTax),
    [purchasePrice, buyerType],
  );

  const autoMortgageAmount = useMemo(() => Math.max(0, purchasePrice - equityInvested), [purchasePrice, equityInvested]);
  const effectiveMortgageAmount = manualMortgageAmount ? mortgageAmount : autoMortgageAmount;
  const autoMortgageMonthlyPayment = useMemo(
    () => Math.round(calculateMortgageMonthlyPayment(effectiveMortgageAmount, mortgageInterestRate, mortgageYears)),
    [effectiveMortgageAmount, mortgageInterestRate, mortgageYears],
  );
  const effectiveMortgageMonthlyPayment = manualMortgageMonthlyPayment ? mortgageMonthlyPayment : autoMortgageMonthlyPayment;
  const effectiveUpliftValue = useMemo(() => {
    if (urbanRenewalUpliftMode === 'amount') return Math.max(0, urbanRenewalUpliftValue);
    return Math.max(0, purchasePrice * (urbanRenewalUpliftValue / 100));
  }, [urbanRenewalUpliftMode, urbanRenewalUpliftValue, purchasePrice]);

  const handleImportBudget = () => {
    if (!budgetData) return;
    touch();
    setPurchasePrice(budgetData.maxPropertyValue);
    setEquityInvested(budgetData.equity);
    setMortgageAmount(budgetData.maxMortgage);
    setMortgageMonthlyPayment(budgetData.monthlyPayment);
    setManualMortgageAmount(false);
    setManualMortgageMonthlyPayment(false);
    // מס רכישה מחושב בנפרד לפי סוג הרוכש — לא נכלל בעלויות הנלוות
    setSideCosts(budgetData.sideCosts);
    setUseSideCostPreset(false);
    const budgetProfile = load<{ buyerType?: BuyerType }>('budget_profile');
    if (budgetProfile?.buyerType) setBuyerType(budgetProfile.buyerType);
    // Import interest rate from mortgage results if available
    const mortgageData = load<{ weightedAverageInterest?: number }>('mortgage_results');
    if (mortgageData?.weightedAverageInterest) {
      setMortgageInterestRate(mortgageData.weightedAverageInterest);
    }
  };

  const handleReset = () => {
    if (!window.confirm('בטוח? כל הנתונים יימחקו')) return;
    setPurchasePrice(BP_DEFAULTS.purchasePrice);
    setPropertyArea(BP_DEFAULTS.propertyArea);
    setPropertySqm(BP_DEFAULTS.propertySqm);
    setPropertyFloor(BP_DEFAULTS.propertyFloor);
    setPropertyRooms(BP_DEFAULTS.propertyRooms);
    setPropertyNotes(BP_DEFAULTS.propertyNotes);
    setBuyerType(BP_DEFAULTS.buyerType);
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
        sideCosts: sideCosts + purchaseTaxAmount,
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

  // Auto-complete business_plan milestone — only after real user input (not defaults).
  const { complete: completeMilestone, isDone } = useJourney();
  const markedRef = useRef(false);
  useEffect(() => {
    if (
      !markedRef.current &&
      uid &&
      touched &&
      result &&
      result.totalDealCost > 0 &&
      !isDone('business_plan')
    ) {
      markedRef.current = true;
      completeMilestone('business_plan', {
        purchasePrice,
      }).catch(() => {
        markedRef.current = false;
      });
    }
  }, [uid, touched, result, purchasePrice, isDone, completeMilestone]);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="space-y-6">
        {/* Input Section — onChangeCapture catches every native input edit (dirty flag) */}
        <div className="space-y-4" onChangeCapture={touch}>
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
                defaultName={`${propertyArea ? `עסקה ב${propertyArea}` : `עסקה ב-${formatCurrency(purchasePrice)}`} — ${new Date().toLocaleDateString('he-IL')}`}
                snapshotId={editingDeal?.id ?? null}
                initialName={editingDeal?.name ?? ''}
                initialNotes={editingDeal?.notes ?? ''}
                onSaved={() => {
                  clear('business_plan_editing');
                  setEditingDeal(null);
                }}
                getData={() => ({
                  inputs: {
                    purchasePrice, propertyArea, propertySqm, propertyFloor,
                    propertyRooms, propertyNotes, buyerType, purchaseTax: purchaseTaxAmount,
                    sideCosts, renovationCost, equityInvested,
                    mortgageAmount: effectiveMortgageAmount, mortgageMonthlyPayment: effectiveMortgageMonthlyPayment, mortgageInterestRate,
                    mortgageYears, expectedMonthlyRent, annualOperatingCosts,
                    holdingPeriodYears, baseAppreciation, customRates,
                    urbanRenewalUpliftMode, urbanRenewalUpliftValue, manualMortgageAmount,
                    manualMortgageMonthlyPayment, useSideCostPreset, selectedSideCosts,
                  },
                  results: result,
                })}
              />
              <Link to="/deal-comparison">
                <Button variant="ghost" size="sm" className="text-muted-foreground h-8 gap-1">
                  <BarChart3 className="w-3.5 h-3.5" /> השוואת עסקאות
                </Button>
              </Link>
              <Button variant="ghost" size="sm" onClick={handleReset} className="text-muted-foreground h-8 gap-1">
                <RotateCcw className="w-3.5 h-3.5" /> אפס
              </Button>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            איזו דירה אתה יכול לקנות? מה יהיה ההחזר החודשי? פוטנציאל הרווח?
            הזן את פרטי העסקה וראה 3 תרחישים שיעזרו לך להחליט.
          </p>
          <p className="text-[11px] text-muted-foreground">
            הנתונים כאן יעזרו לבנות אחר כך תמהיל משכנתא שמתאים לעסקה.
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

          <div className="space-y-3">
            <Card className="border-0 shadow-sm bg-background/80">
              <CardContent className="p-3 space-y-4">
                <div className="space-y-3">
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">1. הנכס</p>
                    <p className="text-[11px] leading-relaxed text-muted-foreground">מה קונים ובכמה. שאר הפרטים — רק אם בא לך לתעד.</p>
                  </div>
                  <div className="grid grid-cols-1 gap-3">
                    <Field label="מחיר רכישה">
                      <Input className="h-10 text-base font-semibold" type="number" min="0" value={purchasePrice ?? ''} onChange={(e) => setPurchasePrice(numInput(e.target.value))} />
                    </Field>
                  </div>
                  <Collapsible>
                    <CollapsibleTrigger asChild>
                      <Button type="button" variant="ghost" size="sm" className="h-7 px-2 text-xs text-muted-foreground gap-1">
                        <ChevronDown className="w-3.5 h-3.5" /> פרטים נוספים על הנכס (לא חובה)
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 pt-2">
                        <Field label="אזור / שכונה">
                          <Input className="h-10" value={propertyArea} onChange={(e) => setPropertyArea(e.target.value)} placeholder="לדוגמה: תל אביב / יד אליהו" />
                        </Field>
                        <Field label="שטח (מ״ר)">
                          <Input className="h-10" type="number" min="0" value={propertySqm || ''} onChange={(e) => setPropertySqm(numInput(e.target.value))} />
                        </Field>
                        <Field label="קומה">
                          <Input className="h-10" value={propertyFloor} onChange={(e) => setPropertyFloor(e.target.value)} placeholder="לדוגמה: 3 מתוך 6" />
                        </Field>
                        <Field label="חדרים">
                          <Input className="h-10" value={propertyRooms} onChange={(e) => setPropertyRooms(e.target.value)} placeholder="לדוגמה: 3.5" />
                        </Field>
                        <Field label="הערות נכס" className="sm:col-span-2">
                          <Input className="h-10" value={propertyNotes} onChange={(e) => setPropertyNotes(e.target.value)} placeholder="מעלית, מרפסת, חניה, מצב הנכס או כל פרט חשוב" />
                        </Field>
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                </div>

              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm bg-muted/40">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">2. עלויות רכישה</p>
                    <p className="text-[11px] text-muted-foreground">מס רכישה, עלויות נלוות ושיפוץ — כל מה שמתווסף למחיר הדירה.</p>
                  </div>
                  <Button type="button" variant="outline" size="sm" onClick={() => setUseSideCostPreset((v) => !v)}>
                    {useSideCostPreset ? 'עריכה ידנית' : 'חזור לחישוב'}
                  </Button>
                </div>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 sm:items-end">
                  <div>
                    <Label className="text-xs">סוג רוכש (קובע את מס הרכישה)</Label>
                    <Select value={buyerType} onValueChange={(v: BuyerType) => { touch(); setBuyerType(v); }}>
                      <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="additionalApartment">דירה נוספת / משקיע</SelectItem>
                        <SelectItem value="singleApartment">דירה יחידה</SelectItem>
                        <SelectItem value="foreignResident">תושב חוץ</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="rounded-xl border bg-background px-3 py-2 flex items-center justify-between">
                    <span className="text-sm">מס רכישה</span>
                    <span className="text-sm font-bold tabular-nums">{formatCurrency(purchaseTaxAmount)}</span>
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-2">
                  {[
                    { key: 'broker', label: 'מתווך 2%', value: purchasePrice * 0.02 },
                    { key: 'mortgageAdvice', label: 'ייעוץ משכנתא 7,000 ש״ח', value: 7000 },
                    { key: 'lawyer', label: 'עו״ד 1%', value: purchasePrice * 0.01 },
                    { key: 'appraiser', label: 'שמאי 2,000 ש״ח', value: 2000 },
                    { key: 'extras', label: 'נוספים 5,000 ש״ח', value: 5000 },
                  ].map((item) => (
                    <label key={item.key} className="flex items-center gap-3 rounded-xl border bg-background px-3 py-2 text-sm">
                      <Checkbox
                        checked={(selectedSideCosts as Record<string, boolean>)[item.key]}
                        onCheckedChange={(checked) => { touch(); setSelectedSideCosts((current) => ({ ...current, [item.key]: !!checked })); }}
                        disabled={!useSideCostPreset}
                      />
                      <span className="flex-1">{item.label}</span>
                      <span className="text-xs text-muted-foreground tabular-nums">{formatCurrency(item.value)}</span>
                    </label>
                  ))}
                </div>
                <div>
                  <Label className="text-xs">עלות שיפוץ (אם מתוכנן)</Label>
                  <Input className="h-10" type="number" min="0" value={renovationCost ?? ''} onChange={(e) => setRenovationCost(numInput(e.target.value))} />
                </div>
                <div className="rounded-xl bg-background px-3 py-2 flex items-center justify-between">
                  <span className="text-sm font-medium">סה״כ מס + עלויות נלוות</span>
                  <span className="text-lg font-bold tabular-nums">{formatCurrency(sideCosts + purchaseTaxAmount)}</span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm bg-background/80">
              <CardContent className="p-3 space-y-4">
                <div className="border-t pt-4 space-y-3">
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">3. מימון</p>
                    <p className="text-[11px] leading-relaxed text-muted-foreground">כמה מההון שלך נכנס, כמה משכנתא צריך, ומה ההחזר החודשי.</p>
                  </div>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <Field label="הון עצמי" className="sm:col-span-2">
                      <Input className="h-10 text-base font-semibold" type="number" min="0" value={equityInvested ?? ''} onChange={(e) => setEquityInvested(numInput(e.target.value))} />
                    </Field>
                    <Field
                      label="סכום משכנתא"
                      hint={!manualMortgageAmount ? 'מחושב כשווי נכס פחות ההון העצמי' : undefined}
                      action={(
                        <Button type="button" variant="ghost" size="sm" className="h-6 px-2 text-[11px]" onClick={() => setManualMortgageAmount((v) => !v)}>
                          {manualMortgageAmount ? 'אוטומטי' : 'עריכה ידנית'}
                        </Button>
                      )}
                    >
                      <Input className="h-10" type="number" min="0" value={manualMortgageAmount ? mortgageAmount : effectiveMortgageAmount} readOnly={!manualMortgageAmount} onChange={(e) => setMortgageAmount(numInput(e.target.value))} />
                    </Field>
                    <Field
                      label="החזר חודשי"
                      hint={!manualMortgageMonthlyPayment ? 'מחושב לפי הסכום, הריבית והתקופה' : undefined}
                      action={(
                        <Button type="button" variant="ghost" size="sm" className="h-6 px-2 text-[11px]" onClick={() => setManualMortgageMonthlyPayment((v) => !v)}>
                          {manualMortgageMonthlyPayment ? 'אוטומטי' : 'עריכה ידנית'}
                        </Button>
                      )}
                    >
                      <Input className="h-10" type="number" min="0" value={manualMortgageMonthlyPayment ? mortgageMonthlyPayment : effectiveMortgageMonthlyPayment} readOnly={!manualMortgageMonthlyPayment} onChange={(e) => setMortgageMonthlyPayment(numInput(e.target.value))} />
                    </Field>
                    <Field label="ריבית (%)">
                      <Input className="h-10" type="number" min="0" step="0.1" value={mortgageInterestRate} onChange={(e) => setMortgageInterestRate(numInput(e.target.value))} />
                    </Field>
                    <Field label="תקופת משכנתא" hint="בשנים">
                      <Input className="h-10" type="number" min="0" value={mortgageYears ?? ''} onChange={(e) => setMortgageYears(numInput(e.target.value))} />
                    </Field>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <InputSection title="4. הכנסה ותפעול" description="כמה שכירות ייכנס בחודש, וכמה עולה להחזיק את הנכס בשנה.">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field label="שכ״ד חודשי צפוי">
                <Input className="h-10" type="number" min="0" value={expectedMonthlyRent ?? ''} onChange={(e) => setExpectedMonthlyRent(numInput(e.target.value))} />
              </Field>
              <Field label="הוצאות תפעול שנתיות">
                <Input className="h-10" type="number" min="0" value={annualOperatingCosts ?? ''} onChange={(e) => setAnnualOperatingCosts(numInput(e.target.value))} />
              </Field>
            </div>
          </InputSection>

          <Card className="border-0 shadow-sm bg-muted/40">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">5. תחזית ומכירה</p>
                  <p className="text-[11px] text-muted-foreground">כמה שנים מחזיקים את הנכס, ואם צפויה השבחה (למשל מהתחדשות עירונית).</p>
                </div>
                <Button type="button" variant="outline" size="sm" onClick={() => setUrbanRenewalUpliftMode((m) => m === 'amount' ? 'percent' : 'amount')}>
                  {urbanRenewalUpliftMode === 'amount' ? 'לעבור לאחוזים' : 'לעבור לש״ח'}
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">תקופת החזקה (שנים)</Label>
                  <Input className="h-10" type="number" min="0" value={holdingPeriodYears ?? ''} onChange={(e) => setHoldingPeriodYears(numInput(e.target.value))} />
                </div>
                <div className="flex items-end text-[11px] text-muted-foreground">
                  כמה שנים מתכננים להחזיק לפני מכירה
                </div>
                <div>
                  <Label className="text-xs">השבחה צפויה (לא חובה)</Label>
                <Input className="h-10" type="number" min="0" value={urbanRenewalUpliftValue ?? ''} onChange={(e) => setUrbanRenewalUpliftValue(numInput(e.target.value))} />
                </div>
                <div className="flex items-end text-[11px] text-muted-foreground">
                  {urbanRenewalUpliftMode === 'amount' ? 'מוזן כש״ח ומתווסף לשווי הסופי' : 'מוזן כאחוז משווי הרכישה'}
                </div>
              </div>
            </CardContent>
          </Card>

        </div>

        {/* Results Section */}
        <div className="space-y-3">
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
                          onChange={(e) => setCustomRates({ ...customRates, pessimistic: numInput(e.target.value) })}
                        />
                      </div>
                      <div>
                        <Label className="text-[10px] text-orange-600">בינוני %</Label>
                        <Input
                          type="number" step="0.5" className="h-8 text-sm"
                          value={customRates.average}
                          onChange={(e) => setCustomRates({ ...customRates, average: numInput(e.target.value) })}
                        />
                      </div>
                      <div>
                        <Label className="text-[10px] text-emerald-600">טוב %</Label>
                        <Input
                          type="number" step="0.5" className="h-8 text-sm"
                          value={customRates.optimistic}
                          onChange={(e) => setCustomRates({ ...customRates, optimistic: numInput(e.target.value) })}
                        />
                      </div>
                    </div>
                    {customRates.pessimistic > customRates.optimistic && (
                      <p className="text-[11px] text-amber-500">שים לב — התרחיש המחמיר גבוה מהתרחיש הטוב</p>
                    )}
                  </CardContent>
                </Card>

                {/* Next step in the journey */}
                <NextStepCard currentMilestone="business_plan" />

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
              >
                <EmptyState
                  icon={<BarChart3 className="w-6 h-6" />}
                  description={LABELS.empty.businessPlanNeedsPrice}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
