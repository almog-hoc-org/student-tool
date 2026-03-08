import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { calculateFinancialCheckup } from '@/lib/calculations/financial-checkup';
import { FinancialCheckupInput, FinancialCheckupOutput } from '@/types/financial-checkup';
import { StatsCard } from '@/components/StatsCard';
import { SmartInsight, generateFinancialInsights } from '@/components/SmartInsight';
import { ConfidenceGauge } from '@/components/ConfidenceGauge';
import { FuelGauge } from '@/components/FuelGauge';
import { ExecutiveSummary } from '@/components/ExecutiveSummary';
import { saveCalculation } from '@/lib/storage/calculator-history';
import { useAutoPersist } from '@/hooks/useAutoPersist';
import { formatCurrency as sharedFormatCurrency } from '@/lib/validation/validators';
import { createNestedUpdater } from '@/hooks/useNestedState';
import {
  TrendingUp,
  Wallet,
  PiggyBank,
  Calculator,
  TrendingDown,
  CreditCard
} from 'lucide-react';
import { Wizard } from '@/components/Wizard';
import { he } from '@/lib/translations/he';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { PageHero } from '@/components/PageHero';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { motion } from 'framer-motion';

const READINESS_LABELS: Record<string, string> = {
  High: 'מוכנות גבוהה',
  Medium: 'מוכנות בינונית',
  Low: 'מוכנות נמוכה',
};

