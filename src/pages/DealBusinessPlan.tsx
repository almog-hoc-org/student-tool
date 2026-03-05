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
import { calculatePurchaseTax, BuyerType } from '@/lib/calculations/purchase-tax';
import { calculateRentalIRR, calculateFlipIRR } from '@/lib/calculations/irr';
import { DealBusinessPlanInput, DealBusinessPlanOutput, DealType } from '@/types/deal-business-plan';
import { he } from '@/lib/translations/he';
import { formatCurrency, formatPercent } from '@/lib/validation/validators';
import { StatsCard } from '@/components/StatsCard';
import { SmartInsight, generateDealInsights } from '@/components/SmartInsight';
import { HiddenCostsChecklist } from '@/components/HiddenCostsChecklist';
import { ExecutiveSummary } from '@/components/ExecutiveSummary';
import { FuelGauge } from '@/components/FuelGauge';
import { Building2, Wallet, TrendingUp, Calculator, Loader2, Users } from 'lucide-react';
import { PageHero } from '@/components/PageHero';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, LineChart, Line } from 'recharts';
import { motion } from 'framer-motion';
import { saveCalculation } from '@/lib/storage/calculator-history';
import { useAutoPersist } from '@/hooks/useAutoPersist';
import { toast } from '@/hooks/use-toast';

