import { useState, useMemo, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { BarChart3, Import, RotateCcw } from 'lucide-react';
import { SaveSnapshotButton } from '@/components/SaveSnapshotButton';
import { calculateBusinessPlan, BusinessPlanOutput, ScenarioResult } from '@/lib/calculations/business-plan';
import { formatCurrency } from '@/lib/validation/validators';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, Legend } from 'recharts';
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

function ScenarioCard({ scenario, style }: { scenario: ScenarioResult; style: typeof SCENARIO_COLORS.pessimistic }) {
  return (
    <Card className={cn('border', style.border, style.bg)}>
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className={cn('text-sm font-bold', style.text)}>{scenario.label}</span>
          <span className={cn('text-xs font-semibold px-2 py-0.5 rounded-full', style.bg, style.text)}>
            {scenario.annualAppreciation}% שנתי
          </span>
        </div>

        <div className="space-y-2">
          <div>
            <p className="text-[11px] text-muted-foreground">שווי נכס בסוף תקופה</p>
            <p className="text-xl font-bold">{formatCurrency(scenario.propertyValueAtEnd)}</p>
          </div>
          <div>
            <p className="text-[11px] text-muted-foreground">רווח כולל</p>
            <p className={cn('text-lg font-bold', scenario.totalProfit >= 0 ? 'text-green-600' : 'text-red-600')}>
              {formatCurrency(scenario.totalProfit)}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <p className="text-[11px] text-muted-foreground flex items-center gap-1">תשואת COC <InfoTooltip text="כמה אתה מרוויח בשנה ביחס להון שהשקעת — שכירות נטו חלקי הון עצמי" /></p>
              <p className="text-base font-semibold">{(scenario.cocYield * 100).toFixed(1)}%</p>
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground flex items-center gap-1">IRR <InfoTooltip text="שיעור תשואה פנימי: התשואה האמיתית כולל עליית ערך, שכירות ועלויות — המדד המקצועי להשוואת השקעות" /></p>
              <p className="text-base font-semibold">
                {scenario.irr !== null ? `${(scenario.irr * 100).toFixed(1)}%` : 'N/A'}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

const BP_DEFAULTS = {
  purchasePrice: 1200000, sideCosts: 40000, renovationCost: 0, equityInvested: 400000,
  mortgageAmount: 800000, mortgageMonthlyPayment: 4500, mortgageInterestRate: 5, mortgageYears: 25,
  expectedMonthlyRent: 4000, annualOperatingCosts: 8000, holdingPeriodYears: 10,
  baseAppreciation: 3, manualMode: false, customRates: { pessimistic: 1, average: 3, optimistic: 5 },
};

export default function BusinessPlan() {
  const { user } = useAuth();
  const uid = user?.id;
  const saved = load<typeof BP_DEFAULTS>('business_plan');
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

  // Auto-save
  useEffect(() => {
    save('business_plan', {
      purchasePrice, sideCosts, renovationCost, equityInvested, mortgageAmount,
      mortgageMonthlyPayment, mortgageInterestRate, mortgageYears, expectedMonthlyRent,
      annualOperatingCosts, holdingPeriodYears, baseAppreciation, manualMode, customRates,
    }, uid);
  }, [purchasePrice, sideCosts, renovationCost, equityInvested, mortgageAmount,
    mortgageMonthlyPayment, mortgageInterestRate, mortgageYears, expectedMonthlyRent,
    annualOperatingCosts, holdingPeriodYears, baseAppreciation, manualMode, customRates, uid]);

  const budgetData = getBudgetResults();

  const handleImportBudget = () => {
    if (!budgetData) return;
    setPurchasePrice(budgetData.maxPropertyValue);
    setEquityInvested(budgetData.equity);
    setMortgageAmount(budgetData.maxMortgage);
    setMortgageMonthlyPayment(budgetData.monthlyPayment);
    setSideCosts(budgetData.purchaseTax + budgetData.sideCosts);
    // Import interest rate from mortgage results if available
    const mortgageData = load<any>('mortgage_results');
    if (mortgageData?.weightedAverageInterest) {
      setMortgageInterestRate(mortgageData.weightedAverageInterest);
    }
  };

  const handleReset = () => {
    if (!window.confirm('בטוח? כל הנתונים יימחקו')) return;
    Object.entries(BP_DEFAULTS).forEach(([k, v]) => {
      const setters: Record<string, Function> = {
        purchasePrice: setPurchasePrice, sideCosts: setSideCosts, renovationCost: setRenovationCost,
        equityInvested: setEquityInvested, mortgageAmount: setMortgageAmount,
        mortgageMonthlyPayment: setMortgageMonthlyPayment, mortgageInterestRate: setMortgageInterestRate,
        mortgageYears: setMortgageYears, expectedMonthlyRent: setExpectedMonthlyRent,
        annualOperatingCosts: setAnnualOperatingCosts, holdingPeriodYears: setHoldingPeriodYears,
        baseAppreciation: setBaseAppreciation, manualMode: setManualMode, customRates: setCustomRates,
      };
      setters[k]?.(v);
    });
    clear('business_plan', uid);
  };

  const result: BusinessPlanOutput | null = useMemo(() => {
    if (purchasePrice <= 0) return null;
    return calculateBusinessPlan(
      {
        purchasePrice, sideCosts, renovationCost,
        equityInvested, mortgageAmount, mortgageMonthlyPayment,
        mortgageInterestRate, mortgageYears, expectedMonthlyRent,
        annualOperatingCosts, holdingPeriodYears,
      },
      baseAppreciation,
      manualMode ? customRates : undefined,
    );
  }, [purchasePrice, sideCosts, renovationCost, equityInvested, mortgageAmount,
    mortgageMonthlyPayment, mortgageInterestRate, mortgageYears, expectedMonthlyRent,
    annualOperatingCosts, holdingPeriodYears, baseAppreciation, manualMode, customRates]);

  // Chart data - merge yearly projections
  const chartData = useMemo(() => {
    if (!result) return [];
    const years = result.scenarios[0].yearlyProjection.length;
    return Array.from({ length: years }, (_, i) => ({
      year: i,
      מחמיר: result.scenarios[0].yearlyProjection[i]?.value || 0,
      ממוצע: result.scenarios[1].yearlyProjection[i]?.value || 0,
      אופטימי: result.scenarios[2].yearlyProjection[i]?.value || 0,
    }));
  }, [result]);

  return (
    <div className="space-y-6">
      <div className="md:grid md:grid-cols-5 md:gap-8">
        {/* Input Section */}
        <div className="md:col-span-2 space-y-4 md:sticky md:top-28 md:self-start">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">תוכנית עסקית</h1>
            <div className="flex items-center gap-1">
              <SaveSnapshotButton
                toolKey="business_plan"
                disabled={!result}
                getData={() => ({
                  inputs: {
                    purchasePrice, sideCosts, renovationCost, equityInvested,
                    mortgageAmount, mortgageMonthlyPayment, mortgageInterestRate,
                    mortgageYears, expectedMonthlyRent, annualOperatingCosts,
                    holdingPeriodYears, baseAppreciation, manualMode, customRates,
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

          {budgetData && (
            <Button variant="outline" size="sm" onClick={handleImportBudget} className="w-full gap-1.5 border-primary/30 text-primary">
              <Import className="w-4 h-4" /> ייבא נתונים ממחשבון התקציב
            </Button>
          )}

          {/* Deal Details */}
          <div className="space-y-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">פרטי עסקה</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">מחיר רכישה</Label>
                <Input type="number" min="0" value={purchasePrice ?? ''} onChange={(e) => setPurchasePrice(Number(e.target.value))} />
              </div>
              <div>
                <Label className="text-xs">עלויות נלוות</Label>
                <Input type="number" min="0" value={sideCosts ?? ''} onChange={(e) => setSideCosts(Number(e.target.value))} />
              </div>
              <div>
                <Label className="text-xs">עלות שיפוץ</Label>
                <Input type="number" min="0" value={renovationCost ?? ''} onChange={(e) => setRenovationCost(Number(e.target.value))} />
              </div>
              <div>
                <Label className="text-xs">תקופת החזקה (שנים)</Label>
                <Input type="number" min="0" value={holdingPeriodYears ?? ''} onChange={(e) => setHoldingPeriodYears(Number(e.target.value))} />
              </div>
            </div>
          </div>

          {/* Financing */}
          <div className="space-y-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">מימון</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">הון עצמי</Label>
                <Input type="number" min="0" value={equityInvested ?? ''} onChange={(e) => setEquityInvested(Number(e.target.value))} />
              </div>
              <div>
                <Label className="text-xs">סכום משכנתא</Label>
                <Input type="number" min="0" value={mortgageAmount ?? ''} onChange={(e) => setMortgageAmount(Number(e.target.value))} />
              </div>
              <div>
                <Label className="text-xs">החזר חודשי</Label>
                <Input type="number" min="0" value={mortgageMonthlyPayment ?? ''} onChange={(e) => setMortgageMonthlyPayment(Number(e.target.value))} />
              </div>
              <div>
                <Label className="text-xs">ריבית (%)</Label>
                <Input type="number" min="0" step="0.1" value={mortgageInterestRate} onChange={(e) => setMortgageInterestRate(Number(e.target.value))} />
              </div>
              <div>
                <Label className="text-xs">תקופת משכנתא (שנים)</Label>
                <Input type="number" min="0" value={mortgageYears ?? ''} onChange={(e) => setMortgageYears(Number(e.target.value))} />
              </div>
            </div>
          </div>

          {/* Rental */}
          <div className="space-y-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">הכנסות והוצאות</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">שכ״ד חודשי צפוי</Label>
                <Input type="number" min="0" value={expectedMonthlyRent ?? ''} onChange={(e) => setExpectedMonthlyRent(Number(e.target.value))} />
              </div>
              <div>
                <Label className="text-xs">הוצאות תפעול שנתיות</Label>
                <Input type="number" min="0" value={annualOperatingCosts ?? ''} onChange={(e) => setAnnualOperatingCosts(Number(e.target.value))} />
              </div>
            </div>
            <p className="text-[11px] text-muted-foreground">הוצאות: ארנונה, ביטוח, ועד בית, תחזוקה, ניהול</p>
          </div>

          {/* Appreciation Slider */}
          <Card className="border-0 bg-muted/50">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-semibold">אחוז עלייה שנתי</Label>
                <span className="text-lg font-bold text-primary">{baseAppreciation}%</span>
              </div>
              <Slider
                value={[baseAppreciation]}
                onValueChange={([v]) => {
                  setBaseAppreciation(v);
                  if (!manualMode) {
                    setCustomRates({ pessimistic: Math.max(0, v - 2), average: v, optimistic: v + 2 });
                  }
                }}
                min={0}
                max={10}
                step={0.5}
              />
              <div className="flex justify-between text-[10px] text-muted-foreground">
                <span>0%</span>
                <span>5%</span>
                <span>10%</span>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <Switch checked={manualMode} onCheckedChange={setManualMode} />
                <Label className="text-xs">עריכה ידנית לכל תרחיש</Label>
              </div>

              {manualMode && (
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
                    <Label className="text-[10px] text-blue-500">ממוצע %</Label>
                    <Input
                      type="number" step="0.5" className="h-8 text-sm"
                      value={customRates.average}
                      onChange={(e) => setCustomRates({ ...customRates, average: Number(e.target.value) })}
                    />
                  </div>
                  <div>
                    <Label className="text-[10px] text-green-500">אופטימי %</Label>
                    <Input
                      type="number" step="0.5" className="h-8 text-sm"
                      value={customRates.optimistic}
                      onChange={(e) => setCustomRates({ ...customRates, optimistic: Number(e.target.value) })}
                    />
                  </div>
                </div>
              )}
              {manualMode && customRates.pessimistic > customRates.optimistic && (
                <p className="text-[11px] text-amber-500">שים לב — התרחיש המחמיר גבוה מהאופטימי</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Results Section */}
        <div className="md:col-span-3 mt-6 md:mt-0">
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
                  <ScenarioCard scenario={result.scenarios[0]} style={SCENARIO_COLORS.pessimistic} />
                  <ScenarioCard scenario={result.scenarios[1]} style={SCENARIO_COLORS.average} />
                  <ScenarioCard scenario={result.scenarios[2]} style={SCENARIO_COLORS.optimistic} />
                </div>

                {/* Property Value Chart */}
                {chartData.length > 1 && (
                  <Card className="border-0 shadow-sm">
                    <CardContent className="p-4">
                      <p className="text-sm font-semibold mb-3">עליית שווי נכס לאורך השנים</p>
                      <div id="bp-chart">
                      <ResponsiveContainer width="100%" height={280}>
                        <LineChart data={chartData}>
                          <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                          <XAxis dataKey="year" label={{ value: 'שנה', position: 'insideBottom', offset: -5 }} />
                          <YAxis tickFormatter={(v) => `₪${(v / 1000000).toFixed(1)}M`} />
                          <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                          <Legend />
                          <Line type="monotone" dataKey="מחמיר" stroke={SCENARIO_COLORS.pessimistic.chart} strokeWidth={2} dot={false} />
                          <Line type="monotone" dataKey="ממוצע" stroke={SCENARIO_COLORS.average.chart} strokeWidth={2.5} dot={false} />
                          <Line type="monotone" dataKey="אופטימי" stroke={SCENARIO_COLORS.optimistic.chart} strokeWidth={2} dot={false} />
                        </LineChart>
                      </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                )}
                {/* PDF Export */}
                <div className="flex justify-end">
                  <ExportButton
                    title="תוכנית עסקית"
                    chartElementId="bp-chart"
                    executiveSummary={[
                      `עלות עסקה כוללת: ${formatCurrency(result.totalDealCost)}`,
                      `תזרים חודשי נטו: ${formatCurrency(result.monthlyCashflow)}`,
                      `IRR (ממוצע): ${result.scenarios[1].irr !== null ? `${(result.scenarios[1].irr * 100).toFixed(1)}%` : 'N/A'}`,
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
                          { label: 'תשואת COC', value: `${(s.cocYield * 100).toFixed(1)}%` },
                          { label: 'IRR', value: s.irr !== null ? `${(s.irr * 100).toFixed(1)}%` : 'N/A' },
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
