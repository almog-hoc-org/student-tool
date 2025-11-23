import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { calculateDealBusinessPlan } from '@/lib/calculations/deal-business-plan';
import { DealBusinessPlanInput, DealBusinessPlanOutput, DealType } from '@/types/deal-business-plan';
import { he } from '@/lib/translations/he';
import { formatCurrency, formatPercent } from '@/lib/validation/validators';

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

  const classificationVariant = (classification: string) => {
    if (classification === 'Excellent' || classification === 'Good') return 'default';
    if (classification === 'Average') return 'secondary';
    return 'destructive';
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">{he.dealBusinessPlan.title}</CardTitle>
          <CardDescription>
            {he.dealBusinessPlan.description}
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Step 1: Deal Type */}
      <Card>
        <CardHeader>
          <CardTitle>{he.dealBusinessPlan.dealTypeTitle}</CardTitle>
        </CardHeader>
        <CardContent>
          <Label>{he.dealBusinessPlan.dealType}</Label>
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
              <SelectItem value="rental">{he.dealBusinessPlan.dealTypeOptions.rental}</SelectItem>
              <SelectItem value="flip">{he.dealBusinessPlan.dealTypeOptions.flip}</SelectItem>
              <SelectItem value="ownUse">{he.dealBusinessPlan.dealTypeOptions.ownUse}</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Step 2: Basic Deal Inputs */}
      <Card>
        <CardHeader>
          <CardTitle>{he.dealBusinessPlan.basicInfoTitle}</CardTitle>
        </CardHeader>
        <CardContent className="grid md:grid-cols-2 gap-4">
          <div>
            <Label>{he.dealBusinessPlan.purchasePrice} ({he.common.currency})</Label>
            <Input
              type="number"
              placeholder="למשל 1500000"
              value={input.basic.purchasePrice || ''}
              onChange={(e) => setInput({ ...input, basic: { ...input.basic, purchasePrice: Number(e.target.value) } })}
            />
          </div>
          <div>
            <Label>{he.dealBusinessPlan.sideCosts} ({he.common.currency})</Label>
            <Input
              type="number"
              placeholder="למשל 100000"
              value={input.basic.sideCosts || ''}
              onChange={(e) => setInput({ ...input, basic: { ...input.basic, sideCosts: Number(e.target.value) } })}
            />
          </div>
          <div>
            <Label>{he.dealBusinessPlan.renovationCost} ({he.common.currency})</Label>
            <Input
              type="number"
              placeholder="למשל 150000"
              value={input.basic.renovationCost || ''}
              onChange={(e) => setInput({ ...input, basic: { ...input.basic, renovationCost: Number(e.target.value) } })}
            />
          </div>
          {dealType === 'flip' && (
            <div>
              <Label>{he.dealBusinessPlan.holdingPeriodYears}</Label>
              <Input
                type="number"
                placeholder="למשל 2"
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
          <CardTitle>{he.dealBusinessPlan.financingTitle}</CardTitle>
        </CardHeader>
        <CardContent className="grid md:grid-cols-2 gap-4">
          <div>
            <Label>{he.dealBusinessPlan.equityInvested} ({he.common.currency})</Label>
            <Input
              type="number"
              placeholder="למשל 500000"
              value={input.financing.equityInvested || ''}
              onChange={(e) => setInput({ ...input, financing: { ...input.financing, equityInvested: Number(e.target.value) } })}
            />
          </div>
          <div>
            <Label>{he.dealBusinessPlan.mortgageAmount} ({he.common.currency})</Label>
            <Input
              type="number"
              placeholder="למשל 1000000"
              value={input.financing.mortgageAmount || ''}
              onChange={(e) => setInput({ ...input, financing: { ...input.financing, mortgageAmount: Number(e.target.value) } })}
            />
          </div>
          <div>
            <Label>{he.dealBusinessPlan.mortgageMonthlyPayment} ({he.common.currency})</Label>
            <Input
              type="number"
              placeholder="למשל 5000"
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
            <CardTitle>{he.dealBusinessPlan.rentalInputsTitle}</CardTitle>
          </CardHeader>
          <CardContent className="grid md:grid-cols-2 gap-4">
            <div>
              <Label>{he.dealBusinessPlan.expectedMonthlyRent} ({he.common.currency})</Label>
              <Input
                type="number"
                placeholder="למשל 6000"
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
              <Label>{he.dealBusinessPlan.occupancyRate} (%)</Label>
              <Input
                type="number"
                placeholder="למשל 95"
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
              <Label>{he.dealBusinessPlan.annualPropertyTax} ({he.common.currency})</Label>
              <Input
                type="number"
                placeholder="למשל 5000"
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
              <Label>{he.dealBusinessPlan.annualInsurance} ({he.common.currency})</Label>
              <Input
                type="number"
                placeholder="למשל 2000"
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
              <Label>{he.dealBusinessPlan.annualMaintenance} ({he.common.currency})</Label>
              <Input
                type="number"
                placeholder="למשל 6000"
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
              <Label>{he.dealBusinessPlan.annualManagementFees} ({he.common.currency})</Label>
              <Input
                type="number"
                placeholder="למשל 3000"
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
            <CardTitle>{he.dealBusinessPlan.flipInputsTitle}</CardTitle>
          </CardHeader>
          <CardContent className="grid md:grid-cols-2 gap-4">
            <div>
              <Label>{he.dealBusinessPlan.expectedSalePrice} ({he.common.currency})</Label>
              <Input
                type="number"
                placeholder="למשל 2000000"
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
              <Label>{he.dealBusinessPlan.saleCosts} ({he.common.currency})</Label>
              <Input
                type="number"
                placeholder="למשל 50000"
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
          {he.common.calculate}
        </Button>
      </div>

      {/* Results */}
      {results && (
        <Card className="border-primary">
          <CardHeader>
            <CardTitle className="text-2xl">{he.dealBusinessPlan.resultsTitle}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm text-muted-foreground">{he.dealBusinessPlan.totalDealCost}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">{formatCurrency(results.totalDealCost)}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm text-muted-foreground">{he.dealBusinessPlan.equityInvested}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">{formatCurrency(input.financing.equityInvested)}</p>
                </CardContent>
              </Card>

              {results.netCashflowAnnual !== undefined && (
                <>
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm text-muted-foreground">{he.dealBusinessPlan.netCashflowAnnual}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className={`text-2xl font-bold ${results.netCashflowAnnual >= 0 ? 'text-primary' : 'text-destructive'}`}>
                        {formatCurrency(results.netCashflowAnnual)}
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm text-muted-foreground">{he.dealBusinessPlan.cocYield}</CardTitle>
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
                      <CardTitle className="text-sm text-muted-foreground">{he.dealBusinessPlan.grossProfit}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className={`text-2xl font-bold ${results.grossProfit >= 0 ? 'text-primary' : 'text-destructive'}`}>
                        {formatCurrency(results.grossProfit)}
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm text-muted-foreground">{he.dealBusinessPlan.annualizedRoi}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold text-primary">{formatPercent(results.annualizedRoi || 0)}</p>
                    </CardContent>
                  </Card>
                </>
              )}

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm text-muted-foreground">{he.dealBusinessPlan.classification}</CardTitle>
                </CardHeader>
                <CardContent>
                  <Badge
                    variant={classificationVariant(results.classification)}
                    className="text-lg px-3 py-1"
                  >
                    {he.dealBusinessPlan.classificationLabels[results.classification as keyof typeof he.dealBusinessPlan.classificationLabels]}
                  </Badge>
                </CardContent>
              </Card>
            </div>

            <Card className="bg-accent">
              <CardHeader>
                <CardTitle>{he.common.summary}</CardTitle>
              </CardHeader>
              <CardContent>
                {results.classification === 'Weak' && (
                  <p className="text-destructive">
                    {he.dealBusinessPlan.explanationWeak}
                  </p>
                )}
                {results.classification === 'Average' && (
                  <p className="text-muted-foreground">
                    {he.dealBusinessPlan.explanationAverage}
                  </p>
                )}
                {(results.classification === 'Good' || results.classification === 'Excellent') && (
                  <p className="text-primary">
                    {results.classification === 'Excellent' 
                      ? he.dealBusinessPlan.explanationExcellent 
                      : he.dealBusinessPlan.explanationGood}
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