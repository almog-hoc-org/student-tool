import { useState, useMemo, useEffect, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Wallet, Home, CreditCard, Receipt, PiggyBank, ArrowLeft, RotateCcw } from 'lucide-react';
import { calculateBudget, BudgetOutput } from '@/lib/calculations/budget-calculator';
import { BUDGET_DEFAULT_ANNUAL_RATE } from '@/lib/constants/regulations';
import { BuyerType } from '@/lib/calculations/purchase-tax';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Info } from 'lucide-react';
import { formatCurrency } from '@/lib/validation/validators';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { save, load, clear } from '@/lib/storage';
import { useAuth } from '@/contexts/AuthContext';
import { ExportButton } from '@/components/ExportButton';
import { InfoTooltip } from '@/components/InfoTooltip';
import { SaveSnapshotButton } from '@/components/SaveSnapshotButton';
import { HomeGreeting } from '@/components/HomeGreeting';
import { YourNumbersStrip } from '@/components/YourNumbersStrip';
import NextStepCard from '@/components/NextStepCard';
import { InsightBanner } from '@/components/InsightBanner';
import { GlossaryLink } from '@/components/GlossaryLink';
import { useJourney } from '@/hooks/useJourney';
import { LABELS } from '@/lib/content/labels';
import { EmptyState } from '@/components/ui/empty-state';
import { CHART } from '@/lib/chart-colors';
import { Link } from 'react-router-dom';

const COLORS = {
  equity: CHART.emerald,
  tax: CHART.red,
  costs: CHART.gold,
};

function AnimatedNumber({ value, prefix = '₪' }: { value: number; prefix?: string }) {
  return (
    <motion.span
      key={value}
      className="fig"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {prefix}{value.toLocaleString('he-IL')}
    </motion.span>
  );
}

function KPICard({ title, value, icon: Icon, color, large, tooltip }: {
  title: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  large?: boolean;
  tooltip?: string;
}) {
  return (
    <Card className={cn(
      'border-0 shadow-sm',
      large && 'col-span-2 md:col-span-1'
    )}>
      <CardContent className={cn('p-4', large && 'p-5')}>
        <div className="flex items-center gap-2 mb-2">
          <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center', color)}>
            <Icon className="w-4 h-4 text-white" />
          </div>
          <span className="text-xs text-muted-foreground font-medium flex items-center gap-1">
            {title}
            {tooltip && <InfoTooltip text={tooltip} />}
          </span>
        </div>
        <p className={cn(
          'font-bold tracking-tight fig',
          large ? 'text-3xl md:text-4xl' : 'text-xl md:text-2xl'
        )}>
          {value}
        </p>
      </CardContent>
    </Card>
  );
}

const DEFAULTS = { equity: 400000, monthlyIncome: 20000, currentRent: 0, livingExpenses: 0, monthlyObligations: 0, buyerType: 'singleApartment' as BuyerType, mortgageYears: 25, interestRate: BUDGET_DEFAULT_ANNUAL_RATE };

const BUYER_EQUITY_NOTE: Record<BuyerType, string> = {
  singleApartment: 'דירה יחידה: מימון עד 75% — נדרש הון עצמי של לפחות 25%',
  additionalApartment: 'דירה נוספת / משקיע: מימון עד 50% — נדרש הון עצמי של לפחות 50%',
  foreignResident: 'תושב חוץ: מימון עד 50% — נדרש הון עצמי של לפחות 50%',
};

interface BudgetWizardValues {
  equity: number;
  monthlyIncome: number;
  currentRent: number;
  livingExpenses: number;
  monthlyObligations: number;
  buyerType: BuyerType;
  mortgageYears: number;
}

