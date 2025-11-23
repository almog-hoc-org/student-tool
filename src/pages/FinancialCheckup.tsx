import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { calculateFinancialCheckup } from '@/lib/calculations/financial-checkup';
import { FinancialCheckupInput, FinancialCheckupOutput } from '@/types/financial-checkup';
import { AlertCircle, CheckCircle, TrendingUp } from 'lucide-react';

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
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-IL', {
      style: 'currency',
      currency: 'ILS',
      minimumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Financial Checkup</CardTitle>
          <CardDescription>
            Get a clear picture of your financial situation and how prepared you are for a real-estate purchase.
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Step 1: Income */}
      <Card>
        <CardHeader>
          <CardTitle>Step 1: Monthly Income</CardTitle>
        </CardHeader>
        <CardContent className="grid md:grid-cols-2 gap-4">
          <div>
            <Label>Primary Salary (Net)</Label>
            <Input
              type="number"
              placeholder="e.g. 12000"
              value={input.income.salary1Net || ''}
              onChange={(e) => setInput({ ...input, income: { ...input.income, salary1Net: Number(e.target.value) } })}
            />
          </div>
          <div>
            <Label>Secondary Salary (Net)</Label>
            <Input
              type="number"
              placeholder="e.g. 8000"
              value={input.income.salary2Net || ''}
              onChange={(e) => setInput({ ...input, income: { ...input.income, salary2Net: Number(e.target.value) } })}
            />
          </div>
          <div>
            <Label>Pensions/Allowances</Label>
            <Input
              type="number"
              placeholder="e.g. 2000"
              value={input.income.pensionsOrAllowances || ''}
              onChange={(e) => setInput({ ...input, income: { ...input.income, pensionsOrAllowances: Number(e.target.value) } })}
            />
          </div>
          <div>
            <Label>Rental Income</Label>
            <Input
              type="number"
              placeholder="e.g. 3500"
              value={input.income.rentalIncome || ''}
              onChange={(e) => setInput({ ...input, income: { ...input.income, rentalIncome: Number(e.target.value) } })}
            />
          </div>
          <div>
            <Label>Business Income</Label>
            <Input
              type="number"
              placeholder="e.g. 5000"
              value={input.income.businessIncome || ''}
              onChange={(e) => setInput({ ...input, income: { ...input.income, businessIncome: Number(e.target.value) } })}
            />
          </div>
          <div>
            <Label>Other Income</Label>
            <Input
              type="number"
              placeholder="e.g. 1000"
              value={input.income.otherIncome || ''}
              onChange={(e) => setInput({ ...input, income: { ...input.income, otherIncome: Number(e.target.value) } })}
            />
          </div>
        </CardContent>
      </Card>

      {/* Step 2: Expenses */}
      <Card>
        <CardHeader>
          <CardTitle>Step 2: Monthly Expenses</CardTitle>
        </CardHeader>
        <CardContent className="grid md:grid-cols-2 gap-4">
          <div>
            <Label>Housing Costs (Rent/Mortgage)</Label>
            <Input
              type="number"
              placeholder="e.g. 4500"
              value={input.expenses.housingCosts || ''}
              onChange={(e) => setInput({ ...input, expenses: { ...input.expenses, housingCosts: Number(e.target.value) } })}
            />
          </div>
          <div>
            <Label>Car & Transport</Label>
            <Input
              type="number"
              placeholder="e.g. 2000"
              value={input.expenses.carAndTransport || ''}
              onChange={(e) => setInput({ ...input, expenses: { ...input.expenses, carAndTransport: Number(e.target.value) } })}
            />
          </div>
          <div>
            <Label>Education & Children</Label>
            <Input
              type="number"
              placeholder="e.g. 1500"
              value={input.expenses.educationAndChildren || ''}
              onChange={(e) => setInput({ ...input, expenses: { ...input.expenses, educationAndChildren: Number(e.target.value) } })}
            />
          </div>
          <div>
            <Label>Insurance</Label>
            <Input
              type="number"
              placeholder="e.g. 800"
              value={input.expenses.insurance || ''}
              onChange={(e) => setInput({ ...input, expenses: { ...input.expenses, insurance: Number(e.target.value) } })}
            />
          </div>
          <div>
            <Label>Loan Repayments</Label>
            <Input
              type="number"
              placeholder="e.g. 1000"
              value={input.expenses.loanRepayments || ''}
              onChange={(e) => setInput({ ...input, expenses: { ...input.expenses, loanRepayments: Number(e.target.value) } })}
            />
          </div>
          <div>
            <Label>Food & Groceries</Label>
            <Input
              type="number"
              placeholder="e.g. 3000"
              value={input.expenses.foodAndGroceries || ''}
              onChange={(e) => setInput({ ...input, expenses: { ...input.expenses, foodAndGroceries: Number(e.target.value) } })}
            />
          </div>
          <div>
            <Label>Leisure & Vacations</Label>
            <Input
              type="number"
              placeholder="e.g. 1500"
              value={input.expenses.leisureAndVacations || ''}
              onChange={(e) => setInput({ ...input, expenses: { ...input.expenses, leisureAndVacations: Number(e.target.value) } })}
            />
          </div>
          <div>
            <Label>Other Expenses</Label>
            <Input
              type="number"
              placeholder="e.g. 1000"
              value={input.expenses.otherExpenses || ''}
              onChange={(e) => setInput({ ...input, expenses: { ...input.expenses, otherExpenses: Number(e.target.value) } })}
            />
          </div>
        </CardContent>
      </Card>

      {/* Step 3: Assets & Liabilities */}
      <Card>
        <CardHeader>
          <CardTitle>Step 3: Assets</CardTitle>
        </CardHeader>
        <CardContent className="grid md:grid-cols-2 gap-4">
          <div>
            <Label>Cash & Checking</Label>
            <Input
              type="number"
              placeholder="e.g. 50000"
              value={input.assets.cashAndChecking || ''}
              onChange={(e) => setInput({ ...input, assets: { ...input.assets, cashAndChecking: Number(e.target.value) } })}
            />
          </div>
          <div>
            <Label>Short-term Savings</Label>
            <Input
              type="number"
              placeholder="e.g. 100000"
              value={input.assets.shortTermSavings || ''}
              onChange={(e) => setInput({ ...input, assets: { ...input.assets, shortTermSavings: Number(e.target.value) } })}
            />
          </div>
          <div>
            <Label>Deposits</Label>
            <Input
              type="number"
              placeholder="e.g. 150000"
              value={input.assets.deposits || ''}
              onChange={(e) => setInput({ ...input, assets: { ...input.assets, deposits: Number(e.target.value) } })}
            />
          </div>
          <div>
            <Label>Semi-Liquid Investments</Label>
            <Input
              type="number"
              placeholder="e.g. 200000"
              value={input.assets.semiLiquidInvestments || ''}
              onChange={(e) => setInput({ ...input, assets: { ...input.assets, semiLiquidInvestments: Number(e.target.value) } })}
            />
          </div>
          <div>
            <Label>Real Estate Market Value</Label>
            <Input
              type="number"
              placeholder="e.g. 1500000"
              value={input.assets.realEstateMarketValue || ''}
              onChange={(e) => setInput({ ...input, assets: { ...input.assets, realEstateMarketValue: Number(e.target.value) } })}
            />
          </div>
          <div>
            <Label>Real Estate Mortgage Balance</Label>
            <Input
              type="number"
              placeholder="e.g. 800000"
              value={input.assets.realEstateMortgageBalance || ''}
              onChange={(e) => setInput({ ...input, assets: { ...input.assets, realEstateMortgageBalance: Number(e.target.value) } })}
            />
          </div>
        </CardContent>
      </Card>

      {/* Step 4: Profile */}
      <Card>
        <CardHeader>
          <CardTitle>Step 4: Personal Profile</CardTitle>
        </CardHeader>
        <CardContent className="grid md:grid-cols-2 gap-4">
          <div>
            <Label>Age</Label>
            <Input
              type="number"
              value={input.profile.age}
              onChange={(e) => setInput({ ...input, profile: { ...input.profile, age: Number(e.target.value) } })}
            />
          </div>
          <div>
            <Label>Marital Status</Label>
            <Select
              value={input.profile.maritalStatus}
              onValueChange={(value: any) => setInput({ ...input, profile: { ...input.profile, maritalStatus: value } })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="single">Single</SelectItem>
                <SelectItem value="married">Married</SelectItem>
                <SelectItem value="divorced">Divorced</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Number of Children</Label>
            <Input
              type="number"
              value={input.profile.numberOfChildren}
              onChange={(e) => setInput({ ...input, profile: { ...input.profile, numberOfChildren: Number(e.target.value) } })}
            />
          </div>
          <div>
            <Label>Goal Type</Label>
            <Select
              value={input.profile.goalType}
              onValueChange={(value: any) => setInput({ ...input, profile: { ...input.profile, goalType: value } })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="firstHome">First Home</SelectItem>
                <SelectItem value="investmentProperty">Investment Property</SelectItem>
                <SelectItem value="upgradeHome">Upgrade Home</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Risk Comfort Level</Label>
            <Select
              value={input.profile.riskComfortLevel}
              onValueChange={(value: any) => setInput({ ...input, profile: { ...input.profile, riskComfortLevel: value } })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-center">
        <Button onClick={handleCalculate} size="lg" className="px-8">
          Calculate My Checkup
        </Button>
      </div>

      {/* Results */}
      {results && (
        <Card className="border-primary">
          <CardHeader>
            <CardTitle className="text-2xl">Your Financial Checkup Results</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm text-muted-foreground">Monthly Free Cash Flow</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className={`text-2xl font-bold ${results.freeCashFlow >= 0 ? 'text-primary' : 'text-destructive'}`}>
                    {formatCurrency(results.freeCashFlow)}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm text-muted-foreground">Available Equity</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-primary">{formatCurrency(results.availableEquity)}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm text-muted-foreground">Safe Monthly Mortgage</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-primary">{formatCurrency(results.maxSafeMortgagePayment)}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm text-muted-foreground">Readiness Score</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <p className="text-2xl font-bold text-primary">{Math.round(results.readinessScore)}/100</p>
                    <Badge
                      variant={
                        results.readinessLabel === 'High'
                          ? 'default'
                          : results.readinessLabel === 'Medium'
                          ? 'secondary'
                          : 'destructive'
                      }
                    >
                      {results.readinessLabel}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Insights */}
            <Card className="bg-accent">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {results.readinessLabel === 'High' ? (
                    <CheckCircle className="h-5 w-5 text-primary" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-muted-foreground" />
                  )}
                  Key Insights
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {results.freeCashFlow < 0 && (
                  <p className="text-destructive">
                    ⚠️ Your monthly cash flow is negative. Focus on reducing debts and expenses before committing to a mortgage.
                  </p>
                )}
                {results.availableEquity < 300000 && (
                  <p className="text-muted-foreground">
                    💡 Your available equity is below the typical target of ₪300,000. Consider increasing savings before investing.
                  </p>
                )}
                {results.readinessLabel === 'High' && (
                  <p className="text-primary flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Excellent! You're in a strong position. Consider moving to the Deal Business Plan calculator to analyze specific opportunities.
                  </p>
                )}
              </CardContent>
            </Card>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default FinancialCheckup;
