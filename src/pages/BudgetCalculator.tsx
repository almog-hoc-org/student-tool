import { useState, useMemo, useEffect } from 'react';
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
import { BuyerType } from '@/lib/calculations/purchase-tax';
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
import { Link } from 'react-router-dom';

const COLORS = {
  equity: '#3B82F6',
  tax: '#EF4444',
  costs: '#F59E0B',
};

function AnimatedNumber({ value, prefix = '₪' }: { value: number; prefix?: string }) {
  return (
    <motion.span
      key={value}
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
          'font-bold tracking-tight',
          large ? 'text-3xl md:text-4xl' : 'text-xl md:text-2xl'
        )}>
          {value}
        </p>
      </CardContent>
    </Card>
  );
}

function DtiIndicator({ percent }: { percent: number }) {
  const getStatus = () => {
    if (percent < 30) return { label: 'בטוח', color: 'bg-green-500', textColor: 'text-green-600' };
    if (percent < 37) return { label: 'סביר', color: 'bg-amber-500', textColor: 'text-amber-600' };
    return { label: 'גבולי', color: 'bg-red-500', textColor: 'text-red-600' };
  };
  const status = getStatus();

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground flex items-center gap-1">יחס החזר/הכנסה (DTI) <InfoTooltip text="הבנק דורש שמקסימום 40% מההכנסה החודשית ילך להחזרי הלוואות — כולל המשכנתא החדשה" /></span>
        <span className={cn('font-semibold', status.textColor)}>
          {percent.toFixed(1)}% — {status.label}
        </span>
      </div>
      <div className="h-2.5 bg-muted rounded-full overflow-hidden">
        <motion.div
          className={cn('h-full rounded-full', status.color)}
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(percent / 50 * 100, 100)}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
      </div>
      <div className="flex justify-between text-[10px] text-muted-foreground">
        <span>0%</span>
        <span>30%</span>
        <span>40% (מקסימום)</span>
        <span>50%</span>
      </div>
    </div>
  );
}

const DEFAULTS = { equity: 400000, monthlyIncome: 20000, monthlyObligations: 0, buyerType: 'singleApartment' as BuyerType, mortgageYears: 25 };

interface BudgetWizardValues {
  equity: number;
  monthlyIncome: number;
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
          <SelectTrigger className="h-12"><SelectValue /></SelectTrigger>
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
          <div className="flex justify-between text-[11px] text-muted-foreground">
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
      <DialogContent dir="rtl" className="sm:max-w-md">
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
  const saved = load<typeof DEFAULTS>('budget');
  const [equity, setEquity] = useState(saved?.equity ?? DEFAULTS.equity);
  const [monthlyIncome, setMonthlyIncome] = useState(saved?.monthlyIncome ?? DEFAULTS.monthlyIncome);
  const [monthlyObligations, setMonthlyObligations] = useState(saved?.monthlyObligations ?? DEFAULTS.monthlyObligations);
  const [buyerType, setBuyerType] = useState<BuyerType>(saved?.buyerType ?? DEFAULTS.buyerType);
  const [mortgageYears, setMortgageYears] = useState(saved?.mortgageYears ?? DEFAULTS.mortgageYears);
  const [wizardOpen, setWizardOpen] = useState(false);

  // Auto-save inputs
  useEffect(() => {
    save('budget', { equity, monthlyIncome, monthlyObligations, buyerType, mortgageYears }, uid);
    save('budget_profile', { equity, monthlyIncome, monthlyObligations, buyerType, mortgageYears }, uid);
  }, [equity, monthlyIncome, monthlyObligations, buyerType, mortgageYears, uid]);

  const result: BudgetOutput | null = useMemo(() => {
    if (equity <= 0 && monthlyIncome <= 0) return null;
    return calculateBudget({ equity, monthlyIncome, monthlyObligations, buyerType, mortgageYears });
  }, [equity, monthlyIncome, monthlyObligations, buyerType, mortgageYears]);

  // Save results for flow
  useEffect(() => {
    if (result) save('budget_results', result, uid);
  }, [result, uid]);

  const handleReset = () => {
    if (!window.confirm('בטוח? כל הנתונים יימחקו')) return;
    setEquity(DEFAULTS.equity); setMonthlyIncome(DEFAULTS.monthlyIncome);
    setMonthlyObligations(DEFAULTS.monthlyObligations); setBuyerType(DEFAULTS.buyerType);
    setMortgageYears(DEFAULTS.mortgageYears); clear('budget', uid); clear('budget_results', uid);
  };

  const maxAllowedPayment = monthlyIncome * 0.4;
  const obligationsExceedDTI = monthlyObligations >= maxAllowedPayment && monthlyIncome > 0;

