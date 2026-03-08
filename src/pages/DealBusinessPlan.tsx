import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { calculateDealBusinessPlan } from '@/lib/calculations/deal-business-plan';
import { calculatePurchaseTax, BuyerType } from '@/lib/calculations/purchase-tax';
import { calculateRentalIRR, calculateFlipIRR } from '@/lib/calculations/irr';
import { DealBusinessPlanInput, DealBusinessPlanOutput, DealType, DealOwnUseInputs } from '@/types/deal-business-plan';
import { he } from '@/lib/translations/he';
import { formatCurrency, formatPercent } from '@/lib/validation/validators';
import { StatsCard } from '@/components/StatsCard';
import { SmartInsight, generateDealInsights } from '@/components/SmartInsight';
import { HiddenCostsChecklist } from '@/components/HiddenCostsChecklist';
import { ExecutiveSummary } from '@/components/ExecutiveSummary';
import { FuelGauge } from '@/components/FuelGauge';
import { Building2, Wallet, TrendingUp, Calculator, Loader2, Users, Home } from 'lucide-react';
import { PageHero } from '@/components/PageHero';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, LineChart, Line } from 'recharts';
import { saveCalculation } from '@/lib/storage/calculator-history';
import { useAutoPersist } from '@/hooks/useAutoPersist';
import { toast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';

const DealBusinessPlan = () => {
  const [buyerType, setBuyerType] = useAutoPersist<BuyerType>('deal-buyer-type', 'singleApartment');
  const [holdingYears, setHoldingYears] = useAutoPersist<number>('deal-holding-years', 10);
  const [exitValue, setExitValue] = useAutoPersist<number>('deal-exit-value', 0);
  const [annualAppreciation, setAnnualAppreciation] = useAutoPersist<number>('deal-appreciation', 3);

  const [input, setInput] = useAutoPersist<DealBusinessPlanInput>('deal-inputs', {
    basic: {
      dealType: 'rental',
      purchasePrice: 1500000,
      sideCosts: 0,
      renovationCost: 0,
      holdingPeriodYears: 2,
    },
    financing: {
      equityInvested: 500000,
      mortgageAmount: 1000000,
      mortgageMonthlyPayment: 5000,
    },
    rental: {
      expectedMonthlyRent: 5500,
      occupancyRate: 0.95,
      annualPropertyTax: 3000,
      annualInsurance: 1500,
      annualMaintenance: 4000,
      annualManagementFees: 0,
      otherAnnualCosts: 0,
    },
    flip: {
      expectedSalePrice: 0,
      saleCosts: 0,
    },
    ownUse: {
      alternativeMonthlyRent: 4500,
      monthlyPropertyTax: 250,
      monthlyHoaFees: 400,
      monthlyMaintenance: 300,
    },
  });

  const dealType = input.basic.dealType;
  const setDealType = (value: DealType) => {
    setInput(prev => ({ ...prev, basic: { ...prev.basic, dealType: value } }));
  };

  const [results, setResults] = useState<DealBusinessPlanOutput | null>(null);
  const [irrResult, setIrrResult] = useState<number | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);

  const taxResult = input.basic.purchasePrice > 0
    ? calculatePurchaseTax({ purchasePrice: input.basic.purchasePrice, buyerType })
    : null;

  const handleHiddenCostsChange = (totalCosts: number) => {
    setInput(prev => ({ ...prev, basic: { ...prev.basic, sideCosts: totalCosts } }));
  };

  const handleCalculate = async () => {
    if (input.basic.purchasePrice <= 0) {
      toast({ title: 'שגיאה', description: 'יש להזין מחיר רכישה חיובי', variant: 'destructive' });
      return;
    }
    if (input.financing.equityInvested <= 0) {
      toast({ title: 'שגיאה', description: 'יש להזין הון עצמי חיובי', variant: 'destructive' });
      return;
    }

    setIsCalculating(true);
    await new Promise(resolve => setTimeout(resolve, 400));

    const output = calculateDealBusinessPlan(input);
    setResults(output);

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
      : dealType === 'flip'
      ? `רווח: ${formatCurrency(output.grossProfit || 0)}`
      : `חיסכון חודשי: ${formatCurrency(output.monthlySavings || 0)}`;

    saveCalculation({ type: 'deal', title, result, input });
    toast({ title: "החישוב הושלם בהצלחה", description: "התוצאות נשמרו בהיסטוריה" });
    setIsCalculating(false);

    setTimeout(() => {
      document.getElementById('deal-results')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  const equityGrowthData = results && dealType === 'rental' ? Array.from({ length: holdingYears + 1 }, (_, year) => {
    const propertyValue = input.basic.purchasePrice * Math.pow(1 + annualAppreciation / 100, year);
    let mortgageBalance = 0;
    if (input.financing.mortgageAmount > 0) {
      const P = input.financing.mortgageAmount;
      const annualRate = (input.financing.mortgageInterestRate || 5) / 100;
      const r = annualRate / 12;
      const n = 25 * 12;
      const k = year * 12;
      if (r === 0) {
        mortgageBalance = P * Math.max(0, 1 - k / n);
      } else {
        const factor_n = Math.pow(1 + r, n);
        const factor_k = Math.pow(1 + r, k);
        mortgageBalance = k >= n ? 0 : P * (factor_n - factor_k) / (factor_n - 1);
      }
    }
    return {
      year: `שנה ${year}`,
      'שווי נכס': Math.round(propertyValue),
      'יתרת משכנתא': Math.round(mortgageBalance),
      'הון עצמי נקי': Math.round(propertyValue - mortgageBalance),
    };
  }) : [];

  const equityPercent = results && results.totalDealCost > 0 ? (input.financing.equityInvested / results.totalDealCost) * 100 : 0;

  return (
    <div className="space-y-6 pb-8">
      <PageHero
        icon={<TrendingUp className="w-6 h-6 text-primary" />}
        title={he.dealBusinessPlan.title}
        description={he.dealBusinessPlan.description}
      />

      {/* KPI Cards */}
      {results && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          <StatsCard title={he.dealBusinessPlan.totalDealCost} value={formatCurrency(results.totalDealCost + (taxResult?.totalTax || 0))} icon={Building2} iconColor="navy" />
          <StatsCard title={he.dealBusinessPlan.equityInvested} value={formatCurrency(input.financing.equityInvested)} icon={Wallet} iconColor="orange" />
          {dealType === 'ownUse' ? (
            <>
              <StatsCard
                title="חיסכון חודשי"
                value={formatCurrency(results.monthlySavings || 0)}
                icon={Home}
                iconColor="green"
                status={(results.monthlySavings || 0) > 0 ? 'positive' : 'negative'}
              />
              {results.breakEvenYears != null && (
                <StatsCard title="נקודת איזון" value={`${results.breakEvenYears.toFixed(1)} שנים`} icon={Calculator} iconColor="blue" />
              )}
            </>
          ) : (
            <>
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
                <StatsCard title="IRR (תשואה פנימית)" value={formatPercent(irrResult)} icon={Calculator} iconColor="green" status={irrResult >= 0.10 ? 'positive' : irrResult >= 0.05 ? 'neutral' : 'negative'} />
              )}
            </>
          )}
        </div>
      )}

      {/* Deal Type & Buyer Type */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card className="border shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                <Calculator className="w-5 h-5 text-primary" />
              </div>
              {he.dealBusinessPlan.dealTypeTitle}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>{he.dealBusinessPlan.dealType}</Label>
              <Select value={dealType} onValueChange={(value: DealType) => setDealType(value)}>
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

        <Card className="border shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <div className="w-10 h-10 bg-secondary/10 rounded-xl flex items-center justify-center">
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
        <Card className="border shadow-sm">
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

        <Card className="border shadow-sm">
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
            <div>
              <Label>ריבית משכנתא שנתית (%)</Label>
              <Input type="number" step="0.1" placeholder="למשל 5" value={input.financing.mortgageInterestRate || ''} onChange={(e) => setInput(prev => ({ ...prev, financing: { ...prev.financing, mortgageInterestRate: Number(e.target.value) } }))} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Hidden Costs Checklist */}
      {input.basic.purchasePrice > 0 && (
        <HiddenCostsChecklist purchasePrice={input.basic.purchasePrice} onChange={handleHiddenCostsChange} />
      )}

      {/* Rental Inputs */}
      {dealType === 'rental' && (
        <Card className="border shadow-sm">
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
        <Card className="border shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-lg">
              <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-primary" />
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
        <Card className="border shadow-sm">
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

      {/* Own Use Inputs */}
      {dealType === 'ownUse' && (
        <Card className="border shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                <Home className="w-5 h-5 text-primary" />
              </div>
              מגורים עצמיים — השוואה לשכירות
            </CardTitle>
            <CardDescription>הזן את העלויות החודשיות הצפויות והשכירות החלופית</CardDescription>
          </CardHeader>
          <CardContent className="grid md:grid-cols-2 gap-4 pt-6">
            <div>
              <Label>שכירות חלופית חודשית ({he.common.currency})</Label>
              <Input type="number" placeholder="למשל 4500" value={input.ownUse?.alternativeMonthlyRent || ''} onChange={(e) => setInput(prev => ({ ...prev, ownUse: { ...prev.ownUse!, alternativeMonthlyRent: Number(e.target.value) } }))} />
            </div>
            <div>
              <Label>ארנונה חודשית ({he.common.currency})</Label>
              <Input type="number" placeholder="למשל 250" value={input.ownUse?.monthlyPropertyTax || ''} onChange={(e) => setInput(prev => ({ ...prev, ownUse: { ...prev.ownUse!, monthlyPropertyTax: Number(e.target.value) } }))} />
            </div>
            <div>
              <Label>ועד בית חודשי ({he.common.currency})</Label>
              <Input type="number" placeholder="למשל 400" value={input.ownUse?.monthlyHoaFees || ''} onChange={(e) => setInput(prev => ({ ...prev, ownUse: { ...prev.ownUse!, monthlyHoaFees: Number(e.target.value) } }))} />
            </div>
            <div>
              <Label>תחזוקה חודשית ({he.common.currency})</Label>
              <Input type="number" placeholder="למשל 300" value={input.ownUse?.monthlyMaintenance || ''} onChange={(e) => setInput(prev => ({ ...prev, ownUse: { ...prev.ownUse!, monthlyMaintenance: Number(e.target.value) } }))} />
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex justify-center sticky bottom-20 md:bottom-8 z-10">
        <Button onClick={handleCalculate} size="lg" disabled={isCalculating} className="px-12 py-6 text-lg rounded-full">
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
          {dealType !== 'ownUse' && (
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
          )}

          {/* Own Use Summary */}
          {dealType === 'ownUse' && results.monthlyOwnershipCost != null && (
            <Card className="border shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">השוואת בעלות מול שכירות</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-accent/50 text-center">
                    <p className="text-sm text-muted-foreground mb-1">עלות חודשית בעלות</p>
                    <p className="text-2xl font-bold">{formatCurrency(results.monthlyOwnershipCost)}</p>
                    <p className="text-xs text-muted-foreground mt-1">משכנתא + ארנונה + ועד + תחזוקה</p>
                  </div>
                  <div className="p-4 rounded-xl bg-secondary/10 text-center">
                    <p className="text-sm text-muted-foreground mb-1">שכירות חלופית</p>
                    <p className="text-2xl font-bold">{formatCurrency(results.alternativeMonthlyRent || 0)}</p>
                    <p className="text-xs text-muted-foreground mt-1">עלות חודשית לשוכר</p>
                  </div>
                </div>
                <div className={`p-4 rounded-xl text-center ${(results.monthlySavings || 0) > 0 ? 'bg-primary/5' : 'bg-destructive/5'}`}>
                  <p className="text-sm text-muted-foreground mb-1">
                    {(results.monthlySavings || 0) > 0 ? 'חיסכון חודשי ברכישה' : 'עלות נוספת חודשית ברכישה'}
                  </p>
                  <p className={`text-3xl font-bold ${(results.monthlySavings || 0) > 0 ? 'text-primary' : 'text-destructive'}`}>
                    {formatCurrency(Math.abs(results.monthlySavings || 0))}
                  </p>
                  {results.breakEvenYears != null && (
                    <p className="text-sm text-muted-foreground mt-2">
                      נקודת איזון: <span className="font-bold">{results.breakEvenYears.toFixed(1)} שנים</span> — אחרי תקופה זו הרכישה משתלמת
                    </p>
                  )}
                  {results.breakEvenYears == null && (results.monthlySavings || 0) <= 0 && (
                    <p className="text-sm text-destructive mt-2">
                      הרכישה יקרה יותר מדי חודש — אין נקודת איזון
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

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

          {/* Charts Accordion */}
          <Accordion type="multiple" defaultValue={['charts']}>
            {/* Tax Breakdown */}
            {taxResult && taxResult.totalTax > 0 && (
              <AccordionItem value="tax">
                <AccordionTrigger className="text-lg font-semibold">פירוט מס רכישה</AccordionTrigger>
                <AccordionContent>
                  <Card className="border shadow-sm">
                    <CardContent className="pt-6">
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
                </AccordionContent>
              </AccordionItem>
            )}

            {/* Cash Flow Chart */}
            {dealType === 'rental' && results.netCashflowAnnual !== undefined && (
              <AccordionItem value="charts">
                <AccordionTrigger className="text-lg font-semibold">גרפים מפורטים</AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-6">
                    <Card className="border shadow-sm">
                      <CardHeader>
                        <CardTitle className="text-lg">ניתוח תזרים מזומנים</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <Tabs defaultValue="chart" className="w-full">
                          <TabsList className="grid w-full grid-cols-2 mb-4">
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

                    {/* Equity Growth Chart */}
                    {equityGrowthData.length > 0 && (
                      <Card className="border shadow-sm">
                        <CardHeader>
                          <CardTitle className="text-lg">גרף צמיחת הון עצמי</CardTitle>
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
                  </div>
                </AccordionContent>
              </AccordionItem>
            )}

            {/* Flip Chart */}
            {dealType === 'flip' && results.grossProfit !== undefined && (
              <AccordionItem value="charts">
                <AccordionTrigger className="text-lg font-semibold">ניתוח עסקת היפוך</AccordionTrigger>
                <AccordionContent>
                  <Card className="border shadow-sm">
                    <CardContent className="pt-6">
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
                </AccordionContent>
              </AccordionItem>
            )}
          </Accordion>
        </motion.div>
      )}
    </div>
  );
};

export default DealBusinessPlan;