function QuickBudgetWizard({
  open,
  onOpenChange,
  initialValues,
  onComplete,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialValues: BudgetWizardValues;
  onComplete: (values: BudgetWizardValues) => void;
}) {
  const [step, setStep] = useState(0);
  const [values, setValues] = useState<BudgetWizardValues>(initialValues);

  useEffect(() => {
    if (open) {
      setStep(0);
      setValues(initialValues);
    }
  }, [open, initialValues]);

  const steps = [
    {
      title: 'כמה הון עצמי זמין יש לך?',
      description: 'כסף פנוי לעסקה, לפני מס רכישה ועלויות נלוות.',
      content: (
        <Input
          type="number"
          min="0"
          value={values.equity || ''}
          onChange={(e) => setValues({ ...values, equity: Number(e.target.value) })}
          className="h-12 text-lg font-semibold"
          placeholder="400000"
          autoFocus
        />
      ),
    },
    {
      title: 'מה ההכנסה החודשית נטו של משק הבית?',
      description: 'הכנסה נטו קבועה אחרי מסים.',
      content: (
        <Input
          type="number"
          min="0"
          value={values.monthlyIncome || ''}
          onChange={(e) => setValues({ ...values, monthlyIncome: Number(e.target.value) })}
          className="h-12 text-lg font-semibold"
          placeholder="20000"
          autoFocus
        />
      ),
    },
    {
      title: 'כמה אתם משלמים כיום על דיור?',
      description: 'שכירות/משכנתא קיימת — זה חלק מהתזרים הפנוי.',
      content: (
        <Input
          type="number"
          min="0"
          value={values.currentRent || ''}
          onChange={(e) => setValues({ ...values, currentRent: Number(e.target.value) })}
          className="h-12 text-lg font-semibold"
          placeholder="0"
          autoFocus
        />
      ),
    },
    {
      title: 'כמה הוצאות מחיה חודשיות יש?',
      description: 'אוכל, תחבורה, בילויים, ילדים וכל מה שלא נכנס להתחייבויות.',
      content: (
        <Input
          type="number"
          min="0"
          value={values.livingExpenses || ''}
          onChange={(e) => setValues({ ...values, livingExpenses: Number(e.target.value) })}
          className="h-12 text-lg font-semibold"
          placeholder="0"
          autoFocus
        />
      ),
    },
    {
      title: 'כמה התחייבויות חודשיות קיימות יש?',
      description: 'הלוואות, ליסינג, אשראי וכל החזר קבוע אחר.',
      content: (
        <Input
          type="number"
          min="0"
          value={values.monthlyObligations || ''}
          onChange={(e) => setValues({ ...values, monthlyObligations: Number(e.target.value) })}
          className="h-12 text-lg font-semibold"
          placeholder="0"
          autoFocus
        />
      ),
    },
    {
      title: 'מה סוג הרוכש?',
      description: 'זה משפיע על מס רכישה ואחוזי המימון.',
      content: (
        <Select value={values.buyerType} onValueChange={(buyerType: BuyerType) => setValues({ ...values, buyerType })}>
          <SelectTrigger className="h-12" aria-label="סוג רוכש"><SelectValue placeholder="בחר…" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="singleApartment">דירה ראשונה (יחידה)</SelectItem>
            <SelectItem value="additionalApartment">דירה נוספת / משקיע</SelectItem>
            <SelectItem value="foreignResident">תושב חוץ</SelectItem>
          </SelectContent>
        </Select>
      ),
    },
    {
      title: 'לכמה שנים תרצה לפרוס את המשכנתא?',
      description: 'אפשר לשנות גם אחר כך במחשבון.',
      content: (
        <div className="space-y-3">
          <div className="text-center text-2xl font-bold text-primary">{values.mortgageYears} שנים</div>
          <Slider
            value={[values.mortgageYears]}
            onValueChange={([mortgageYears]) => setValues({ ...values, mortgageYears })}
            min={15}
            max={30}
            step={1}
          />
          <div dir="ltr" className="flex justify-between text-[11px] text-muted-foreground">
            <span>15</span>
            <span>30</span>
          </div>
        </div>
      ),
    },
  ];

  const current = steps[step];
  const isLast = step === steps.length - 1;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent dir="rtl" className="w-[calc(100vw-24px)] rounded-2xl sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{current.title}</DialogTitle>
          <DialogDescription>{current.description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="flex gap-1">
            {steps.map((_, i) => (
              <div key={i} className={cn('h-1.5 flex-1 rounded-full', i <= step ? 'bg-primary' : 'bg-muted')} />
            ))}
          </div>
          {current.content}
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button variant="ghost" onClick={() => step === 0 ? onOpenChange(false) : setStep(step - 1)}>
            {step === 0 ? 'ביטול' : 'חזור'}
          </Button>
          <Button onClick={() => {
            if (isLast) {
              onComplete(values);
              onOpenChange(false);
            } else {
              setStep(step + 1);
            }
          }}>
            {isLast ? 'מלא את המחשבון' : 'הבא'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function BudgetCalculator() {
  const { user } = useAuth();
  const uid = user?.id;
  const saved = load<typeof DEFAULTS & { touched?: boolean }>('budget');
  const [equity, setEquity] = useState(saved?.equity ?? DEFAULTS.equity);
  const [monthlyIncome, setMonthlyIncome] = useState(saved?.monthlyIncome ?? DEFAULTS.monthlyIncome);
  const [currentRent, setCurrentRent] = useState(saved?.currentRent ?? DEFAULTS.currentRent);
  const [livingExpenses, setLivingExpenses] = useState(saved?.livingExpenses ?? DEFAULTS.livingExpenses);
  const [monthlyObligations, setMonthlyObligations] = useState(saved?.monthlyObligations ?? DEFAULTS.monthlyObligations);
  const [buyerType, setBuyerType] = useState<BuyerType>(saved?.buyerType ?? DEFAULTS.buyerType);
  const [mortgageYears, setMortgageYears] = useState(saved?.mortgageYears ?? DEFAULTS.mortgageYears);
  const [interestRate, setInterestRate] = useState(saved?.interestRate ?? DEFAULTS.interestRate);
  const [wizardOpen, setWizardOpen] = useState(false);
  // True only after the user actually edited an input (this session or a past
  // one) — prefilled defaults must not count as real engagement.
  const [touched, setTouched] = useState(!!saved?.touched);
  const touch = () => setTouched(true);

  // Auto-save inputs
  useEffect(() => {
    save('budget', { equity, monthlyIncome, currentRent, livingExpenses, monthlyObligations, buyerType, mortgageYears, interestRate, touched }, uid);
    save('budget_profile', { equity, monthlyIncome, currentRent, livingExpenses, monthlyObligations, buyerType, mortgageYears }, uid);
  }, [equity, monthlyIncome, currentRent, livingExpenses, monthlyObligations, buyerType, mortgageYears, interestRate, touched, uid]);

  const result: BudgetOutput | null = useMemo(() => {
    if (equity <= 0 && monthlyIncome <= 0) return null;
    return calculateBudget({ equity, monthlyIncome, currentRent, livingExpenses, monthlyObligations, buyerType, mortgageYears, interestRate });
  }, [equity, monthlyIncome, currentRent, livingExpenses, monthlyObligations, buyerType, mortgageYears, interestRate]);

  // Save results for flow
  useEffect(() => {
    if (result) save('budget_results', result, uid);
  }, [result, uid]);

  // Auto-mark budget milestone — only after real user input (not defaults).
  const { complete: completeMilestone, isDone } = useJourney();
  const markedRef = useRef(false);
  useEffect(() => {
    if (
      !markedRef.current &&
      uid &&
      touched &&
      result &&
      result.maxPropertyValue > 0 &&
      !isDone('budget')
    ) {
      markedRef.current = true;
      completeMilestone('budget', {
        maxPropertyValue: result.maxPropertyValue,
      }).catch(() => {
        markedRef.current = false;
      });
    }
  }, [uid, touched, result, isDone, completeMilestone]);

  const handleReset = () => {
    if (!window.confirm('בטוח? כל הנתונים יימחקו')) return;
    setEquity(DEFAULTS.equity); setMonthlyIncome(DEFAULTS.monthlyIncome);
    setCurrentRent(DEFAULTS.currentRent); setLivingExpenses(DEFAULTS.livingExpenses);
    setMonthlyObligations(DEFAULTS.monthlyObligations); setBuyerType(DEFAULTS.buyerType);
    setMortgageYears(DEFAULTS.mortgageYears); setInterestRate(DEFAULTS.interestRate); setTouched(false);
    clear('budget', uid); clear('budget_profile', uid); clear('budget_results', uid);
  };

  const freeCashFlow = monthlyIncome - monthlyObligations;
  const obligationsExceedCashFlow = freeCashFlow <= 0 && monthlyIncome > 0;

  const applyWizard = (values: BudgetWizardValues) => {
    touch();
    setEquity(values.equity);
    setMonthlyIncome(values.monthlyIncome);
    setCurrentRent(values.currentRent ?? 0);
    setLivingExpenses(values.livingExpenses ?? 0);
    setMonthlyObligations(values.monthlyObligations);
    setBuyerType(values.buyerType);
    setMortgageYears(values.mortgageYears);
    save('budget', values, uid);
    save('budget_profile', values, uid);
  };

  const pieData = result ? [
    { name: 'הון עצמי נטו', value: result.equityBreakdown.netEquity, color: COLORS.equity },
    { name: 'מס רכישה', value: result.equityBreakdown.tax, color: COLORS.tax },
    { name: 'עלויות נלוות', value: result.equityBreakdown.costs, color: COLORS.costs },
  ].filter(d => d.value > 0) : [];

  return (
    <div className="space-y-6">
      <HomeGreeting />
      <YourNumbersStrip />
      <div className="md:grid md:grid-cols-5 md:gap-8">
        {/* Input Section */}
        <div className="md:col-span-2 space-y-4 md:sticky md:top-28 md:self-start">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Wallet className="w-6 h-6 text-primary" />
              מחשבון תקציב
            </h1>
            <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pb-1 sm:pb-0">
              <SaveSnapshotButton
                toolKey="budget"
                disabled={!result}
                getData={() => ({
                  inputs: { equity, monthlyIncome, currentRent, livingExpenses, monthlyObligations, buyerType, mortgageYears },
                  results: result,
                })}
              />
              <Button variant="ghost" size="sm" onClick={handleReset} className="text-muted-foreground h-8 gap-1">
                <RotateCcw className="w-3.5 h-3.5" /> אפס
              </Button>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            הזן הון עצמי, הכנסה נטו והתחייבויות — המערכת תחשב תזרים פנוי ותתרגם אותו לשווי נכס מקסימלי.
          </p>

          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="p-4 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold">רוצה למלא מהר?</p>
                <p className="text-xs text-muted-foreground">ענה על 7 שאלות ונמלא את המחשבון עבורך. הנתונים יישמרו לפעם הבאה.</p>
              </div>
              <Button size="sm" onClick={() => setWizardOpen(true)} className="w-full sm:w-auto">שאלון קצר</Button>
            </CardContent>
          </Card>

          <QuickBudgetWizard
            open={wizardOpen}
            onOpenChange={setWizardOpen}
            initialValues={{ equity, monthlyIncome, currentRent, livingExpenses, monthlyObligations, buyerType, mortgageYears }}
            onComplete={applyWizard}
          />

          {/* Equity */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">הון עצמי זמין</Label>
            <Input
              type="number" min="0"
              value={equity ?? ''}
              onChange={(e) => { touch(); setEquity(Number(e.target.value)); }}
              placeholder="400,000"
              className="text-lg font-semibold h-12"
            />
            <Slider
              value={[equity]}
              onValueChange={([v]) => { touch(); setEquity(v); }}
              min={0}
              max={3000000}
              step={10000}
              className="mt-1"
            />
            <div dir="ltr" className="flex justify-between text-[10px] text-muted-foreground">
              <span>{formatCurrency(0)}</span>
              <span>{formatCurrency(3000000)}</span>
            </div>
          </div>

          {/* Monthly Income */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">הכנסה חודשית נטו (משק בית)</Label>
            <Input
              type="number" min="0"
              value={monthlyIncome ?? ''}
              onChange={(e) => { touch(); setMonthlyIncome(Number(e.target.value)); }}
              placeholder="20,000"
            />
          </div>

          {/* Current Housing Cost */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">דיור נוכחי / שכירות</Label>
            <Input
              type="number" min="0"
              value={currentRent ?? ''}
              onChange={(e) => { touch(); setCurrentRent(Number(e.target.value)); }}
              placeholder="0"
            />
            <p className="text-[11px] text-muted-foreground">אם אתם כבר משלמים שכירות או משכנתא — זה נכנס לחישוב התזרים הפנוי.</p>
          </div>

          {/* Living Expenses */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">הוצאות מחיה חודשיות</Label>
            <Input
              type="number" min="0"
              value={livingExpenses ?? ''}
              onChange={(e) => { touch(); setLivingExpenses(Number(e.target.value)); }}
              placeholder="0"
            />
            <p className="text-[11px] text-muted-foreground">אוכל, תחבורה, בילויים וכל מה שלא נכלל בהתחייבויות.</p>
          </div>

          {/* Obligations */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">התחייבויות חודשיות קיימות</Label>
            <Input
              type="number" min="0"
              value={monthlyObligations ?? ''}
              onChange={(e) => { touch(); setMonthlyObligations(Number(e.target.value)); }}
              placeholder="0"
            />
            <p className="text-[11px] text-muted-foreground">הלוואות, אשראי, ליסינג וכו׳</p>
            {obligationsExceedCashFlow && (
              <p className="text-[11px] text-red-500 font-medium">התזרים הפנוי שלילי — לפי זה אין כרגע יכולת לשאת החזר משכנתא</p>
            )}
          </div>

          <Card className="border-0 shadow-sm bg-muted/40">
            <CardContent className="p-3 flex items-center justify-between">
              <div>
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">תזרים פנוי מחושב</p>
                <p className="text-xs text-muted-foreground">הכנסה נטו פחות התחייבויות</p>
              </div>
              <p className={cn('text-lg font-bold tabular-nums', freeCashFlow >= 0 ? 'text-green-600' : 'text-red-600')}>
                {formatCurrency(freeCashFlow)}
              </p>
            </CardContent>
          </Card>

          {/* Buyer Type */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">סוג רוכש</Label>
            <Select value={buyerType} onValueChange={(v: BuyerType) => { touch(); setBuyerType(v); }}>
              <SelectTrigger aria-label="סוג רוכש">
                <SelectValue placeholder={LABELS.common.selectPlaceholder} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="singleApartment">דירה ראשונה (יחידה)</SelectItem>
                <SelectItem value="additionalApartment">דירה נוספת / משקיע</SelectItem>
                <SelectItem value="foreignResident">תושב חוץ</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-[11px] text-muted-foreground">{BUYER_EQUITY_NOTE[buyerType]}</p>
          </div>

          {/* Mortgage Years */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">תקופת משכנתא</Label>
              <span className="text-sm font-bold text-primary">{mortgageYears} שנים</span>
            </div>
            <Slider
              value={[mortgageYears]}
              onValueChange={([v]) => { touch(); setMortgageYears(v); }}
              min={15}
              max={30}
              step={1}
            />
            <div dir="ltr" className="flex justify-between text-[10px] text-muted-foreground">
              <span>15 שנים</span>
              <span>30 שנים</span>
            </div>
          </div>

          {/* Interest rate assumption — visible, not hidden in the math */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium flex items-center gap-1">
                ריבית משוערת לחישוב
                <InfoTooltip text="הנחת ריבית ממוצעת להערכת ההחזר. הריבית בפועל תיקבע בתמהיל המשכנתא." />
              </Label>
              <span className="text-sm font-bold text-primary fig">{interestRate.toFixed(1)}%</span>
            </div>
            <Slider
              value={[interestRate]}
              onValueChange={([v]) => { touch(); setInterestRate(v); }}
              min={3}
              max={8}
              step={0.1}
            />
            <div dir="ltr" className="flex justify-between text-[10px] text-muted-foreground">
              <span>3%</span>
              <span>8%</span>
            </div>
          </div>
        </div>

        {/* Results Section */}
        <div className="md:col-span-3 mt-6 md:mt-0">
          <AnimatePresence mode="wait">
            {result && result.maxPropertyValue > 0 ? (
              <motion.div
                key="results"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-4"
              >
                {/* Main KPI */}
                <Card className="border-0 bg-primary/5 dark:bg-primary/10">
                  <CardContent className="p-6 text-center space-y-2">
                    <p className="text-sm text-muted-foreground mb-1">שווי דירה מקסימלי</p>
                    <p className="text-4xl md:text-5xl font-extrabold text-primary tracking-tight">
                      <AnimatedNumber value={result.maxPropertyValue} />
                    </p>
                    <p className="text-xs text-muted-foreground">
                      לפי <GlossaryLink term="ltv">מימון</GlossaryLink> של עד {Math.round(result.maxLtv * 100)}% (כללי בנק ישראל), החזר חודשי עד {formatCurrency(result.maxAffordableMortgagePayment)} וריבית משוערת {interestRate.toFixed(1)}%
                    </p>
                  </CardContent>
                </Card>

                {/* Regulatory explanations — official number + why */}
                {result.warnings.includes('DTI_CAPPED') && (
                  <Alert className="border-amber-500/40 bg-amber-500/10 text-amber-900 dark:text-amber-200">
                    <Info className="h-4 w-4 !text-amber-600" />
                    <AlertTitle>ההחזר החודשי הוגבל לפי כללי בנק ישראל</AlertTitle>
                    <AlertDescription className="text-xs leading-6">
                      התזרים הפנוי שלך ({formatCurrency(result.freeCashFlow)}) גבוה יותר, אבל בנק ישראל מחייב את
                      הבנקים להגביל את ההחזר החודשי ל-40% מההכנסה הפנויה — במקרה שלך {formatCurrency(result.dtiCapAmount)}.
                      בנק לא יאשר החזר גבוה מזה, ולכן זה המספר שהמחשבון עובד איתו.
                    </AlertDescription>
                  </Alert>
                )}
                {result.warnings.includes('EQUITY_LIMITED') && (
                  <Alert className="border-sky-500/40 bg-sky-500/10 text-sky-900 dark:text-sky-200">
                    <Info className="h-4 w-4 !text-sky-600" />
                    <AlertTitle>ההון העצמי הוא מה שמגביל אותך כרגע</AlertTitle>
                    <AlertDescription className="text-xs leading-6">
                      כושר ההחזר שלך מאפשר משכנתא גדולה יותר, אבל {BUYER_EQUITY_NOTE[buyerType]}.
                      הגדלת ההון העצמי תעלה את התקציב יותר מהגדלת ההכנסה.
                    </AlertDescription>
                  </Alert>
                )}

                <Card className="border-0 shadow-sm bg-muted/40">
                  <CardContent className="p-4 text-center">
                    <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">טווח מומלץ</p>
                    <p className="text-lg font-bold">{formatCurrency(result.recommendedPropertyValue)}</p>
                    <p className="text-[11px] text-muted-foreground">יעד שמרני יותר, שומר כרית נזילות ומקטין סיכון</p>
                  </CardContent>
                </Card>

                {/* Secondary KPIs */}
                <div className="grid grid-cols-2 gap-3">
                  <KPICard title="תזרים פנוי" value={formatCurrency(result.freeCashFlow)} icon={Wallet} color="bg-emerald-500" />
                  <KPICard title="שכירות/דיור נוכחי" value={formatCurrency(currentRent)} icon={Home} color="bg-slate-500" />
                  <KPICard title="הוצאות מחיה" value={formatCurrency(livingExpenses)} icon={PiggyBank} color="bg-violet-500" />
                  <KPICard title="החזר חודשי מרבי" value={formatCurrency(result.maxAffordableMortgagePayment)} icon={CreditCard} color="bg-teal-600" />
                  <KPICard title="משכנתא לפי תזרים" value={formatCurrency(result.maxMortgageByCashflow)} icon={Home} color="bg-teal-700" />
                  <KPICard title="מס רכישה" value={formatCurrency(result.purchaseTax)} icon={Receipt} color="bg-red-500" />
                  <KPICard title="עלויות נלוות" value={formatCurrency(result.sideCosts)} icon={PiggyBank} color="bg-orange-500" tooltip="עורך דין, שמאי, רישום טאבו, ביטוח, מתווך" />
                </div>

                {/* Cash Flow Indicator */}
                <Card className="border-0 shadow-sm">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span className="text-muted-foreground flex items-center gap-1">משכנתא מול תזרים פנוי <InfoTooltip text="החזר המשכנתא המקסימלי לא יכול לעלות על התזרים הפנוי של משק הבית" /></span>
                      <span className={cn('font-semibold', result.monthlyPayment <= result.maxAffordableMortgagePayment ? 'text-green-600' : 'text-red-600')}>
                        {formatCurrency(result.monthlyPayment)} / {formatCurrency(result.maxAffordableMortgagePayment)}
                      </span>
                    </div>
                    <div className="h-2.5 bg-muted rounded-full overflow-hidden">
                      <motion.div
                        className={cn('h-full rounded-full', result.monthlyPayment <= result.maxAffordableMortgagePayment ? 'bg-green-500' : 'bg-red-500')}
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min((result.maxAffordableMortgagePayment > 0 ? result.monthlyPayment / result.maxAffordableMortgagePayment : 1) * 100, 100)}%` }}
                        transition={{ duration: 0.5 }}
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Equity Breakdown Pie */}
                {pieData.length > 0 && (
                  <Card className="border-0 shadow-sm">
                    <CardContent className="p-4">
                      <p className="text-sm font-semibold mb-3">פירוט הון עצמי</p>
                      <div id="budget-chart">
                      <ResponsiveContainer width="100%" height={250}>
                        <PieChart>
                          <Pie
                            data={pieData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={95}
                            paddingAngle={3}
                            dataKey="value"
                          >
                            {pieData.map((entry, i) => (
                              <Cell key={i} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                )}
                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-2">
                  <Link to="/mortgage" className="flex-1">
                    <Button variant="default" className="w-full gap-1.5">
                      בנה משכנתא <ArrowLeft className="w-4 h-4" />
                    </Button>
                  </Link>
                  <Link to="/business-plan" className="flex-1">
                    <Button variant="outline" className="w-full gap-1.5">
                      תוכנית עסקית <ArrowLeft className="w-4 h-4" />
                    </Button>
                  </Link>
                </div>
                <InsightBanner context="budget" refreshKey={result} />
                <NextStepCard currentMilestone="budget" />
                <div className="flex justify-end">
                  <ExportButton
                    title="דוח ניתוח תקציב"
                    chartElementId="budget-chart"
                    executiveSummary={[
                      `שווי דירה מקסימלי: ${formatCurrency(result.maxPropertyValue)}`,
                      `טווח מומלץ: ${formatCurrency(result.recommendedPropertyValue)}`,
                      `תזרים פנוי: ${formatCurrency(result.freeCashFlow)}`,
                      `סכום משכנתא: ${formatCurrency(result.maxMortgage)}`,
                      `החזר חודשי: ${formatCurrency(result.monthlyPayment)}`,
                    ]}
                    sections={[
                      { title: 'תוצאות עיקריות', items: [
                        { label: 'שווי דירה מקסימלי', value: formatCurrency(result.maxPropertyValue) },
                        { label: 'טווח מומלץ', value: formatCurrency(result.recommendedPropertyValue) },
                        { label: 'תזרים פנוי', value: formatCurrency(result.freeCashFlow) },
                        { label: 'סכום משכנתא', value: formatCurrency(result.maxMortgage) },
                        { label: 'החזר חודשי', value: formatCurrency(result.monthlyPayment) },
                        { label: 'מס רכישה', value: formatCurrency(result.purchaseTax) },
                        { label: 'עלויות נלוות', value: formatCurrency(result.sideCosts) },
                      ]},
                      { title: 'נתוני קלט', items: [
                        { label: 'הון עצמי', value: formatCurrency(equity) },
                        { label: 'הכנסה חודשית נטו', value: formatCurrency(monthlyIncome) },
                        { label: 'דיור נוכחי / שכירות', value: formatCurrency(currentRent) },
                        { label: 'הוצאות מחיה', value: formatCurrency(livingExpenses) },
                        { label: 'תזרים פנוי', value: formatCurrency(result.freeCashFlow) },
                        { label: 'התחייבויות', value: formatCurrency(monthlyObligations) },
                        { label: 'תקופת משכנתא', value: `${mortgageYears} שנים` },
                      ]},
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
                  icon={<Wallet className="w-6 h-6" />}
                  title="בוא נגלה כמה דירה אתה יכול להרשות לעצמך"
                  description="הזן הון עצמי, הכנסה והתחייבויות — או ענה על 7 שאלות קצרות ונמלא הכל בשבילך."
                  action={(
                    <Button onClick={() => setWizardOpen(true)}>שאלון קצר</Button>
                  )}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