  const applyWizard = (values: BudgetWizardValues) => {
    setEquity(values.equity);
    setMonthlyIncome(values.monthlyIncome);
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
      <div className="md:grid md:grid-cols-5 md:gap-8">
        {/* Input Section */}
        <div className="md:col-span-2 space-y-4 md:sticky md:top-28 md:self-start">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Wallet className="w-6 h-6 text-primary" />
              מחשבון תקציב
            </h1>
            <div className="flex items-center gap-1">
              <SaveSnapshotButton
                toolKey="budget"
                disabled={!result}
                getData={() => ({
                  inputs: { equity, monthlyIncome, monthlyObligations, buyerType, mortgageYears },
                  results: result,
                })}
              />
              <Button variant="ghost" size="sm" onClick={handleReset} className="text-muted-foreground h-8 gap-1">
                <RotateCcw className="w-3.5 h-3.5" /> אפס
              </Button>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            כמה דירה אתה יכול לקנות? הזן את הנתונים וקבל תשובה מיידית.
          </p>

          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="p-4 flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold">רוצה למלא מהר?</p>
                <p className="text-xs text-muted-foreground">ענה על 5 שאלות ונמלא את המחשבון עבורך. הנתונים יישמרו לפעם הבאה.</p>
              </div>
              <Button size="sm" onClick={() => setWizardOpen(true)}>שאלון קצר</Button>
            </CardContent>
          </Card>

          <QuickBudgetWizard
            open={wizardOpen}
            onOpenChange={setWizardOpen}
            initialValues={{ equity, monthlyIncome, monthlyObligations, buyerType, mortgageYears }}
            onComplete={applyWizard}
          />

          {/* Equity */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">הון עצמי זמין</Label>
            <Input
              type="number" min="0"
              value={equity ?? ''}
              onChange={(e) => setEquity(Number(e.target.value))}
              placeholder="400,000"
              className="text-lg font-semibold h-12"
            />
            <Slider
              value={[equity]}
              onValueChange={([v]) => setEquity(v)}
              min={0}
              max={3000000}
              step={10000}
              className="mt-1"
            />
            <div className="flex justify-between text-[10px] text-muted-foreground">
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
              onChange={(e) => setMonthlyIncome(Number(e.target.value))}
              placeholder="20,000"
            />
          </div>

          {/* Obligations */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">התחייבויות חודשיות קיימות</Label>
            <Input
              type="number" min="0"
              value={monthlyObligations ?? ''}
              onChange={(e) => setMonthlyObligations(Number(e.target.value))}
              placeholder="0"
            />
            <p className="text-[11px] text-muted-foreground">הלוואות, אשראי, ליסינג וכו׳</p>
            {obligationsExceedDTI && (
              <p className="text-[11px] text-red-500 font-medium">ההתחייבויות חורגות מ-40% מההכנסה — לא ניתן לקבל משכנתא</p>
            )}
          </div>

          {/* Buyer Type */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">סוג רוכש</Label>
            <Select value={buyerType} onValueChange={(v: BuyerType) => setBuyerType(v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="singleApartment">דירה ראשונה (יחידה)</SelectItem>
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
              value={[mortgageYears]}
              onValueChange={([v]) => setMortgageYears(v)}
              min={15}
              max={30}
              step={1}
            />
            <div className="flex justify-between text-[10px] text-muted-foreground">
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
                {/* Main KPI */}
                <Card className="border-0 bg-primary/5 dark:bg-primary/10">
                  <CardContent className="p-6 text-center">
                    <p className="text-sm text-muted-foreground mb-1">שווי דירה מקסימלי</p>
                    <p className="text-4xl md:text-5xl font-extrabold text-primary tracking-tight">
                      <AnimatedNumber value={result.maxPropertyValue} />
                    </p>
                  </CardContent>
                </Card>

                {/* Secondary KPIs */}
                <div className="grid grid-cols-2 gap-3">
                  <KPICard
                    title="סכום משכנתא"
                    value={formatCurrency(result.maxMortgage)}
                    icon={Home}
                    color="bg-blue-500"
                  />
                  <KPICard
                    title="החזר חודשי"
                    value={formatCurrency(result.monthlyPayment)}
                    icon={CreditCard}
                    color="bg-indigo-500"
                  />
                  <KPICard
                    title="מס רכישה"
                    value={formatCurrency(result.purchaseTax)}
                    icon={Receipt}
                    color="bg-red-500"
                  />
                  <KPICard
                    title="עלויות נלוות"
                    value={formatCurrency(result.sideCosts)}
                    icon={PiggyBank}
                    color="bg-amber-500"
                    tooltip="עורך דין, שמאי, רישום טאבו, ביטוח, מתווך"
                  />
                </div>

                {/* DTI Indicator */}
                <Card className="border-0 shadow-sm">
                  <CardContent className="p-4">
                    <DtiIndicator percent={result.dtiPercent} />
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
                <div className="flex justify-end">
                  <ExportButton
                    title="דוח ניתוח תקציב"
                    chartElementId="budget-chart"
                    executiveSummary={[
                      `שווי דירה מקסימלי: ${formatCurrency(result.maxPropertyValue)}`,
                      `סכום משכנתא: ${formatCurrency(result.maxMortgage)}`,
                      `החזר חודשי: ${formatCurrency(result.monthlyPayment)}`,
                      `DTI: ${result.dtiPercent.toFixed(1)}%`,
                    ]}
                    sections={[
                      { title: 'תוצאות עיקריות', items: [
                        { label: 'שווי דירה מקסימלי', value: formatCurrency(result.maxPropertyValue) },
                        { label: 'סכום משכנתא', value: formatCurrency(result.maxMortgage) },
                        { label: 'החזר חודשי', value: formatCurrency(result.monthlyPayment) },
                        { label: 'מס רכישה', value: formatCurrency(result.purchaseTax) },
                        { label: 'עלויות נלוות', value: formatCurrency(result.sideCosts) },
                      ]},
                      { title: 'נתוני קלט', items: [
                        { label: 'הון עצמי', value: formatCurrency(equity) },
                        { label: 'הכנסה חודשית', value: formatCurrency(monthlyIncome) },
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
                  הזן הון עצמי והכנסה כדי לראות תוצאות
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
