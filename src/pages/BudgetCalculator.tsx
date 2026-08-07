import { useState, useMemo, useEffect, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Wallet, Home, CreditCard, Receipt, PiggyBank, ArrowLeft } from 'lucide-react';
import { ResetConfirmButton } from '@/components/ResetConfirmButton';
import { ExampleDataBadge } from '@/components/ExampleDataBadge';
import { PageInsights } from '@/components/PageInsights';
import { calculateBudget, BudgetOutput } from '@/lib/calculations/budget-calculator';
import { BuyerType } from '@/lib/calculations/purchase-tax';
import { formatCurrency, numInput } from '@/lib/validation/validators';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { save, load, clear } from '@/lib/storage';
import { useAuth } from '@/contexts/AuthContext';
import { ExportButton } from '@/components/ExportButton';
import { InfoTooltip } from '@/components/InfoTooltip';
import { SaveSnapshotButton } from '@/components/SaveSnapshotButton';
import { HomeGreeting } from '@/components/HomeGreeting';
import NextStepCard from '@/components/NextStepCard';
import { useJourney } from '@/hooks/useJourney';
import { LABELS } from '@/lib/content/labels';
import { getMinEquityShare } from '@/lib/constants/financial';
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

const DEFAULTS = { equity: 400000, monthlyIncome: 20000, currentRent: 0, livingExpenses: 0, monthlyObligations: 0, buyerType: 'singleApartment' as BuyerType, mortgageYears: 25 };

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
  // True only after the user actually edited an input (this session or a past
  // one) — prefilled defaults must not count as real engagement.
  const [touched, setTouched] = useState(!!saved?.touched);
  const touch = () => setTouched(true);

  // Auto-save inputs — רק אחרי קלט אמיתי. שמירת ברירות המחדל לפני מגע
  // ראשון גרמה לנתוני דוגמה להישמר בענן, להסתמן כ"בוצע", להתייבא לכלים
  // אחרים ולהצטטט ע"י יועץ ה-AI כאילו הם של התלמיד.
  useEffect(() => {
    if (!touched) return;
    save('budget', { equity, monthlyIncome, currentRent, livingExpenses, monthlyObligations, buyerType, mortgageYears, touched }, uid);
    save('budget_profile', { equity, monthlyIncome, currentRent, livingExpenses, monthlyObligations, buyerType, mortgageYears }, uid);
  }, [equity, monthlyIncome, currentRent, livingExpenses, monthlyObligations, buyerType, mortgageYears, touched, uid]);

  const result: BudgetOutput | null = useMemo(() => {
    if (equity <= 0 && monthlyIncome <= 0) return null;
    return calculateBudget({ equity, monthlyIncome, currentRent, livingExpenses, monthlyObligations, buyerType, mortgageYears });
  }, [equity, monthlyIncome, currentRent, livingExpenses, monthlyObligations, buyerType, mortgageYears]);

  // Save results for flow — גם כאן רק אחרי קלט אמיתי
  useEffect(() => {
    if (result && touched) save('budget_results', result, uid);
  }, [result, touched, uid]);

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

  const doReset = () => {
    setEquity(DEFAULTS.equity); setMonthlyIncome(DEFAULTS.monthlyIncome);
    setCurrentRent(DEFAULTS.currentRent); setLivingExpenses(DEFAULTS.livingExpenses);
    setMonthlyObligations(DEFAULTS.monthlyObligations); setBuyerType(DEFAULTS.buyerType);
    setMortgageYears(DEFAULTS.mortgageYears); setTouched(false);
    clear('budget', uid); clear('budget_profile', uid); clear('budget_results', uid);
  };

  // "התחל מנתונים ריקים" מהבאדג' — מאפס לשדות ריקים בלי דיאלוג
  const handleStartEmpty = () => {
    setEquity(0); setMonthlyIncome(0); setCurrentRent(0); setLivingExpenses(0);
    setMonthlyObligations(0);
  };

  // אותה הגדרה בדיוק כמו במנוע (budget-calculator.ts) — ערך אחד לכל העמוד
  const freeCashFlow = monthlyIncome - currentRent - livingExpenses - monthlyObligations;
  const obligationsExceedCashFlow = freeCashFlow <= 0 && monthlyIncome > 0;

  const pieData = result ? [
    { name: 'הון עצמי נטו', value: result.equityBreakdown.netEquity, color: COLORS.equity },
    { name: 'מס רכישה', value: result.equityBreakdown.tax, color: COLORS.tax },
    { name: 'עלויות נלוות', value: result.equityBreakdown.costs, color: COLORS.costs },
  ].filter(d => d.value > 0) : [];

  return (
    <div className="space-y-6">
      <HomeGreeting />
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
              <ResetConfirmButton onConfirm={doReset} />
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            הזן הון עצמי, הכנסה נטו והתחייבויות — המערכת תחשב תזרים פנוי ותתרגם אותו לשווי נכס מקסימלי.
          </p>

          {/* Equity */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">הון עצמי זמין</Label>
            <Input
              type="number" min="0"
              value={equity ?? ''}
              onChange={(e) => { touch(); setEquity(numInput(e.target.value)); }}
              placeholder="400,000"
              className="text-lg font-semibold h-12"
            />
            <Slider
              aria-label="הון עצמי זמין"
              value={[equity]}
              onValueChange={([v]) => { touch(); setEquity(v); }}
              min={0}
              max={3000000}
              step={10000}
              className="mt-1"
            />
            <div dir="ltr" className="flex justify-between text-[10px] text-muted-foreground">
              <span>₪0</span>
              <span>₪3,000,000</span>
            </div>
          </div>

          {/* Monthly Income */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">הכנסה חודשית נטו (משק בית)</Label>
            <Input
              type="number" min="0"
              value={monthlyIncome ?? ''}
              onChange={(e) => { touch(); setMonthlyIncome(numInput(e.target.value)); }}
              placeholder="20,000"
            />
          </div>

          {/* Current Housing Cost */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">דיור נוכחי / שכירות</Label>
            <Input
              type="number" min="0"
              value={currentRent ?? ''}
              onChange={(e) => { touch(); setCurrentRent(numInput(e.target.value)); }}
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
              onChange={(e) => { touch(); setLivingExpenses(numInput(e.target.value)); }}
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
              onChange={(e) => { touch(); setMonthlyObligations(numInput(e.target.value)); }}
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
                <p className="text-xs text-muted-foreground">הכנסה נטו פחות שכירות, מחיה והתחייבויות</p>
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
                <SelectItem value="upgrade">משפר דיור (מוכר את הקיימת)</SelectItem>
                <SelectItem value="additionalApartment">דירה נוספת / משקיע</SelectItem>
                <SelectItem value="foreignResident">תושב חוץ</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-[11px] text-muted-foreground">משפיע על מס רכישה, אחוז מימון ועלויות נלוות</p>
          </div>

          {/* Mortgage Years */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">תקופת משכנתא</Label>
              <span className="text-sm font-bold text-primary">{mortgageYears} שנים</span>
            </div>
            <Slider
              aria-label="תקופת משכנתא בשנים"
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
                {!touched && <ExampleDataBadge onReset={handleStartEmpty} />}
                {/* Main KPI */}
                <Card className="border-0 bg-primary/5 dark:bg-primary/10">
                  <CardContent className="p-6 text-center space-y-2">
                    <p className="text-sm text-muted-foreground mb-1">שווי דירה מקסימלי</p>
                    <p className="text-4xl md:text-5xl font-extrabold text-primary tracking-tight">
                      <AnimatedNumber value={result.maxPropertyValue} />
                    </p>
                    <p className="text-xs text-muted-foreground">
                      לפי הון עצמי של לפחות {Math.round(getMinEquityShare(buyerType) * 100)}% (תקרת המימון החוקית) והחזר חודשי של עד {formatCurrency(result.maxAffordableMortgagePayment)}
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-sm bg-muted/40">
                  <CardContent className="p-4 text-center">
                    <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">טווח מומלץ</p>
                    <p className="text-lg font-bold">{formatCurrency(result.recommendedPropertyValue)}</p>
                    <p className="text-[11px] text-muted-foreground">יעד שמרני יותר, שומר כרית נזילות ומקטין סיכון</p>
                  </CardContent>
                </Card>

                {/* Secondary KPIs */}
                <div className="grid grid-cols-2 gap-3">
                  <KPICard
                    title="תזרים פנוי אחרי רכישה"
                    value={formatCurrency(result.freeCashFlowAfterPurchase)}
                    icon={Wallet}
                    color="bg-emerald-500"
                    tooltip={`אחרי הקנייה שכר הדירה נפסק, ובמקומו נכנסות עלויות אחזקה (ארנונה, ועד, ביטוח ≈ ${formatCurrency(result.monthlyCarryingCosts)}/חודש). מזה משלמים את המשכנתא.`}
                  />
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
                {/* הסדר הקנוני של המסע: תקציב → תוכנית עסקית → משכנתא */}
                <div className="flex flex-col sm:flex-row gap-2">
                  <Link to="/business-plan" className="flex-1">
                    <Button variant="default" className="w-full gap-1.5">
                      המשך לתוכנית עסקית <ArrowLeft className="w-4 h-4" />
                    </Button>
                  </Link>
                  <Link to="/mortgage" className="flex-1">
                    <Button variant="outline" className="w-full gap-1.5">
                      בנה משכנתא <ArrowLeft className="w-4 h-4" />
                    </Button>
                  </Link>
                </div>
                {touched && <PageInsights tool="תקציב" recomputeKey={result} />}
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
                className="flex flex-col items-center justify-center py-20 text-center"
              >
                <div className="w-16 h-16 bg-muted rounded-2xl flex items-center justify-center mb-4">
                  <Wallet className="w-8 h-8 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground text-sm">
                  הזן הון עצמי, הכנסה והתחייבויות כדי לראות תוצאות
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