const DealBusinessPlan = () => {
  const [dealType, setDealType] = useAutoPersist<DealType>('deal-type', 'rental');
  const [buyerType, setBuyerType] = useAutoPersist<BuyerType>('deal-buyer-type', 'singleApartment');
  const [holdingYears, setHoldingYears] = useAutoPersist<number>('deal-holding-years', 10);
  const [exitValue, setExitValue] = useAutoPersist<number>('deal-exit-value', 0);
  const [annualAppreciation, setAnnualAppreciation] = useAutoPersist<number>('deal-appreciation', 3);

  const [input, setInput] = useAutoPersist<DealBusinessPlanInput>('deal-inputs', {
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
  const [irrResult, setIrrResult] = useState<number | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);

  // Purchase tax calculation (live)
  const taxResult = input.basic.purchasePrice > 0
    ? calculatePurchaseTax({ purchasePrice: input.basic.purchasePrice, buyerType })
    : null;

  // Handle hidden costs change
  const handleHiddenCostsChange = (totalCosts: number) => {
    setInput(prev => ({ ...prev, basic: { ...prev.basic, sideCosts: totalCosts } }));
  };

  const handleCalculate = async () => {
    setIsCalculating(true);
    await new Promise(resolve => setTimeout(resolve, 400));

    const output = calculateDealBusinessPlan(input);
    setResults(output);

    // Calculate IRR
    if (dealType === 'rental' && output.netCashflowAnnual !== undefined) {
      const computedExitValue = exitValue > 0
        ? exitValue
        : input.basic.purchasePrice * Math.pow(1 + annualAppreciation / 100, holdingYears);
      const irr = calculateRentalIRR({
        totalInvestment: input.financing.equityInvested,
        annualNetCashflow: output.netCashflowAnnual,
        holdingYears,
        exitValue: computedExitValue,
        exitCosts: computedExitValue * 0.02,
      });
      setIrrResult(irr);
    } else if (dealType === 'flip') {
      const irr = calculateFlipIRR({
        totalInvestment: input.financing.equityInvested,
        holdingMonths: input.basic.holdingPeriodYears * 12,
        monthlyCosts: input.financing.mortgageMonthlyPayment,
        saleProceeds: (input.flip?.expectedSalePrice || 0) - (input.flip?.saleCosts || 0),
      });
      setIrrResult(irr);
    }

    const title = `עסקה ${he.dealBusinessPlan.dealTypeOptions[dealType]} - ${formatCurrency(input.basic.purchasePrice)}`;
    const result = dealType === 'rental'
      ? `תשואה: ${formatPercent(output.cocYield || 0)}`
      : `רווח: ${formatCurrency(output.grossProfit || 0)}`;

    saveCalculation({ type: 'deal', title, result, input });
    toast({ title: "החישוב הושלם בהצלחה", description: "התוצאות נשמרו בהיסטוריה" });
    setIsCalculating(false);

    setTimeout(() => {
      document.getElementById('deal-results')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  // Equity growth projection for rental
  const equityGrowthData = results && dealType === 'rental' ? Array.from({ length: holdingYears + 1 }, (_, year) => {
    const propertyValue = input.basic.purchasePrice * Math.pow(1 + annualAppreciation / 100, year);
    const mortgageBalance = input.financing.mortgageAmount > 0
      ? input.financing.mortgageAmount * Math.max(0, 1 - (year / 25))
      : 0;
    return {
      year: `שנה ${year}`,
      'שווי נכס': Math.round(propertyValue),
      'יתרת משכנתא': Math.round(mortgageBalance),
      'הון עצמי נקי': Math.round(propertyValue - mortgageBalance),
    };
  }) : [];

  const equityPercent = results && results.totalDealCost > 0 ? (input.financing.equityInvested / results.totalDealCost) * 100 : 0;

  const classificationVariant = (classification: string) => {
    if (classification === 'Excellent' || classification === 'Good') return 'default';
    if (classification === 'Average') return 'secondary';
    return 'destructive';
  };

  return (
    <div className="space-y-6 pb-8">
      <PageHero
        icon={<TrendingUp className="w-6 h-6 text-primary" />}
        title={he.dealBusinessPlan.title}
        description={he.dealBusinessPlan.description}
      />

      {/* KPI Cards */}
      {results && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <StatsCard
            title={he.dealBusinessPlan.totalDealCost}
            value={formatCurrency(results.totalDealCost + (taxResult?.totalTax || 0))}
            icon={Building2}
            iconColor="navy"
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
            status={dealType === 'rental'
              ? ((results.cocYield || 0) >= 0.07 ? 'positive' : (results.cocYield || 0) >= 0.03 ? 'neutral' : 'negative')
              : ((results.annualizedRoi || 0) >= 0.10 ? 'positive' : (results.annualizedRoi || 0) >= 0.05 ? 'neutral' : 'negative')
            }
          />
          {irrResult !== null && (
            <StatsCard
              title="IRR (תשואה פנימית)"
              value={formatPercent(irrResult)}
              icon={Calculator}
              iconColor="green"
              status={irrResult >= 0.10 ? 'positive' : irrResult >= 0.05 ? 'neutral' : 'negative'}
            />
          )}
        </div>
      )}

      {/* Deal Type & Buyer Type */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
                <Calculator className="w-5 h-5 text-primary-foreground" />
              </div>
              {he.dealBusinessPlan.dealTypeTitle}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>{he.dealBusinessPlan.dealType}</Label>
              <Select
                value={dealType}
                onValueChange={(value: DealType) => {
                  setDealType(value);
                  setInput(prev => ({ ...prev, basic: { ...prev.basic, dealType: value } }));
                }}
              >
                <SelectTrigger className="mt-2"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="rental">{he.dealBusinessPlan.dealTypeOptions.rental}</SelectItem>
                  <SelectItem value="flip">{he.dealBusinessPlan.dealTypeOptions.flip}</SelectItem>
                  <SelectItem value="ownUse">{he.dealBusinessPlan.dealTypeOptions.ownUse}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <div className="w-10 h-10 bg-secondary rounded-xl flex items-center justify-center">
                <Users className="w-5 h-5 text-secondary-foreground" />
              </div>
              סוג רוכש (למס רכישה)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>סוג הרוכש</Label>
              <Select value={buyerType} onValueChange={(v: BuyerType) => setBuyerType(v)}>
                <SelectTrigger className="mt-2"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="singleApartment">דירה יחידה</SelectItem>
                  <SelectItem value="additionalApartment">דירה נוספת / משקיע</SelectItem>
                  <SelectItem value="foreignResident">תושב חוץ</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {taxResult && input.basic.purchasePrice > 0 && (
              <div className="p-4 rounded-xl bg-accent/50 space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">מס רכישה משוער</span>
                  <span className="font-bold text-lg">{formatCurrency(taxResult.totalTax)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">שיעור אפקטיבי</span>
                  <span>{(taxResult.effectiveRate * 100).toFixed(2)}%</span>
                </div>
                <p className="text-xs text-muted-foreground">מדרגות מוקפאות 16.1.2025 – 15.1.2028</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Basic Deal + Financing */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                <Building2 className="w-5 h-5 text-primary" />
              </div>
              {he.dealBusinessPlan.basicInfoTitle}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            <div>
              <Label>{he.dealBusinessPlan.purchasePrice} ({he.common.currency})</Label>
              <Input type="number" placeholder="למשל 1500000" value={input.basic.purchasePrice || ''} onChange={(e) => setInput(prev => ({ ...prev, basic: { ...prev.basic, purchasePrice: Number(e.target.value) } }))} />
            </div>
            <div>
              <Label>{he.dealBusinessPlan.renovationCost} ({he.common.currency})</Label>
              <Input type="number" placeholder="למשל 150000" value={input.basic.renovationCost || ''} onChange={(e) => setInput(prev => ({ ...prev, basic: { ...prev.basic, renovationCost: Number(e.target.value) } }))} />
            </div>
            {dealType === 'flip' && (
              <div>
                <Label>{he.dealBusinessPlan.holdingPeriodYears}</Label>
                <Input type="number" placeholder="למשל 2" value={input.basic.holdingPeriodYears} onChange={(e) => setInput(prev => ({ ...prev, basic: { ...prev.basic, holdingPeriodYears: Number(e.target.value) } }))} />
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                <Wallet className="w-5 h-5 text-primary" />
              </div>
              {he.dealBusinessPlan.financingTitle}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            <div>
              <Label>{he.dealBusinessPlan.equityInvested} ({he.common.currency})</Label>
              <Input type="number" placeholder="למשל 500000" value={input.financing.equityInvested || ''} onChange={(e) => setInput(prev => ({ ...prev, financing: { ...prev.financing, equityInvested: Number(e.target.value) } }))} />
            </div>
            <div>
              <Label>{he.dealBusinessPlan.mortgageAmount} ({he.common.currency})</Label>
              <Input type="number" placeholder="למשל 1000000" value={input.financing.mortgageAmount || ''} onChange={(e) => setInput(prev => ({ ...prev, financing: { ...prev.financing, mortgageAmount: Number(e.target.value) } }))} />
            </div>
            <div>
              <Label>{he.dealBusinessPlan.mortgageMonthlyPayment} ({he.common.currency})</Label>
              <Input type="number" placeholder="למשל 5000" value={input.financing.mortgageMonthlyPayment || ''} onChange={(e) => setInput(prev => ({ ...prev, financing: { ...prev.financing, mortgageMonthlyPayment: Number(e.target.value) } }))} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Hidden Costs Checklist */}
      {input.basic.purchasePrice > 0 && (
        <HiddenCostsChecklist
          purchasePrice={input.basic.purchasePrice}
          onChange={handleHiddenCostsChange}
        />
      )}

      {/* Rental Inputs */}
      {dealType === 'rental' && (
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-primary" />
              </div>
              {he.dealBusinessPlan.rentalInputsTitle}
            </CardTitle>
          </CardHeader>
          <CardContent className="grid md:grid-cols-2 gap-4 pt-6">
            <div>
              <Label>{he.dealBusinessPlan.expectedMonthlyRent} ({he.common.currency})</Label>
              <Input type="number" placeholder="למשל 6000" value={input.rental?.expectedMonthlyRent || ''} onChange={(e) => setInput(prev => ({ ...prev, rental: { ...prev.rental!, expectedMonthlyRent: Number(e.target.value) } }))} />
            </div>
            <div>
              <Label>{he.dealBusinessPlan.occupancyRate} (%)</Label>
              <Input type="number" placeholder="למשל 95" value={(input.rental?.occupancyRate || 0.95) * 100} onChange={(e) => setInput(prev => ({ ...prev, rental: { ...prev.rental!, occupancyRate: Number(e.target.value) / 100 } }))} />
            </div>
            <div>
              <Label>{he.dealBusinessPlan.annualPropertyTax} ({he.common.currency})</Label>
              <Input type="number" placeholder="למשל 5000" value={input.rental?.annualPropertyTax || ''} onChange={(e) => setInput(prev => ({ ...prev, rental: { ...prev.rental!, annualPropertyTax: Number(e.target.value) } }))} />
            </div>
            <div>
              <Label>{he.dealBusinessPlan.annualInsurance} ({he.common.currency})</Label>
              <Input type="number" placeholder="למשל 2000" value={input.rental?.annualInsurance || ''} onChange={(e) => setInput(prev => ({ ...prev, rental: { ...prev.rental!, annualInsurance: Number(e.target.value) } }))} />
            </div>
            <div>
              <Label>{he.dealBusinessPlan.annualMaintenance} ({he.common.currency})</Label>
              <Input type="number" placeholder="למשל 6000" value={input.rental?.annualMaintenance || ''} onChange={(e) => setInput(prev => ({ ...prev, rental: { ...prev.rental!, annualMaintenance: Number(e.target.value) } }))} />
            </div>
            <div>
              <Label>{he.dealBusinessPlan.annualManagementFees} ({he.common.currency})</Label>
              <Input type="number" placeholder="למשל 3000" value={input.rental?.annualManagementFees || ''} onChange={(e) => setInput(prev => ({ ...prev, rental: { ...prev.rental!, annualManagementFees: Number(e.target.value) } }))} />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Rental: IRR inputs */}
      {dealType === 'rental' && (
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-lg">
              <div className="w-10 h-10 bg-secondary/10 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-secondary-foreground" />
              </div>
              תכנון לטווח ארוך (IRR)
            </CardTitle>
            <CardDescription>הגדר תקופת החזקה ושיעור עליית ערך לחישוב תשואה פנימית</CardDescription>
          </CardHeader>
          <CardContent className="grid md:grid-cols-3 gap-4 pt-4">
            <div>
              <Label>שנות החזקה</Label>
              <Input type="number" value={holdingYears} onChange={(e) => setHoldingYears(Number(e.target.value))} />
            </div>
            <div>
              <Label>עליית ערך שנתית (%)</Label>
              <Input type="number" step="0.5" value={annualAppreciation} onChange={(e) => setAnnualAppreciation(Number(e.target.value))} />
            </div>
            <div>
              <Label>שווי מכירה צפוי ({he.common.currency})</Label>
              <Input
                type="number"
                value={exitValue || ''}
                onChange={(e) => setExitValue(Number(e.target.value))}
                placeholder={input.basic.purchasePrice > 0 ? `אוטומטי: ${formatCurrency(input.basic.purchasePrice * Math.pow(1 + annualAppreciation / 100, holdingYears))}` : '0'}
              />
              <p className="text-xs text-muted-foreground mt-1">השאר 0 לחישוב אוטומטי לפי עליית ערך</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Flip Inputs */}
      {dealType === 'flip' && (
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-primary" />
              </div>
              {he.dealBusinessPlan.flipInputsTitle}
            </CardTitle>
          </CardHeader>
          <CardContent className="grid md:grid-cols-2 gap-4 pt-6">
            <div>
              <Label>{he.dealBusinessPlan.expectedSalePrice} ({he.common.currency})</Label>
              <Input type="number" placeholder="למשל 2000000" value={input.flip?.expectedSalePrice || ''} onChange={(e) => setInput(prev => ({ ...prev, flip: { ...prev.flip!, expectedSalePrice: Number(e.target.value) } }))} />
            </div>
            <div>
              <Label>{he.dealBusinessPlan.saleCosts} ({he.common.currency})</Label>
              <Input type="number" placeholder="למשל 50000" value={input.flip?.saleCosts || ''} onChange={(e) => setInput(prev => ({ ...prev, flip: { ...prev.flip!, saleCosts: Number(e.target.value) } }))} />
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex justify-center sticky bottom-20 md:bottom-8 z-10">
        <Button onClick={handleCalculate} size="lg" disabled={isCalculating} className="px-12 py-6 text-lg shadow-2xl rounded-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70">
          {isCalculating ? (<><Loader2 className="ml-2 h-5 w-5 animate-spin" />מחשב...</>) : (<><Calculator className="ml-2 h-5 w-5" />{he.common.calculate}</>)}
        </Button>
      </div>

      {/* Results */}
      {results && (
        <motion.div
          id="deal-results"
          className="space-y-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
        >
          {/* Executive Summary */}
          <ExecutiveSummary
            type={dealType === 'rental' ? 'deal-rental' : 'deal-flip'}
            data={{
              cocYield: results.cocYield,
              irr: irrResult,
              netCashFlow: results.netCashflowAnnual !== undefined ? results.netCashflowAnnual / 12 : undefined,
              grossProfit: results.grossProfit,
              roi: results.roi,
              annualizedRoi: results.annualizedRoi,
              classification: he.dealBusinessPlan.classificationLabels[results.classification as keyof typeof he.dealBusinessPlan.classificationLabels],
            }}
          />

          {/* Smart Insights */}
          <SmartInsight
            insights={generateDealInsights({
              cocYield: results.cocYield,
              roi: results.roi,
              irr: irrResult !== null ? irrResult : undefined,
              netCashflow: results.netCashflowAnnual,
              equityPercent: equityPercent,
            })}
          />

          {/* Leverage Fuel Gauge */}
          <FuelGauge
            value={equityPercent}
            maxValue={100}
            label="שיעור הון עצמי"
            sublabel={`${equityPercent.toFixed(0)}% הון עצמי — ${(100 - equityPercent).toFixed(0)}% מינוף`}
            thresholds={{ green: 50, yellow: 75 }}
          />

          {/* Purchase Tax Breakdown */}
          {taxResult && taxResult.totalTax > 0 && (
            <Card className="border-0 shadow-xl">
              <CardHeader>
                <CardTitle className="text-xl">פירוט מס רכישה</CardTitle>
                <CardDescription>מדרגות מוקפאות 2025-2028</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>מדרגה</TableHead>
                      <TableHead className="text-left">שיעור</TableHead>
                      <TableHead className="text-left">סכום</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {taxResult.brackets.map((b, i) => (
                      <TableRow key={i}>
                        <TableCell>{formatCurrency(b.from)} – {formatCurrency(b.to)}</TableCell>
                        <TableCell>{(b.rate * 100).toFixed(1)}%</TableCell>
                        <TableCell>{formatCurrency(b.taxInBracket)}</TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="font-bold bg-primary/5">
                      <TableCell>סה"כ</TableCell>
                      <TableCell>{(taxResult.effectiveRate * 100).toFixed(2)}%</TableCell>
                      <TableCell>{formatCurrency(taxResult.totalTax)}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {/* Rental Cash Flow Chart */}
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
                      <BarChart data={[
                        { name: 'הכנסה שנתית', value: (input.rental?.expectedMonthlyRent || 0) * 12 * (input.rental?.occupancyRate || 0.95) },
                        { name: 'הוצאות + משכנתא', value: (input.rental?.expectedMonthlyRent || 0) * 12 * (input.rental?.occupancyRate || 0.95) - results.netCashflowAnnual },
                        { name: 'תזרים נקי', value: results.netCashflowAnnual },
                      ]}>
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
                          <TableCell>{formatCurrency((input.rental?.annualPropertyTax || 0) + (input.rental?.annualInsurance || 0) + (input.rental?.annualMaintenance || 0) + (input.rental?.annualManagementFees || 0) + (input.rental?.otherAnnualCosts || 0))}</TableCell>
                          <TableCell>{formatCurrency(((input.rental?.annualPropertyTax || 0) + (input.rental?.annualInsurance || 0) + (input.rental?.annualMaintenance || 0) + (input.rental?.annualManagementFees || 0) + (input.rental?.otherAnnualCosts || 0)) / 12)}</TableCell>
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

          {/* Equity Growth Chart for Rental */}
          {dealType === 'rental' && equityGrowthData.length > 0 && (
            <Card className="border-0 shadow-xl">
              <CardHeader>
                <CardTitle className="text-2xl">גרף צמיחת הון עצמי</CardTitle>
                <CardDescription>חיזוי שווי הנכס, יתרת המשכנתא, והון עצמי נקי לאורך {holdingYears} שנים</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={350}>
                  <LineChart data={equityGrowthData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="year" />
                    <YAxis tickFormatter={(v) => `₪${(v / 1000000).toFixed(1)}M`} />
                    <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                    <Legend />
                    <Line type="monotone" dataKey="שווי נכס" stroke="hsl(var(--secondary))" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="יתרת משכנתא" stroke="hsl(var(--chart-3))" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="הון עצמי נקי" stroke="hsl(var(--chart-1))" strokeWidth={3} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* Flip Chart */}
          {dealType === 'flip' && results.grossProfit !== undefined && (
            <Card className="border-0 shadow-xl">
              <CardHeader>
                <CardTitle className="text-2xl">ניתוח עסקת היפוך</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={[
                    { name: 'עלות כוללת', value: results.totalDealCost },
                    { name: 'מחיר מכירה', value: input.flip?.expectedSalePrice || 0 },
                    { name: 'רווח גולמי', value: results.grossProfit },
                  ]}>
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

          {/* Detailed Results */}
          <Card className="border-0 shadow-xl">
            <CardHeader>
              <CardTitle className="text-3xl">{he.dealBusinessPlan.resultsTitle}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <Card>
                  <CardHeader><CardTitle className="text-sm text-muted-foreground">{he.dealBusinessPlan.totalDealCost}</CardTitle></CardHeader>
                  <CardContent><p className="text-2xl font-bold">{formatCurrency(results.totalDealCost)}</p></CardContent>
                </Card>

                {taxResult && (
                  <Card>
                    <CardHeader><CardTitle className="text-sm text-muted-foreground">מס רכישה</CardTitle></CardHeader>
                    <CardContent><p className="text-2xl font-bold">{formatCurrency(taxResult.totalTax)}</p></CardContent>
                  </Card>
                )}

                {results.netCashflowAnnual !== undefined && (
                  <>
                    <Card>
                      <CardHeader><CardTitle className="text-sm text-muted-foreground">{he.dealBusinessPlan.netCashflowAnnual}</CardTitle></CardHeader>
                      <CardContent>
                        <p className={`text-2xl font-bold ${results.netCashflowAnnual >= 0 ? 'text-[hsl(var(--chart-1))]' : 'text-destructive'}`}>
                          {formatCurrency(results.netCashflowAnnual)}
                        </p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader><CardTitle className="text-sm text-muted-foreground">{he.dealBusinessPlan.cocYield}</CardTitle></CardHeader>
                      <CardContent><p className="text-2xl font-bold text-primary">{formatPercent(results.cocYield || 0)}</p></CardContent>
                    </Card>
                  </>
                )}

                {irrResult !== null && (
                  <Card>
                    <CardHeader><CardTitle className="text-sm text-muted-foreground">IRR (תשואה פנימית)</CardTitle></CardHeader>
                    <CardContent><p className="text-2xl font-bold text-[hsl(var(--chart-1))]">{formatPercent(irrResult)}</p></CardContent>
                  </Card>
                )}

                {results.grossProfit !== undefined && (
                  <>
                    <Card>
                      <CardHeader><CardTitle className="text-sm text-muted-foreground">{he.dealBusinessPlan.grossProfit}</CardTitle></CardHeader>
                      <CardContent>
                        <p className={`text-2xl font-bold ${results.grossProfit >= 0 ? 'text-[hsl(var(--chart-1))]' : 'text-destructive'}`}>
                          {formatCurrency(results.grossProfit)}
                        </p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader><CardTitle className="text-sm text-muted-foreground">{he.dealBusinessPlan.annualizedRoi}</CardTitle></CardHeader>
                      <CardContent><p className="text-2xl font-bold text-primary">{formatPercent(results.annualizedRoi || 0)}</p></CardContent>
                    </Card>
                  </>
                )}

                <Card>
                  <CardHeader><CardTitle className="text-sm text-muted-foreground">{he.dealBusinessPlan.classification}</CardTitle></CardHeader>
                  <CardContent>
                    <Badge variant={classificationVariant(results.classification)} className="text-lg px-3 py-1">
                      {he.dealBusinessPlan.classificationLabels[results.classification as keyof typeof he.dealBusinessPlan.classificationLabels]}
                    </Badge>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
};

export default DealBusinessPlan;
