import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { calculateDealBusinessPlan } from '@/lib/calculations/deal-business-plan';
import { DealBusinessPlanInput, DealBusinessPlanOutput, DealType } from '@/types/deal-business-plan';
import { he } from '@/lib/translations/he';
import { formatCurrency, formatPercent } from '@/lib/validation/validators';
import { StatsCard } from '@/components/StatsCard';
import { SmartInsight, generateDealInsights } from '@/components/SmartInsight';
import { ConfidenceGauge } from '@/components/ConfidenceGauge';
import { Building2, Wallet, TrendingUp, Calculator, Loader2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { saveCalculation } from '@/lib/storage/calculator-history';
import { toast } from '@/hooks/use-toast';

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
  const [isCalculating, setIsCalculating] = useState(false);

  const handleCalculate = async () => {
    setIsCalculating(true);
    
    // Simulate calculation delay for UX
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const output = calculateDealBusinessPlan(input);
    setResults(output);
    
    // Save to history
    const title = `עסקה ${he.dealBusinessPlan.dealTypeOptions[dealType]} - ${formatCurrency(input.basic.purchasePrice)}`;
    const result = dealType === 'rental' 
      ? `תשואה: ${formatPercent(output.cocYield || 0)}` 
      : `רווח: ${formatCurrency(output.grossProfit || 0)}`;
    
    saveCalculation({
      type: 'deal',
      title,
      result,
      input,
    });
    
    toast({
      title: "החישוב הושלם בהצלחה",
      description: "התוצאות נשמרו בהיסטוריה",
    });
    
    setIsCalculating(false);
  };

  const classificationVariant = (classification: string) => {
    if (classification === 'Excellent' || classification === 'Good') return 'default';
    if (classification === 'Average') return 'secondary';
    return 'destructive';
  };

  return (
    <div className="space-y-6 pb-8">
      <Card className="border-0 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-primary/5 via-background to-secondary/5">
          <CardTitle className="text-3xl font-bold">{he.dealBusinessPlan.title}</CardTitle>
          <CardDescription className="text-base">
            {he.dealBusinessPlan.description}
          </CardDescription>
        </CardHeader>
      </Card>

      {/* KPI Cards - Show after calculation */}
      {results && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 animate-in slide-in-from-bottom duration-500">
          <StatsCard
            title={he.dealBusinessPlan.totalDealCost}
            value={formatCurrency(results.totalDealCost)}
            icon={Building2}
            iconColor="blue"
          />
          <StatsCard
            title={he.dealBusinessPlan.equityInvested}
            value={formatCurrency(input.financing.equityInvested)}
            icon={Wallet}
            iconColor="orange"
          />
          <StatsCard
            title={dealType === 'rental' ? he.dealBusinessPlan.cocYield : he.dealBusinessPlan.annualizedRoi}
            value={dealType === 'rental' ? formatPercent(results.cocYield || 0) : formatPercent(results.annualizedRoi || 0)}
            icon={TrendingUp}
            iconColor="green"
          />
          <StatsCard
            title={he.dealBusinessPlan.classification}
            value={he.dealBusinessPlan.classificationLabels[results.classification as keyof typeof he.dealBusinessPlan.classificationLabels]}
            icon={Calculator}
            iconColor="purple"
          />
        </div>
      )}

      {/* Step 1: Deal Type */}
      <Card className="border-0 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950">
          <CardTitle className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
              <Calculator className="w-5 h-5 text-primary-foreground" />
            </div>
            {he.dealBusinessPlan.dealTypeTitle}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <Label>{he.dealBusinessPlan.dealType}</Label>
          <Select
            value={dealType}
            onValueChange={(value: DealType) => {
              setDealType(value);
              setInput({ ...input, basic: { ...input.basic, dealType: value } });
            }}
          >
            <SelectTrigger className="mt-2">
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

      {/* Step 2 & 3: Two column layout */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Basic Deal Inputs */}
        <Card className="border-0 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-emerald-50 to-background dark:from-emerald-950 dark:to-background">
            <CardTitle className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center">
                <Building2 className="w-5 h-5 text-white" />
              </div>
              {he.dealBusinessPlan.basicInfoTitle}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
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

        {/* Financing */}
        <Card className="border-0 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-orange-50 to-background dark:from-orange-950 dark:to-background">
            <CardTitle className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center">
                <Wallet className="w-5 h-5 text-white" />
              </div>
              {he.dealBusinessPlan.financingTitle}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
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
      </div>

      {/* Step 4: Rental Inputs */}
      {dealType === 'rental' && (
        <Card className="border-0 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-background dark:from-blue-950 dark:to-background">
            <CardTitle className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              {he.dealBusinessPlan.rentalInputsTitle}
            </CardTitle>
          </CardHeader>
          <CardContent className="grid md:grid-cols-2 gap-4 pt-6">
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
        <Card className="border-0 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-purple-50 to-background dark:from-purple-950 dark:to-background">
            <CardTitle className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-500 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              {he.dealBusinessPlan.flipInputsTitle}
            </CardTitle>
          </CardHeader>
          <CardContent className="grid md:grid-cols-2 gap-4 pt-6">
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

      <div className="flex justify-center sticky bottom-8 z-10">
        <Button onClick={handleCalculate} size="lg" disabled={isCalculating} className="px-12 py-6 text-lg shadow-2xl rounded-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70">
          {isCalculating ? (
            <>
              <Loader2 className="ml-2 h-5 w-5 animate-spin" />
              מחשב...
            </>
          ) : (
            <>
              <Calculator className="ml-2 h-5 w-5" />
              {he.common.calculate}
            </>
          )}
        </Button>
      </div>

      {/* Results */}
      {results && (
        <div className="space-y-6 animate-in slide-in-from-bottom duration-500">
          {/* Smart Insights */}
          <SmartInsight
            insights={generateDealInsights({
              cocYield: results.cocYield,
              roi: results.roi,
              netCashflow: results.netCashflowAnnual,
              equityPercent: results.totalDealCost > 0 ? (input.financing.equityInvested / results.totalDealCost) * 100 : 0,
            })}
          />

          {/* Confidence Gauge */}
          {(() => {
            const equityPct = results.totalDealCost > 0 ? (input.financing.equityInvested / results.totalDealCost) * 100 : 0;
            const yieldScore = dealType === 'rental' ? Math.min(100, (results.cocYield || 0) * 100 * 10) : Math.min(100, ((results.annualizedRoi || 0) * 100) * 5);
            const cashflowScore = results.netCashflowAnnual !== undefined ? (results.netCashflowAnnual >= 0 ? 30 : 0) : 15;
            const score = Math.min(100, equityPct * 0.4 + yieldScore * 0.4 + cashflowScore);
            return <ConfidenceGauge score={score} />;
          })()}

          {/* Visual Chart for Rental */}
          {dealType === 'rental' && results.netCashflowAnnual !== undefined && (
            <Card className="border-0 shadow-xl">
              <CardHeader>
                <CardTitle className="text-2xl">ניתוח תזרים מזומנים</CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="chart" className="w-full">
                  <TabsList className="grid w-full grid-cols-2 mb-6">
                    <TabsTrigger value="chart">גרף</TabsTrigger>
                    <TabsTrigger value="table">טבלה</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="chart">
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart
                        data={[
                          {
                            name: 'הכנסה שנתית',
                            value: (input.rental?.expectedMonthlyRent || 0) * 12 * (input.rental?.occupancyRate || 0.95),
                          },
                          {
                            name: 'הוצאות + משכנתא',
                            value: (input.rental?.expectedMonthlyRent || 0) * 12 * (input.rental?.occupancyRate || 0.95) - results.netCashflowAnnual,
                          },
                          {
                            name: 'תזרים נקי',
                            value: results.netCashflowAnnual,
                          },
                        ]}
                      >
                        <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                        <Bar dataKey="value" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </TabsContent>
                  
                  <TabsContent value="table">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>פריט</TableHead>
                          <TableHead className="text-left">סכום שנתי</TableHead>
                          <TableHead className="text-left">סכום חודשי</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        <TableRow>
                          <TableCell className="font-medium">הכנסה משכירות</TableCell>
                          <TableCell>{formatCurrency((input.rental?.expectedMonthlyRent || 0) * 12 * (input.rental?.occupancyRate || 0.95))}</TableCell>
                          <TableCell>{formatCurrency((input.rental?.expectedMonthlyRent || 0) * (input.rental?.occupancyRate || 0.95))}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium">הוצאות תפעוליות</TableCell>
                          <TableCell>{formatCurrency(
                            (input.rental?.annualPropertyTax || 0) +
                            (input.rental?.annualInsurance || 0) +
                            (input.rental?.annualMaintenance || 0) +
                            (input.rental?.annualManagementFees || 0) +
                            (input.rental?.otherAnnualCosts || 0)
                          )}</TableCell>
                          <TableCell>{formatCurrency(
                            ((input.rental?.annualPropertyTax || 0) +
                            (input.rental?.annualInsurance || 0) +
                            (input.rental?.annualMaintenance || 0) +
                            (input.rental?.annualManagementFees || 0) +
                            (input.rental?.otherAnnualCosts || 0)) / 12
                          )}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium">תשלום משכנתא</TableCell>
                          <TableCell>{formatCurrency(input.financing.mortgageMonthlyPayment * 12)}</TableCell>
                          <TableCell>{formatCurrency(input.financing.mortgageMonthlyPayment)}</TableCell>
                        </TableRow>
                        <TableRow className="font-bold bg-primary/5">
                          <TableCell>תזרים מזומנים נקי</TableCell>
                          <TableCell>{formatCurrency(results.netCashflowAnnual)}</TableCell>
                          <TableCell>{formatCurrency(results.netCashflowAnnual / 12)}</TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          )}

          {/* Visual Chart for Flip */}
          {dealType === 'flip' && results.grossProfit !== undefined && (
            <Card className="border-0 shadow-xl">
              <CardHeader>
                <CardTitle className="text-2xl">ניתוח עסקת היפוך</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart
                    data={[
                      { name: 'עלות כוללת', value: results.totalDealCost },
                      { name: 'מחיר מכירה', value: input.flip?.expectedSalePrice || 0 },
                      { name: 'רווח גולמי', value: results.grossProfit },
                    ]}
                  >
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                    <Bar dataKey="value" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          <Card className="border-0 shadow-xl bg-gradient-to-br from-primary/5 to-secondary/5">
            <CardHeader>
              <CardTitle className="text-3xl">{he.dealBusinessPlan.resultsTitle}</CardTitle>
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

            <Card className="bg-accent/50 border-0">
              <CardHeader>
                <CardTitle className="text-xl">{he.common.summary}</CardTitle>
              </CardHeader>
              <CardContent className="text-base">
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
        </div>
      )}
    </div>
  );
};

export default DealBusinessPlan;