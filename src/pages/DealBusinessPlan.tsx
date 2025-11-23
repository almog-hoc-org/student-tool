import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { calculateDealBusinessPlan } from '@/lib/calculations/deal-business-plan';
import { DealBusinessPlanInput, DealBusinessPlanOutput, DealType } from '@/types/deal-business-plan';

const DealBusinessPlan = () => {
  const [dealType, setDealType] = useState<DealType>('rental');
  const [input, setInput] = useState<DealBusinessPlanInput>({
    basic: {
      dealType: 'rental',
      purchasePrice: 0,
      sideCosts: 0,
      renovationCost: 0,
      holdingPeriodYears: 2,
    },
    financing: {
      equityInvested: 0,
      mortgageAmount: 0,
      mortgageMonthlyPayment: 0,
    },
    rental: {
      expectedMonthlyRent: 0,
      occupancyRate: 0.95,
      annualPropertyTax: 0,
      annualInsurance: 0,
      annualMaintenance: 0,
      annualManagementFees: 0,
      otherAnnualCosts: 0,
    },
    flip: {
      expectedSalePrice: 0,
      saleCosts: 0,
    },
  });

  const [results, setResults] = useState<DealBusinessPlanOutput | null>(null);

  const handleCalculate = () => {
    const output = calculateDealBusinessPlan(input);
    setResults(output);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-IL', {
      style: 'currency',
      currency: 'ILS',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const formatPercent = (value: number) => {
    return `${(value * 100).toFixed(2)}%`;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Deal Business Plan</CardTitle>
          <CardDescription>
            Evaluate deal profitability and yield with clear, understandable numbers.
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Step 1: Deal Type */}
      <Card>
        <CardHeader>
          <CardTitle>Step 1: Deal Type</CardTitle>
        </CardHeader>
        <CardContent>
          <Label>What type of deal is this?</Label>
          <Select
            value={dealType}
            onValueChange={(value: DealType) => {
              setDealType(value);
              setInput({ ...input, basic: { ...input.basic, dealType: value } });
            }}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="rental">Rental Property</SelectItem>
              <SelectItem value="flip">Flip/Resale</SelectItem>
              <SelectItem value="ownUse">Own Use</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Step 2: Basic Deal Inputs */}
      <Card>
        <CardHeader>
          <CardTitle>Step 2: Basic Deal Information</CardTitle>
        </CardHeader>
        <CardContent className="grid md:grid-cols-2 gap-4">
          <div>
            <Label>Purchase Price (₪)</Label>
            <Input
              type="number"
              placeholder="e.g. 1500000"
              value={input.basic.purchasePrice || ''}
              onChange={(e) => setInput({ ...input, basic: { ...input.basic, purchasePrice: Number(e.target.value) } })}
            />
          </div>
          <div>
            <Label>Side Costs (taxes, lawyer, broker) (₪)</Label>
            <Input
              type="number"
              placeholder="e.g. 100000"
              value={input.basic.sideCosts || ''}
              onChange={(e) => setInput({ ...input, basic: { ...input.basic, sideCosts: Number(e.target.value) } })}
            />
          </div>
          <div>
            <Label>Renovation Cost (₪)</Label>
            <Input
              type="number"
              placeholder="e.g. 150000"
              value={input.basic.renovationCost || ''}
              onChange={(e) => setInput({ ...input, basic: { ...input.basic, renovationCost: Number(e.target.value) } })}
            />
          </div>
          {dealType === 'flip' && (
            <div>
              <Label>Holding Period (years)</Label>
              <Input
                type="number"
                placeholder="e.g. 2"
                value={input.basic.holdingPeriodYears}
                onChange={(e) => setInput({ ...input, basic: { ...input.basic, holdingPeriodYears: Number(e.target.value) } })}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Step 3: Financing */}
      <Card>
        <CardHeader>
          <CardTitle>Step 3: Financing</CardTitle>
        </CardHeader>
        <CardContent className="grid md:grid-cols-2 gap-4">
          <div>
            <Label>Equity Invested (₪)</Label>
            <Input
              type="number"
              placeholder="e.g. 500000"
              value={input.financing.equityInvested || ''}
              onChange={(e) => setInput({ ...input, financing: { ...input.financing, equityInvested: Number(e.target.value) } })}
            />
          </div>
          <div>
            <Label>Mortgage Amount (₪)</Label>
            <Input
              type="number"
              placeholder="e.g. 1000000"
              value={input.financing.mortgageAmount || ''}
              onChange={(e) => setInput({ ...input, financing: { ...input.financing, mortgageAmount: Number(e.target.value) } })}
            />
          </div>
          <div>
            <Label>Monthly Mortgage Payment (₪)</Label>
            <Input
              type="number"
              placeholder="e.g. 5000"
              value={input.financing.mortgageMonthlyPayment || ''}
              onChange={(e) => setInput({ ...input, financing: { ...input.financing, mortgageMonthlyPayment: Number(e.target.value) } })}
            />
          </div>
        </CardContent>
      </Card>

      {/* Step 4: Rental Inputs */}
      {dealType === 'rental' && (
        <Card>
          <CardHeader>
            <CardTitle>Step 4: Rental Income & Operating Costs</CardTitle>
          </CardHeader>
          <CardContent className="grid md:grid-cols-2 gap-4">
            <div>
              <Label>Expected Monthly Rent (₪)</Label>
              <Input
                type="number"
                placeholder="e.g. 6000"
                value={input.rental?.expectedMonthlyRent || ''}
                onChange={(e) =>
                  setInput({
                    ...input,
                    rental: { ...input.rental!, expectedMonthlyRent: Number(e.target.value) },
                  })
                }
              />
            </div>
            <div>
              <Label>Occupancy Rate (%)</Label>
              <Input
                type="number"
                placeholder="e.g. 95"
                value={(input.rental?.occupancyRate || 0.95) * 100}
                onChange={(e) =>
                  setInput({
                    ...input,
                    rental: { ...input.rental!, occupancyRate: Number(e.target.value) / 100 },
                  })
                }
              />
            </div>
            <div>
              <Label>Annual Property Tax (₪)</Label>
              <Input
                type="number"
                placeholder="e.g. 5000"
                value={input.rental?.annualPropertyTax || ''}
                onChange={(e) =>
                  setInput({
                    ...input,
                    rental: { ...input.rental!, annualPropertyTax: Number(e.target.value) },
                  })
                }
              />
            </div>
            <div>
              <Label>Annual Insurance (₪)</Label>
              <Input
                type="number"
                placeholder="e.g. 2000"
                value={input.rental?.annualInsurance || ''}
                onChange={(e) =>
                  setInput({
                    ...input,
                    rental: { ...input.rental!, annualInsurance: Number(e.target.value) },
                  })
                }
              />
            </div>
            <div>
              <Label>Annual Maintenance (₪)</Label>
              <Input
                type="number"
                placeholder="e.g. 6000"
                value={input.rental?.annualMaintenance || ''}
                onChange={(e) =>
                  setInput({
                    ...input,
                    rental: { ...input.rental!, annualMaintenance: Number(e.target.value) },
                  })
                }
              />
            </div>
            <div>
              <Label>Annual Management Fees (₪)</Label>
              <Input
                type="number"
                placeholder="e.g. 3000"
                value={input.rental?.annualManagementFees || ''}
                onChange={(e) =>
                  setInput({
                    ...input,
                    rental: { ...input.rental!, annualManagementFees: Number(e.target.value) },
                  })
                }
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 4: Flip Inputs */}
      {dealType === 'flip' && (
        <Card>
          <CardHeader>
            <CardTitle>Step 4: Sale Information</CardTitle>
          </CardHeader>
          <CardContent className="grid md:grid-cols-2 gap-4">
            <div>
              <Label>Expected Sale Price (₪)</Label>
              <Input
                type="number"
                placeholder="e.g. 2000000"
                value={input.flip?.expectedSalePrice || ''}
                onChange={(e) =>
                  setInput({
                    ...input,
                    flip: { ...input.flip!, expectedSalePrice: Number(e.target.value) },
                  })
                }
              />
            </div>
            <div>
              <Label>Sale Costs (broker, lawyer) (₪)</Label>
              <Input
                type="number"
                placeholder="e.g. 50000"
                value={input.flip?.saleCosts || ''}
                onChange={(e) =>
                  setInput({
                    ...input,
                    flip: { ...input.flip!, saleCosts: Number(e.target.value) },
                  })
                }
              />
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex justify-center">
        <Button onClick={handleCalculate} size="lg" className="px-8">
          Calculate Deal Analysis
        </Button>
      </div>

      {/* Results */}
      {results && (
        <Card className="border-primary">
          <CardHeader>
            <CardTitle className="text-2xl">Deal Analysis Results</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm text-muted-foreground">Total Deal Cost</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">{formatCurrency(results.totalDealCost)}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm text-muted-foreground">Equity Invested</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">{formatCurrency(input.financing.equityInvested)}</p>
                </CardContent>
              </Card>

              {results.netCashflowAnnual !== undefined && (
                <>
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm text-muted-foreground">Net Annual Cashflow</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className={`text-2xl font-bold ${results.netCashflowAnnual >= 0 ? 'text-primary' : 'text-destructive'}`}>
                        {formatCurrency(results.netCashflowAnnual)}
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm text-muted-foreground">Cash on Cash Yield</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold text-primary">{formatPercent(results.cocYield || 0)}</p>
                    </CardContent>
                  </Card>
                </>
              )}

              {results.grossProfit !== undefined && (
                <>
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm text-muted-foreground">Gross Profit</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className={`text-2xl font-bold ${results.grossProfit >= 0 ? 'text-primary' : 'text-destructive'}`}>
                        {formatCurrency(results.grossProfit)}
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm text-muted-foreground">Annualized ROI</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold text-primary">{formatPercent(results.annualizedRoi || 0)}</p>
                    </CardContent>
                  </Card>
                </>
              )}

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm text-muted-foreground">Deal Classification</CardTitle>
                </CardHeader>
                <CardContent>
                  <Badge
                    variant={
                      results.classification === 'Excellent' || results.classification === 'Good'
                        ? 'default'
                        : results.classification === 'Average'
                        ? 'secondary'
                        : 'destructive'
                    }
                    className="text-lg px-3 py-1"
                  >
                    {results.classification}
                  </Badge>
                </CardContent>
              </Card>
            </div>

            <Card className="bg-accent">
              <CardHeader>
                <CardTitle>Analysis Summary</CardTitle>
              </CardHeader>
              <CardContent>
                {results.classification === 'Weak' && (
                  <p className="text-destructive">
                    ⚠️ This deal shows weak returns. Consider negotiating a better price, finding ways to increase income, or looking for alternative opportunities.
                  </p>
                )}
                {results.classification === 'Average' && (
                  <p className="text-muted-foreground">
                    💡 This deal shows average returns. It may be acceptable in certain market conditions, but carefully evaluate all risks.
                  </p>
                )}
                {(results.classification === 'Good' || results.classification === 'Excellent') && (
                  <p className="text-primary">
                    ✓ This deal shows strong returns from an ROI perspective. Remember to also evaluate location, market trends, and execution risks.
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

export default DealBusinessPlan;
