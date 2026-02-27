import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { calculateFinancialCheckup } from '@/lib/calculations/financial-checkup';
import { FinancialCheckupInput, FinancialCheckupOutput } from '@/types/financial-checkup';
import { StatsCard } from '@/components/StatsCard';
import { SmartInsight, generateFinancialInsights } from '@/components/SmartInsight';
import { ConfidenceGauge } from '@/components/ConfidenceGauge';
import { saveCalculation } from '@/lib/storage/calculator-history';
import { 
  AlertCircle, 
  CheckCircle, 
  TrendingUp, 
  Wallet, 
  PiggyBank, 
  Home,
  Calculator,
  Sparkles,
  TrendingDown,
  DollarSign,
  Shield
} from 'lucide-react';
import { he } from '@/lib/translations/he';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

const FinancialCheckup = () => {
  const [input, setInput] = useState<FinancialCheckupInput>({
    income: {
      salary1Net: 0,
      salary2Net: 0,
      pensionsOrAllowances: 0,
      rentalIncome: 0,
      businessIncome: 0,
      otherIncome: 0,
    },
    expenses: {
      housingCosts: 0,
      carAndTransport: 0,
      educationAndChildren: 0,
      insurance: 0,
      loanRepayments: 0,
      foodAndGroceries: 0,
      leisureAndVacations: 0,
      otherExpenses: 0,
    },
    assets: {
      cashAndChecking: 0,
      shortTermSavings: 0,
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

  const handleCalculate = () => {
    const output = calculateFinancialCheckup(input);
    setResults(output);
    
    // Save to history
    saveCalculation({
      type: 'financial-checkup',
      title: he.financialCheckup.title,
      result: `תזרים פנוי: ${formatCurrency(output.freeCashFlow)} | דירוג: ${output.readinessLabel}`,
      input,
    });
    
    // Scroll to results
    setTimeout(() => {
      document.getElementById('results')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('he-IL', {
      style: 'currency',
      currency: 'ILS',
      minimumFractionDigits: 0,
    }).format(value);
  };

  // Calculate totals for visualization
  const totalIncome = Object.values(input.income).reduce((sum, val) => sum + val, 0);
  const totalExpenses = Object.values(input.expenses).reduce((sum, val) => sum + val, 0);

  // Prepare chart data
  const cashFlowData = [
    { name: he.financialCheckup.incomeTitle, value: totalIncome, color: 'hsl(var(--primary))' },
    { name: he.financialCheckup.expensesTitle, value: totalExpenses, color: 'hsl(var(--destructive))' },
  ];

  const COLORS = ['hsl(var(--primary))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))'];

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="text-center space-y-3 animate-fade-in">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-4">
          <Calculator className="w-8 h-8 text-primary" />
        </div>
        <h1 className="text-4xl lg:text-5xl font-bold tracking-tight">{he.financialCheckup.title}</h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          {he.financialCheckup.description}
        </p>
      </div>

      {/* KPI Cards - Show when there's input or results */}
      {(totalIncome > 0 || totalExpenses > 0 || results) && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-slide-up">
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

      {/* Income & Expenses Grid */}
      <div className="grid lg:grid-cols-2 gap-8">
        {/* Income Section */}
        <Card className="border-0 shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden">
          <CardHeader className="bg-gradient-to-l from-primary/5 to-transparent border-b border-border/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-xl">{he.financialCheckup.incomeTitle}</CardTitle>
                <CardDescription>{he.financialCheckup.step1Title}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            <div>
              <Label className="text-sm font-medium">{he.financialCheckup.salary1Net}</Label>
              <Input
                type="number"
                placeholder="12,000"
                value={input.income.salary1Net || ''}
                onChange={(e) => setInput({ ...input, income: { ...input.income, salary1Net: Number(e.target.value) } })}
                className="mt-1.5"
              />
            </div>
            <div>
              <Label className="text-sm font-medium">{he.financialCheckup.salary2Net}</Label>
              <Input
                type="number"
                placeholder="8,000"
                value={input.income.salary2Net || ''}
                onChange={(e) => setInput({ ...input, income: { ...input.income, salary2Net: Number(e.target.value) } })}
                className="mt-1.5"
              />
            </div>
            <div>
              <Label className="text-sm font-medium">{he.financialCheckup.pensionsOrAllowances}</Label>
              <Input
                type="number"
                placeholder="2,000"
                value={input.income.pensionsOrAllowances || ''}
                onChange={(e) => setInput({ ...input, income: { ...input.income, pensionsOrAllowances: Number(e.target.value) } })}
                className="mt-1.5"
              />
            </div>
            <div>
              <Label className="text-sm font-medium">{he.financialCheckup.rentalIncome}</Label>
              <Input
                type="number"
                placeholder="3,500"
                value={input.income.rentalIncome || ''}
                onChange={(e) => setInput({ ...input, income: { ...input.income, rentalIncome: Number(e.target.value) } })}
                className="mt-1.5"
              />
            </div>
            <div>
              <Label className="text-sm font-medium">{he.financialCheckup.businessIncome}</Label>
              <Input
                type="number"
                placeholder="5,000"
                value={input.income.businessIncome || ''}
                onChange={(e) => setInput({ ...input, income: { ...input.income, businessIncome: Number(e.target.value) } })}
                className="mt-1.5"
              />
            </div>
            <div>
              <Label className="text-sm font-medium">{he.financialCheckup.otherIncome}</Label>
              <Input
                type="number"
                placeholder="1,000"
                value={input.income.otherIncome || ''}
                onChange={(e) => setInput({ ...input, income: { ...input.income, otherIncome: Number(e.target.value) } })}
                className="mt-1.5"
              />
            </div>
          </CardContent>
        </Card>

        {/* Expenses Section */}
        <Card className="border-0 shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden">
          <CardHeader className="bg-gradient-to-l from-destructive/5 to-transparent border-b border-border/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-destructive/10 rounded-xl flex items-center justify-center">
                <TrendingDown className="w-5 h-5 text-destructive" />
              </div>
              <div>
                <CardTitle className="text-xl">{he.financialCheckup.expensesTitle}</CardTitle>
                <CardDescription>{he.financialCheckup.step1Title}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            <div>
              <Label className="text-sm font-medium">{he.financialCheckup.housingCosts}</Label>
              <Input
                type="number"
                placeholder="4,500"
                value={input.expenses.housingCosts || ''}
                onChange={(e) => setInput({ ...input, expenses: { ...input.expenses, housingCosts: Number(e.target.value) } })}
                className="mt-1.5"
              />
            </div>
            <div>
              <Label className="text-sm font-medium">{he.financialCheckup.carAndTransport}</Label>
              <Input
                type="number"
                placeholder="2,000"
                value={input.expenses.carAndTransport || ''}
                onChange={(e) => setInput({ ...input, expenses: { ...input.expenses, carAndTransport: Number(e.target.value) } })}
                className="mt-1.5"
              />
            </div>
            <div>
              <Label className="text-sm font-medium">{he.financialCheckup.educationAndChildren}</Label>
              <Input
                type="number"
                placeholder="1,500"
                value={input.expenses.educationAndChildren || ''}
                onChange={(e) => setInput({ ...input, expenses: { ...input.expenses, educationAndChildren: Number(e.target.value) } })}
                className="mt-1.5"
              />
            </div>
            <div>
              <Label className="text-sm font-medium">{he.financialCheckup.insurance}</Label>
              <Input
                type="number"
                placeholder="800"
                value={input.expenses.insurance || ''}
                onChange={(e) => setInput({ ...input, expenses: { ...input.expenses, insurance: Number(e.target.value) } })}
                className="mt-1.5"
              />
            </div>
            <div>
              <Label className="text-sm font-medium">{he.financialCheckup.loanRepayments}</Label>
              <Input
                type="number"
                placeholder="1,000"
                value={input.expenses.loanRepayments || ''}
                onChange={(e) => setInput({ ...input, expenses: { ...input.expenses, loanRepayments: Number(e.target.value) } })}
                className="mt-1.5"
              />
            </div>
            <div>
              <Label className="text-sm font-medium">{he.financialCheckup.foodAndGroceries}</Label>
              <Input
                type="number"
                placeholder="3,000"
                value={input.expenses.foodAndGroceries || ''}
                onChange={(e) => setInput({ ...input, expenses: { ...input.expenses, foodAndGroceries: Number(e.target.value) } })}
                className="mt-1.5"
              />
            </div>
            <div>
              <Label className="text-sm font-medium">{he.financialCheckup.leisureAndVacations}</Label>
              <Input
                type="number"
                placeholder="1,500"
                value={input.expenses.leisureAndVacations || ''}
                onChange={(e) => setInput({ ...input, expenses: { ...input.expenses, leisureAndVacations: Number(e.target.value) } })}
                className="mt-1.5"
              />
            </div>
            <div>
              <Label className="text-sm font-medium">{he.financialCheckup.otherExpenses}</Label>
              <Input
                type="number"
                placeholder="1,000"
                value={input.expenses.otherExpenses || ''}
                onChange={(e) => setInput({ ...input, expenses: { ...input.expenses, otherExpenses: Number(e.target.value) } })}
                className="mt-1.5"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Assets & Profile Grid */}
      <div className="grid lg:grid-cols-2 gap-8">
        {/* Assets Section */}
        <Card className="border-0 shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden">
          <CardHeader className="bg-gradient-to-l from-chart-1/10 to-transparent border-b border-border/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-chart-1/20 rounded-xl flex items-center justify-center">
                <PiggyBank className="w-5 h-5 text-chart-1" />
              </div>
              <div>
                <CardTitle className="text-xl">{he.financialCheckup.liquidAssetsTitle}</CardTitle>
                <CardDescription>{he.financialCheckup.step2Title}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="grid md:grid-cols-2 gap-4 pt-6">
            <div>
              <Label className="text-sm font-medium">{he.financialCheckup.cashAndChecking}</Label>
              <Input
                type="number"
                placeholder="50,000"
                value={input.assets.cashAndChecking || ''}
                onChange={(e) => setInput({ ...input, assets: { ...input.assets, cashAndChecking: Number(e.target.value) } })}
                className="mt-1.5"
              />
            </div>
            <div>
              <Label className="text-sm font-medium">{he.financialCheckup.shortTermSavings}</Label>
              <Input
                type="number"
                placeholder="100,000"
                value={input.assets.shortTermSavings || ''}
                onChange={(e) => setInput({ ...input, assets: { ...input.assets, shortTermSavings: Number(e.target.value) } })}
                className="mt-1.5"
              />
            </div>
            <div>
              <Label className="text-sm font-medium">{he.financialCheckup.deposits}</Label>
              <Input
                type="number"
                placeholder="150,000"
                value={input.assets.deposits || ''}
                onChange={(e) => setInput({ ...input, assets: { ...input.assets, deposits: Number(e.target.value) } })}
                className="mt-1.5"
              />
            </div>
            <div>
              <Label className="text-sm font-medium">{he.financialCheckup.semiLiquidInvestments}</Label>
              <Input
                type="number"
                placeholder="200,000"
                value={input.assets.semiLiquidInvestments || ''}
                onChange={(e) => setInput({ ...input, assets: { ...input.assets, semiLiquidInvestments: Number(e.target.value) } })}
                className="mt-1.5"
              />
            </div>
            <div>
              <Label className="text-sm font-medium">{he.financialCheckup.realEstateMarketValue}</Label>
              <Input
                type="number"
                placeholder="1,500,000"
                value={input.assets.realEstateMarketValue || ''}
                onChange={(e) => setInput({ ...input, assets: { ...input.assets, realEstateMarketValue: Number(e.target.value) } })}
                className="mt-1.5"
              />
            </div>
            <div>
              <Label className="text-sm font-medium">{he.financialCheckup.realEstateMortgageBalance}</Label>
              <Input
                type="number"
                placeholder="800,000"
                value={input.assets.realEstateMortgageBalance || ''}
                onChange={(e) => setInput({ ...input, assets: { ...input.assets, realEstateMortgageBalance: Number(e.target.value) } })}
                className="mt-1.5"
              />
            </div>
          </CardContent>
        </Card>

        {/* Profile Section */}
        <Card className="border-0 shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden">
          <CardHeader className="bg-gradient-to-l from-secondary/10 to-transparent border-b border-border/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-secondary/20 rounded-xl flex items-center justify-center">
                <Shield className="w-5 h-5 text-secondary" />
              </div>
              <div>
                <CardTitle className="text-xl">{he.financialCheckup.step3Title}</CardTitle>
                <CardDescription>{he.common.summary}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="grid md:grid-cols-2 gap-4 pt-6">
            <div>
              <Label className="text-sm font-medium">{he.financialCheckup.age}</Label>
              <Input
                type="number"
                value={input.profile.age}
                onChange={(e) => setInput({ ...input, profile: { ...input.profile, age: Number(e.target.value) } })}
                className="mt-1.5"
              />
            </div>
            <div>
              <Label className="text-sm font-medium">{he.financialCheckup.maritalStatus}</Label>
              <Select
                value={input.profile.maritalStatus}
                onValueChange={(value: any) => setInput({ ...input, profile: { ...input.profile, maritalStatus: value } })}
              >
                <SelectTrigger className="mt-1.5">
                  <SelectValue />
                </SelectTrigger>
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
              <Input
                type="number"
                value={input.profile.numberOfChildren}
                onChange={(e) => setInput({ ...input, profile: { ...input.profile, numberOfChildren: Number(e.target.value) } })}
                className="mt-1.5"
              />
            </div>
            <div>
              <Label className="text-sm font-medium">{he.financialCheckup.goalType}</Label>
              <Select
                value={input.profile.goalType}
                onValueChange={(value: any) => setInput({ ...input, profile: { ...input.profile, goalType: value } })}
              >
                <SelectTrigger className="mt-1.5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="firstHome">{he.financialCheckup.goalTypeOptions.firstHome}</SelectItem>
                  <SelectItem value="investmentProperty">{he.financialCheckup.goalTypeOptions.investmentProperty}</SelectItem>
                  <SelectItem value="upgradeHome">{he.financialCheckup.goalTypeOptions.upgradeHome}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-2">
              <Label className="text-sm font-medium">{he.financialCheckup.riskComfortLevel}</Label>
              <Select
                value={input.profile.riskComfortLevel}
                onValueChange={(value: any) => setInput({ ...input, profile: { ...input.profile, riskComfortLevel: value } })}
              >
                <SelectTrigger className="mt-1.5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">{he.financialCheckup.riskLevelOptions.low}</SelectItem>
                  <SelectItem value="medium">{he.financialCheckup.riskLevelOptions.medium}</SelectItem>
                  <SelectItem value="high">{he.financialCheckup.riskLevelOptions.high}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Calculate Button */}
      <div className="flex justify-center pt-4">
        <Button 
          onClick={handleCalculate} 
          size="lg" 
          className="px-12 py-6 text-lg rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105"
        >
          <Calculator className="ml-2 h-5 w-5" />
          {he.common.calculate}
        </Button>
      </div>

      {/* Results Section */}
      {results && (
        <div id="results" className="space-y-8 animate-slide-up">
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

          {/* Results Header */}
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-4">
              <Sparkles className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-3xl font-bold">{he.financialCheckup.resultsTitle}</h2>
            <p className="text-muted-foreground mt-2">{he.financialCheckup.description}</p>
          </div>

          {/* Results Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="border-0 shadow-xl overflow-hidden">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground mb-2">{he.financialCheckup.freeCashFlow}</p>
                    <h3 className={`text-3xl font-bold tracking-tight ${results.freeCashFlow >= 0 ? 'text-primary' : 'text-destructive'}`}>
                      {formatCurrency(results.freeCashFlow)}
                    </h3>
                  </div>
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${results.freeCashFlow >= 0 ? 'bg-primary/10' : 'bg-destructive/10'}`}>
                    <Wallet className={`w-7 h-7 ${results.freeCashFlow >= 0 ? 'text-primary' : 'text-destructive'}`} />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-xl overflow-hidden">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground mb-2">{he.financialCheckup.availableEquity}</p>
                    <h3 className="text-3xl font-bold tracking-tight text-chart-1">{formatCurrency(results.availableEquity)}</h3>
                  </div>
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-chart-1/10">
                    <DollarSign className="w-7 h-7 text-chart-1" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-xl overflow-hidden">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground mb-2">{he.financialCheckup.maxSafeMortgagePayment}</p>
                    <h3 className="text-3xl font-bold tracking-tight text-emerald-600">{formatCurrency(results.maxSafeMortgagePayment)}</h3>
                  </div>
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-emerald-500/10">
                    <Home className="w-7 h-7 text-emerald-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-xl overflow-hidden">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground mb-2">{he.financialCheckup.readinessScore}</p>
                    <div className="flex items-center gap-3">
                      <h3 className="text-3xl font-bold tracking-tight text-primary">{Math.round(results.readinessScore)}</h3>
                      <Badge
                        variant={
                          results.readinessLabel === 'High'
                            ? 'default'
                            : results.readinessLabel === 'Medium'
                            ? 'secondary'
                            : 'destructive'
                        }
                        className="text-xs"
                      >
                        {results.readinessLabel === 'High' ? he.financialCheckup.riskLevelOptions.high : results.readinessLabel === 'Medium' ? he.financialCheckup.riskLevelOptions.medium : he.financialCheckup.riskLevelOptions.low}
                      </Badge>
                    </div>
                  </div>
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-primary/10">
                    <CheckCircle className="w-7 h-7 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Visualization & Insights */}
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Chart */}
            <Card className="border-0 shadow-xl">
              <CardHeader>
                <CardTitle className="text-xl">פילוח תזרים מזומנים</CardTitle>
                <CardDescription>התפלגות הכנסות והוצאות</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={cashFlowData}
                      cx="50%"
                      cy="50%"
                      innerRadius={80}
                      outerRadius={120}
                      paddingAngle={2}
                      dataKey="value"
                    >
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

            {/* Insights */}
            <Card className="border-0 shadow-xl bg-gradient-to-br from-card to-accent/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                  {results.readinessLabel === 'High' ? (
                    <CheckCircle className="h-6 w-6 text-primary" />
                  ) : (
                    <AlertCircle className="h-6 w-6 text-muted-foreground" />
                  )}
                  תובנות מרכזיות
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {results.freeCashFlow < 0 && (
                  <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20">
                    <p className="text-destructive font-medium">
                      ⚠️ {he.financialCheckup.explanationNegativeCashflow}
                    </p>
                  </div>
                )}
                {results.availableEquity < 300000 && (
                  <div className="p-4 rounded-xl bg-muted/50 border border-border">
                    <p className="text-foreground">
                      💡 {he.financialCheckup.explanationLowEquity}
                    </p>
                  </div>
                )}
                {results.readinessLabel === 'High' && (
                  <div className="p-4 rounded-xl bg-primary/10 border border-primary/20">
                    <p className="text-primary font-medium flex items-center gap-2">
                      <TrendingUp className="h-5 w-5" />
                      {he.financialCheckup.explanationHighReadiness}
                    </p>
                  </div>
                )}
                {results.readinessLabel === 'Medium' && (
                  <div className="p-4 rounded-xl bg-muted/50 border border-border">
                    <p className="text-foreground">
                      📊 {he.financialCheckup.explanationMediumReadiness}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!results && totalIncome === 0 && totalExpenses === 0 && (
        <Card className="border-dashed border-2 bg-accent/20">
          <CardContent className="text-center py-12">
            <div className="w-24 h-24 bg-muted/30 rounded-full mx-auto flex items-center justify-center mb-4">
              <Calculator className="w-12 h-12 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold mb-2">מוכנים לבדוק את המצב הפיננסי?</h3>
            <p className="text-muted-foreground">מלאו את הפרטים למעלה ולחצו על "חשב"</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default FinancialCheckup;