const FinancialCheckup = () => {
  const [input, setInput] = useAutoPersist<FinancialCheckupInput>('financial-checkup', {
    income: {
      salary1Net: 15000,
      salary2Net: 0,
      pensionsOrAllowances: 0,
      rentalIncome: 0,
      businessIncome: 0,
      otherIncome: 0,
    },
    expenses: {
      housingCosts: 4500,
      carAndTransport: 1500,
      educationAndChildren: 0,
      insurance: 500,
      loanRepayments: 0,
      foodAndGroceries: 2500,
      leisureAndVacations: 1000,
      otherExpenses: 500,
    },
    assets: {
      cashAndChecking: 50000,
      shortTermSavings: 100000,
      deposits: 0,
      semiLiquidInvestments: 0,
      realEstateMarketValue: 0,
      realEstateMortgageBalance: 0,
    },
    liabilities: {
      consumerLoansBalance: 0,
      carLoansBalance: 0,
      creditCardDebtsBalance: 0,
      familyOrPrivateLoansBalance: 0,
    },
    profile: {
      age: 30,
      maritalStatus: 'single',
      numberOfChildren: 0,
      goalType: 'firstHome',
      riskComfortLevel: 'medium',
    },
  });

  const [results, setResults] = useState<FinancialCheckupOutput | null>(null);
  const update = createNestedUpdater(setInput);

  const handleCalculate = () => {
    const output = calculateFinancialCheckup(input);
    setResults(output);
    
    saveCalculation({
      type: 'financial-checkup',
      title: he.financialCheckup.title,
      result: `תזרים פנוי: ${formatCurrency(output.freeCashFlow)} | ${READINESS_LABELS[output.readinessLabel]}`,
      input,
    });
    
    setTimeout(() => {
      document.getElementById('results')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  const formatCurrency = sharedFormatCurrency;

  const totalIncome = Object.values(input.income).reduce((sum, val) => sum + val, 0);
  const totalExpenses = Object.values(input.expenses).reduce((sum, val) => sum + val, 0);

  const cashFlowData = [
    { name: he.financialCheckup.incomeTitle, value: totalIncome, color: 'hsl(var(--primary))' },
    { name: he.financialCheckup.expensesTitle, value: totalExpenses, color: 'hsl(var(--destructive))' },
  ];

  return (
    <div className="space-y-6 pb-8">
      <PageHero
        icon={<Calculator className="w-6 h-6 text-primary" />}
        title={he.financialCheckup.title}
        description={he.financialCheckup.description}
      />

      {/* KPI Cards */}
      {(totalIncome > 0 || totalExpenses > 0 || results) && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <StatsCard
            title={he.financialCheckup.totalIncome}
            value={formatCurrency(totalIncome)}
            icon={TrendingUp}
            iconColor="green"
          />
          <StatsCard
            title={he.financialCheckup.totalExpenses}
            value={formatCurrency(totalExpenses)}
            icon={TrendingDown}
            iconColor="orange"
          />
          <StatsCard
            title={he.financialCheckup.freeCashFlow}
            value={formatCurrency(totalIncome - totalExpenses)}
            icon={Wallet}
            iconColor={totalIncome - totalExpenses >= 0 ? 'green' : 'orange'}
          />
          <StatsCard
            title={he.financialCheckup.availableEquity}
            value={results ? formatCurrency(results.availableEquity) : '---'}
            icon={PiggyBank}
            iconColor="blue"
          />
        </div>
      )}

      <Wizard
        title={he.financialCheckup.title}
        icon={<Calculator className="w-6 h-6 text-primary" />}
        onComplete={handleCalculate}
        steps={[
          {
            title: 'הכנסות',
            description: 'כמה נכנס?',
            content: (
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">{he.financialCheckup.salary1Net}</Label>
                  <Input type="number" placeholder="12,000" value={input.income.salary1Net || ''} onChange={(e) => update('income', 'salary1Net', Number(e.target.value))} className="mt-1.5" />
                </div>
                <div>
                  <Label className="text-sm font-medium">{he.financialCheckup.salary2Net}</Label>
                  <Input type="number" placeholder="8,000" value={input.income.salary2Net || ''} onChange={(e) => update('income', 'salary2Net', Number(e.target.value))} className="mt-1.5" />
                </div>
                <div>
                  <Label className="text-sm font-medium">{he.financialCheckup.pensionsOrAllowances}</Label>
                  <Input type="number" placeholder="2,000" value={input.income.pensionsOrAllowances || ''} onChange={(e) => update('income', 'pensionsOrAllowances', Number(e.target.value))} className="mt-1.5" />
                </div>
                <div>
                  <Label className="text-sm font-medium">{he.financialCheckup.rentalIncome}</Label>
                  <Input type="number" placeholder="3,500" value={input.income.rentalIncome || ''} onChange={(e) => update('income', 'rentalIncome', Number(e.target.value))} className="mt-1.5" />
                </div>
                <div>
                  <Label className="text-sm font-medium">{he.financialCheckup.businessIncome}</Label>
                  <Input type="number" placeholder="5,000" value={input.income.businessIncome || ''} onChange={(e) => update('income', 'businessIncome', Number(e.target.value))} className="mt-1.5" />
                </div>
                <div>
                  <Label className="text-sm font-medium">{he.financialCheckup.otherIncome}</Label>
                  <Input type="number" placeholder="1,000" value={input.income.otherIncome || ''} onChange={(e) => update('income', 'otherIncome', Number(e.target.value))} className="mt-1.5" />
                </div>
              </div>
            ),
          },
          {
            title: 'הוצאות',
            description: 'כמה יוצא?',
            content: (
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">{he.financialCheckup.housingCosts}</Label>
                  <Input type="number" placeholder="4,500" value={input.expenses.housingCosts || ''} onChange={(e) => update('expenses', 'housingCosts', Number(e.target.value))} className="mt-1.5" />
                </div>
                <div>
                  <Label className="text-sm font-medium">{he.financialCheckup.carAndTransport}</Label>
                  <Input type="number" placeholder="2,000" value={input.expenses.carAndTransport || ''} onChange={(e) => update('expenses', 'carAndTransport', Number(e.target.value))} className="mt-1.5" />
                </div>
                <div>
                  <Label className="text-sm font-medium">{he.financialCheckup.educationAndChildren}</Label>
                  <Input type="number" placeholder="1,500" value={input.expenses.educationAndChildren || ''} onChange={(e) => update('expenses', 'educationAndChildren', Number(e.target.value))} className="mt-1.5" />
                </div>
                <div>
                  <Label className="text-sm font-medium">{he.financialCheckup.insurance}</Label>
                  <Input type="number" placeholder="800" value={input.expenses.insurance || ''} onChange={(e) => update('expenses', 'insurance', Number(e.target.value))} className="mt-1.5" />
                </div>
                <div>
                  <Label className="text-sm font-medium">{he.financialCheckup.loanRepayments}</Label>
                  <Input type="number" placeholder="1,000" value={input.expenses.loanRepayments || ''} onChange={(e) => update('expenses', 'loanRepayments', Number(e.target.value))} className="mt-1.5" />
                </div>
                <div>
                  <Label className="text-sm font-medium">{he.financialCheckup.foodAndGroceries}</Label>
                  <Input type="number" placeholder="3,000" value={input.expenses.foodAndGroceries || ''} onChange={(e) => update('expenses', 'foodAndGroceries', Number(e.target.value))} className="mt-1.5" />
                </div>
                <div>
                  <Label className="text-sm font-medium">{he.financialCheckup.leisureAndVacations}</Label>
                  <Input type="number" placeholder="1,500" value={input.expenses.leisureAndVacations || ''} onChange={(e) => update('expenses', 'leisureAndVacations', Number(e.target.value))} className="mt-1.5" />
                </div>
                <div>
                  <Label className="text-sm font-medium">{he.financialCheckup.otherExpenses}</Label>
                  <Input type="number" placeholder="1,000" value={input.expenses.otherExpenses || ''} onChange={(e) => update('expenses', 'otherExpenses', Number(e.target.value))} className="mt-1.5" />
                </div>
              </div>
            ),
          },
          {
            title: 'נכסים והתחייבויות',
            description: 'מה יש לך?',
            content: (
              <div className="space-y-6">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">{he.financialCheckup.cashAndChecking}</Label>
                    <Input type="number" placeholder="50,000" value={input.assets.cashAndChecking || ''} onChange={(e) => update('assets', 'cashAndChecking', Number(e.target.value))} className="mt-1.5" />
                  </div>
                  <div>
                    <Label className="text-sm font-medium">{he.financialCheckup.shortTermSavings}</Label>
                    <Input type="number" placeholder="100,000" value={input.assets.shortTermSavings || ''} onChange={(e) => update('assets', 'shortTermSavings', Number(e.target.value))} className="mt-1.5" />
                  </div>
                  <div>
                    <Label className="text-sm font-medium">{he.financialCheckup.deposits}</Label>
                    <Input type="number" placeholder="150,000" value={input.assets.deposits || ''} onChange={(e) => update('assets', 'deposits', Number(e.target.value))} className="mt-1.5" />
                  </div>
                  <div>
                    <Label className="text-sm font-medium">{he.financialCheckup.semiLiquidInvestments}</Label>
                    <Input type="number" placeholder="200,000" value={input.assets.semiLiquidInvestments || ''} onChange={(e) => update('assets', 'semiLiquidInvestments', Number(e.target.value))} className="mt-1.5" />
                  </div>
                  <div>
                    <Label className="text-sm font-medium">{he.financialCheckup.realEstateMarketValue}</Label>
                    <Input type="number" placeholder="1,500,000" value={input.assets.realEstateMarketValue || ''} onChange={(e) => update('assets', 'realEstateMarketValue', Number(e.target.value))} className="mt-1.5" />
                  </div>
                  <div>
                    <Label className="text-sm font-medium">{he.financialCheckup.realEstateMortgageBalance}</Label>
                    <Input type="number" placeholder="800,000" value={input.assets.realEstateMortgageBalance || ''} onChange={(e) => update('assets', 'realEstateMortgageBalance', Number(e.target.value))} className="mt-1.5" />
                  </div>
                </div>

                <div className="border-t border-border/50" />

                <div className="flex items-center gap-2 mb-2">
                  <CreditCard className="w-5 h-5 text-destructive" />
                  <h4 className="font-semibold">התחייבויות</h4>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">הלוואות צרכניות</Label>
                    <Input type="number" placeholder="0" value={input.liabilities.consumerLoansBalance || ''} onChange={(e) => update('liabilities', 'consumerLoansBalance', Number(e.target.value))} className="mt-1.5" />
                  </div>
                  <div>
                    <Label className="text-sm font-medium">הלוואת רכב</Label>
                    <Input type="number" placeholder="0" value={input.liabilities.carLoansBalance || ''} onChange={(e) => update('liabilities', 'carLoansBalance', Number(e.target.value))} className="mt-1.5" />
                  </div>
                  <div>
                    <Label className="text-sm font-medium">חובות כרטיסי אשראי</Label>
                    <Input type="number" placeholder="0" value={input.liabilities.creditCardDebtsBalance || ''} onChange={(e) => update('liabilities', 'creditCardDebtsBalance', Number(e.target.value))} className="mt-1.5" />
                  </div>
                  <div>
                    <Label className="text-sm font-medium">הלוואות משפחה/פרטיות</Label>
                    <Input type="number" placeholder="0" value={input.liabilities.familyOrPrivateLoansBalance || ''} onChange={(e) => update('liabilities', 'familyOrPrivateLoansBalance', Number(e.target.value))} className="mt-1.5" />
                  </div>
                </div>
              </div>
            ),
          },
          {
            title: he.financialCheckup.step3Title,
            description: 'ספר על עצמך',
            content: (
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">{he.financialCheckup.age}</Label>
                  <Input type="number" value={input.profile.age} onChange={(e) => update('profile', 'age', Number(e.target.value))} className="mt-1.5" />
                </div>
                <div>
                  <Label className="text-sm font-medium">{he.financialCheckup.maritalStatus}</Label>
                  <Select value={input.profile.maritalStatus} onValueChange={(value: any) => update('profile', 'maritalStatus', value)}>
                    <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="single">{he.financialCheckup.maritalStatusOptions.single}</SelectItem>
                      <SelectItem value="married">{he.financialCheckup.maritalStatusOptions.married}</SelectItem>
                      <SelectItem value="divorced">{he.financialCheckup.maritalStatusOptions.divorced}</SelectItem>
                      <SelectItem value="other">{he.financialCheckup.maritalStatusOptions.other}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-sm font-medium">{he.financialCheckup.numberOfChildren}</Label>
                  <Input type="number" value={input.profile.numberOfChildren} onChange={(e) => update('profile', 'numberOfChildren', Number(e.target.value))} className="mt-1.5" />
                </div>
                <div>
                  <Label className="text-sm font-medium">{he.financialCheckup.goalType}</Label>
                  <Select value={input.profile.goalType} onValueChange={(value: any) => update('profile', 'goalType', value)}>
                    <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="firstHome">{he.financialCheckup.goalTypeOptions.firstHome}</SelectItem>
                      <SelectItem value="investmentProperty">{he.financialCheckup.goalTypeOptions.investmentProperty}</SelectItem>
                      <SelectItem value="upgradeHome">{he.financialCheckup.goalTypeOptions.upgradeHome}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-sm font-medium">{he.financialCheckup.riskComfortLevel}</Label>
                  <Select value={input.profile.riskComfortLevel} onValueChange={(value: any) => update('profile', 'riskComfortLevel', value)}>
                    <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">{he.financialCheckup.riskLevelOptions.low}</SelectItem>
                      <SelectItem value="medium">{he.financialCheckup.riskLevelOptions.medium}</SelectItem>
                      <SelectItem value="high">{he.financialCheckup.riskLevelOptions.high}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-sm font-medium">מחיר נכס משוער (₪)</Label>
                  <Input type="number" placeholder="למשל 1800000" value={input.profile.targetPropertyPrice || ''} onChange={(e) => update('profile', 'targetPropertyPrice', Number(e.target.value))} className="mt-1.5" />
                  <p className="text-xs text-muted-foreground mt-1">אם לא תמלא, ישתמש בברירת מחדל לפי סוג העסקה</p>
                </div>
              </div>
            ),
          },
        ]}
      />

      {/* Results Section */}
      {results && (
        <motion.div
          id="results"
          className="space-y-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
        >
          {/* Smart Insights */}
          <SmartInsight
            insights={generateFinancialInsights({
              freeCashFlow: results.freeCashFlow,
              totalIncome: results.totalIncome,
              availableEquity: results.availableEquity,
              readinessScore: results.readinessScore,
              maxSafeMortgagePayment: results.maxSafeMortgagePayment,
            })}
          />

          {/* Confidence Gauge */}
          <ConfidenceGauge score={results.readinessScore} />

          {/* Executive Summary */}
          <ExecutiveSummary
            type="financial-checkup"
            data={{
              readinessScore: results.readinessScore,
              freeCashFlow: results.freeCashFlow,
              availableEquity: results.availableEquity,
              maxMortgage: results.maxSafeMortgagePayment * 240,
            }}
          />

          {/* DTI Fuel Gauge */}
          {totalIncome > 0 && (
            <FuelGauge
              value={((totalExpenses / totalIncome) * 100)}
              maxValue={100}
              label="יחס הוצאות/הכנסות"
              sublabel={`${((totalExpenses / totalIncome) * 100).toFixed(0)}% מההכנסה מוצא על הוצאות`}
              thresholds={{ green: 50, yellow: 70 }}
            />
          )}

          {/* Charts & Insights Accordion */}
          <Accordion type="multiple" defaultValue={['charts']}>
            <AccordionItem value="charts">
              <AccordionTrigger className="text-lg font-semibold">גרפים ותובנות</AccordionTrigger>
              <AccordionContent>
                <div className="grid lg:grid-cols-2 gap-6">
                  {/* Chart */}
                  <Card className="border shadow-sm">
                    <CardHeader>
                      <CardTitle className="text-lg">פילוח תזרים מזומנים</CardTitle>
                      <CardDescription>התפלגות הכנסות והוצאות</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie data={cashFlowData} cx="50%" cy="50%" innerRadius={80} outerRadius={120} paddingAngle={2} dataKey="value">
                            {cashFlowData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value: number) => formatCurrency(value)} />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  {/* Key metrics */}
                  <Card className="border shadow-sm">
                    <CardHeader>
                      <CardTitle className="text-lg">נתונים מרכזיים</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex justify-between items-center p-3 rounded-lg bg-accent/50">
                        <span className="text-sm text-muted-foreground">{he.financialCheckup.maxSafeMortgagePayment}</span>
                        <span className="font-bold text-lg">{formatCurrency(results.maxSafeMortgagePayment)}</span>
                      </div>
                      <div className="flex justify-between items-center p-3 rounded-lg bg-accent/50">
                        <span className="text-sm text-muted-foreground">{he.financialCheckup.readinessScore}</span>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-lg">{Math.round(results.readinessScore)}</span>
                          <Badge
                            variant={results.readinessLabel === 'High' ? 'default' : results.readinessLabel === 'Medium' ? 'secondary' : 'destructive'}
                            className="text-xs"
                          >
                            {READINESS_LABELS[results.readinessLabel]}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex justify-between items-center p-3 rounded-lg bg-accent/50">
                        <span className="text-sm text-muted-foreground">הון נזיל</span>
                        <span className="font-bold text-lg">{formatCurrency(results.liquidEquity)}</span>
                      </div>
                      <div className="flex justify-between items-center p-3 rounded-lg bg-accent/50">
                        <span className="text-sm text-muted-foreground">סה״כ התחייבויות</span>
                        <span className="font-bold text-lg">{formatCurrency(results.totalLiabilities)}</span>
                      </div>

                      {results.freeCashFlow < 0 && (
                        <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                          <p className="text-destructive text-sm font-medium">⚠️ {he.financialCheckup.explanationNegativeCashflow}</p>
                        </div>
                      )}
                      {results.readinessLabel === 'High' && (
                        <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
                          <p className="text-primary text-sm font-medium flex items-center gap-2">
                            <TrendingUp className="h-4 w-4" />
                            {he.financialCheckup.explanationHighReadiness}
                          </p>
                        </div>
                      )}
                      {results.readinessLabel === 'Medium' && (
                        <div className="p-3 rounded-lg bg-accent/50 border border-border">
                          <p className="text-sm">📊 {he.financialCheckup.explanationMediumReadiness}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </motion.div>
      )}

      {/* Empty State */}
      {!results && totalIncome === 0 && totalExpenses === 0 && (
        <Card className="border-dashed border-2 bg-accent/20">
          <CardContent className="text-center py-12">
            <div className="w-24 h-24 bg-muted/30 rounded-full mx-auto flex items-center justify-center mb-4">
              <Calculator className="w-12 h-12 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">מוכנים לבדוק את המצב הפיננסי?</h3>
            <p className="text-muted-foreground">מלאו את הפרטים למעלה ולחצו על "חשב"</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default FinancialCheckup;
