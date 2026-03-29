import { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Wallet, Home, CreditCard, Receipt, PiggyBank } from 'lucide-react';
import { calculateBudget, BudgetOutput } from '@/lib/calculations/budget-calculator';
import { BuyerType } from '@/lib/calculations/purchase-tax';
import { formatCurrency } from '@/lib/validation/validators';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

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

function KPICard({ title, value, icon: Icon, color, large }: {
  title: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  large?: boolean;
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
          <span className="text-xs text-muted-foreground font-medium">{title}</span>
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
        <span className="text-muted-foreground">יחס החזר/הכנסה (DTI)</span>
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

export default function BudgetCalculator() {
  const [equity, setEquity] = useState(400000);
  const [monthlyIncome, setMonthlyIncome] = useState(20000);
  const [monthlyObligations, setMonthlyObligations] = useState(0);
  const [buyerType, setBuyerType] = useState<BuyerType>('singleApartment');
  const [mortgageYears, setMortgageYears] = useState(25);

  const result: BudgetOutput | null = useMemo(() => {
    if (equity <= 0 && monthlyIncome <= 0) return null;
    return calculateBudget({
      equity,
      monthlyIncome,
      monthlyObligations,
      buyerType,
      mortgageYears,
    });
  }, [equity, monthlyIncome, monthlyObligations, buyerType, mortgageYears]);

  const pieData = result ? [
    { name: 'הון עצמי נטו', value: result.equityBreakdown.netEquity, color: COLORS.equity },
    { name: 'מס רכישה', value: result.equityBreakdown.tax, color: COLORS.tax },
    { name: 'עלויות נלוות', value: result.equityBreakdown.costs, color: COLORS.costs },
  ].filter(d => d.value > 0) : [];

  return (
    <div className="space-y-6">
      <div className="md:grid md:grid-cols-5 md:gap-8">
        {/* Input Section */}
        <div className="md:col-span-2 space-y-4 md:sticky md:top-28 md:self-start">
          <h1 className="text-2xl font-bold">מחשבון תקציב</h1>
          <p className="text-sm text-muted-foreground">
            כמה דירה אתה יכול לקנות? הזן את הנתונים וקבל תשובה מיידית.
          </p>

          {/* Equity */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">הון עצמי זמין</Label>
            <Input
              type="number"
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
              type="number"
              value={monthlyIncome ?? ''}
              onChange={(e) => setMonthlyIncome(Number(e.target.value))}
              placeholder="20,000"
            />
          </div>

          {/* Obligations */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">התחייבויות חודשיות קיימות</Label>
            <Input
              type="number"
              value={monthlyObligations ?? ''}
              onChange={(e) => setMonthlyObligations(Number(e.target.value))}
              placeholder="0"
            />
            <p className="text-[11px] text-muted-foreground">הלוואות, אשראי, ליסינג וכו׳</p>
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
                    </CardContent>
                  </Card>
                )}
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
