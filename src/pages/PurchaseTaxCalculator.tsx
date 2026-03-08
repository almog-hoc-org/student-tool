import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { calculatePurchaseTax, BuyerType, PurchaseTaxOutput } from '@/lib/calculations/purchase-tax';
import { calculateSideCosts, getDefaultSideCostsInput, SideCostsInput, SideCostsOutput } from '@/lib/calculations/side-costs';
import { formatCurrency } from '@/lib/validation/validators';
import { StatsCard } from '@/components/StatsCard';
import { SmartInsight, type Insight } from '@/components/SmartInsight';
import { Calculator, Receipt, Percent, DollarSign, Home, Building2, Globe, Loader2, Check } from 'lucide-react';
import { PageHero } from '@/components/PageHero';
import { motion } from 'framer-motion';
import { Switch } from '@/components/ui/switch';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { saveCalculation } from '@/lib/storage/calculator-history';
import { toast } from '@/hooks/use-toast';

const CHART_COLORS = ['hsl(220 65% 48%)', 'hsl(38 80% 55%)', 'hsl(160 50% 45%)', 'hsl(280 45% 55%)', 'hsl(0 72% 50%)', 'hsl(200 60% 50%)'];

const buyerTypeOptions: { value: BuyerType; label: string; icon: React.ReactNode; description: string }[] = [
  { value: 'singleApartment', label: 'דירה יחידה', icon: <Home className="w-5 h-5" />, description: 'רוכש שאין לו דירה נוספת' },
  { value: 'additionalApartment', label: 'דירה נוספת', icon: <Building2 className="w-5 h-5" />, description: 'משקיע או בעל דירה קיימת' },
  { value: 'foreignResident', label: 'תושב חוץ', icon: <Globe className="w-5 h-5" />, description: 'רוכש שאינו תושב ישראל' },
];

function generateTaxInsights(result: PurchaseTaxOutput, price: number, buyerType: BuyerType): Insight[] {
  const insights: Insight[] = [];

  if (buyerType === 'singleApartment' && price <= 1978745) {
    insights.push({ level: 'success', title: 'פטור מלא ממס רכישה!', message: 'מחיר הדירה נמוך מהמדרגה הראשונה – אתה פטור לחלוטין ממס רכישה.' });
  }

  if (buyerType === 'additionalApartment') {
    insights.push({ level: 'warning', title: 'מס רכישה מוגבר', message: 'כדירה נוספת, המס מתחיל מ-8% כבר מהשקל הראשון. שקול אם ניתן למכור דירה קיימת תוך 18 חודש לקבל החזר.' });
  }

  if (buyerType === 'foreignResident') {
    insights.push({ level: 'danger', title: 'תוספת מס לתושב חוץ', message: 'תושבי חוץ משלמים תוספת 2% על כל מדרגות המס. זה עלול להגיע לעשרות אלפי שקלים נוספים.' });
  }

  if (result.effectiveRate > 0.06) {
    insights.push({ level: 'warning', title: `שיעור מס אפקטיבי גבוה: ${(result.effectiveRate * 100).toFixed(1)}%`, message: 'השיעור האפקטיבי גבוה. וודא שהכנסת סכום זה בתוכנית העסקית שלך.' });
  }

  if (result.totalTax > 100000) {
    insights.push({ level: 'tip', title: `מס רכישה: ${formatCurrency(result.totalTax)}`, message: 'זהו סכום משמעותי – אל תשכח לכלול אותו בתכנון ההון העצמי שלך.' });
  }

  return insights;
}

export default function PurchaseTaxCalculator() {
  const [purchasePrice, setPurchasePrice] = useState<number>(2000000);
  const [buyerType, setBuyerType] = useState<BuyerType>('singleApartment');
  const [taxResult, setTaxResult] = useState<PurchaseTaxOutput | null>(null);
  const [sideCostsResult, setSideCostsResult] = useState<SideCostsOutput | null>(null);
  const [sideCostsInput, setSideCostsInput] = useState<SideCostsInput>(getDefaultSideCostsInput(2000000));
  const [isCalculating, setIsCalculating] = useState(false);

  const handleCalculate = async () => {
    setIsCalculating(true);
    await new Promise(resolve => setTimeout(resolve, 400));

    const tax = calculatePurchaseTax({ purchasePrice, buyerType });
    setTaxResult(tax);

    const updatedSideCosts = { ...sideCostsInput, purchasePrice };
    setSideCostsInput(updatedSideCosts);
    const costs = calculateSideCosts(updatedSideCosts);
    setSideCostsResult(costs);

    saveCalculation({
      type: 'deal',
      title: `מס רכישה – ${formatCurrency(purchasePrice)}`,
      result: `מס: ${formatCurrency(tax.totalTax)} (${(tax.effectiveRate * 100).toFixed(1)}%)`,
      input: { purchasePrice, buyerType },
    });

    toast({ title: 'החישוב הושלם', description: 'מס רכישה ועלויות נלוות חושבו בהצלחה' });
    setIsCalculating(false);

    setTimeout(() => {
      document.getElementById('tax-results')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  const totalCosts = (taxResult?.totalTax ?? 0) + (sideCostsResult?.totalSideCosts ?? 0);

  const pieData = sideCostsResult && taxResult ? [
    { name: 'מס רכישה', value: taxResult.totalTax },
    ...sideCostsResult.items.map(item => ({ name: item.name, value: item.amount })),
  ] : [];

  return (
    <div className="space-y-6 pb-8">
      <PageHero
        icon={<Receipt className="w-6 h-6 text-primary" />}
        title="מחשבון מס רכישה ועלויות נלוות"
        description="קבלו תוצאה מיידית! חשבו את מס הרכישה לפי מדרגות המס העדכניות ביותר וגלו בדיוק כמה תשלמו על כל העלויות הנלוות לעסקה"
        badge="מדרגות 2025–2028"
      />

      {/* KPI Cards */}
      {taxResult && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          <StatsCard title="מס רכישה" value={formatCurrency(taxResult.totalTax)} icon={Receipt} iconColor="orange" />
          <StatsCard title="שיעור אפקטיבי" value={`${(taxResult.effectiveRate * 100).toFixed(2)}%`} icon={Percent} iconColor="blue" />
          <StatsCard title="עלויות נלוות" value={formatCurrency(sideCostsResult?.totalSideCosts ?? 0)} icon={DollarSign} iconColor="purple" />
          <StatsCard title="סה״כ עלויות" value={formatCurrency(totalCosts)} icon={Calculator} iconColor="green" />
        </div>
      )}

      {/* Buyer Type Selection */}
      <Card className="border shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">סוג הרוכש</CardTitle>
          <CardDescription>בחר את סוג הרוכש – המדרגות משתנות בהתאם</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid sm:grid-cols-3 gap-3">
            {buyerTypeOptions.map(option => (
              <button
                key={option.value}
                onClick={() => setBuyerType(option.value)}
                className={`p-4 rounded-xl border-2 text-right transition-all duration-200 ${
                  buyerType === option.value
                    ? 'border-primary bg-primary/5 shadow-sm'
                    : 'border-border hover:border-primary/30'
                }`}
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <div className={`${buyerType === option.value ? 'text-primary' : 'text-muted-foreground'}`}>
                    {option.icon}
                  </div>
                  <span className="font-medium text-sm">{option.label}</span>
                  {buyerType === option.value && <Check className="w-4 h-4 text-primary mr-auto" />}
                </div>
                <p className="text-xs text-muted-foreground">{option.description}</p>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Purchase Price */}
      <Card className="border shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">מחיר הנכס</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>מחיר רכישה (₪)</Label>
            <Input
              type="number"
              value={purchasePrice || ''}
              onChange={(e) => setPurchasePrice(Number(e.target.value))}
              placeholder="למשל 2,000,000"
              className="w-full sm:max-w-sm"
            />
          </div>
        </CardContent>
      </Card>

      {/* Side Costs Settings */}
      <Card className="border shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">עלויות נלוות</CardTitle>
          <CardDescription>התאם את העלויות הנלוות לעסקה שלך</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label>עמלת עורך דין (%)</Label>
              <Input type="number" step="0.1" value={sideCostsInput.lawyerPercent} onChange={(e) => setSideCostsInput(prev => ({ ...prev, lawyerPercent: Number(e.target.value) }))} className="max-w-[120px]" />
            </div>
            <div className="flex items-center justify-between">
              <Label>כולל תיווך?</Label>
              <Switch checked={sideCostsInput.includeBroker} onCheckedChange={(v) => setSideCostsInput(prev => ({ ...prev, includeBroker: v }))} />
            </div>
            {sideCostsInput.includeBroker && (
              <div>
                <Label>עמלת תיווך (%)</Label>
                <Input type="number" step="0.1" value={sideCostsInput.brokerPercent} onChange={(e) => setSideCostsInput(prev => ({ ...prev, brokerPercent: Number(e.target.value) }))} className="max-w-[120px]" />
              </div>
            )}
            <div className="flex items-center justify-between">
              <Label>שמאי מקרקעין</Label>
              <Switch checked={sideCostsInput.includeAppraisal} onCheckedChange={(v) => setSideCostsInput(prev => ({ ...prev, includeAppraisal: v }))} />
            </div>
            <div className="flex items-center justify-between">
              <Label>בדק בית</Label>
              <Switch checked={sideCostsInput.includeInspection} onCheckedChange={(v) => setSideCostsInput(prev => ({ ...prev, includeInspection: v }))} />
            </div>
            <div className="flex items-center justify-between">
              <Label>ריהוט ראשוני</Label>
              <Switch checked={sideCostsInput.includeInitialFurnishing} onCheckedChange={(v) => setSideCostsInput(prev => ({ ...prev, includeInitialFurnishing: v }))} />
            </div>
            {sideCostsInput.includeInitialFurnishing && (
              <div>
                <Label>תקציב ריהוט (₪)</Label>
                <Input type="number" value={sideCostsInput.furnishingBudget} onChange={(e) => setSideCostsInput(prev => ({ ...prev, furnishingBudget: Number(e.target.value) }))} className="max-w-[160px]" />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Calculate Button */}
      <div className="flex justify-center sticky bottom-20 md:bottom-8 z-10">
        <Button onClick={handleCalculate} size="lg" disabled={isCalculating || purchasePrice <= 0} className="px-10 py-5 text-base shadow-lg rounded-full">
          {isCalculating ? (<><Loader2 className="ml-2 h-5 w-5 animate-spin" />מחשב...</>) : (<><Calculator className="ml-2 h-5 w-5" />חשב מס ועלויות</>)}
        </Button>
      </div>

      {/* Results */}
      {taxResult && (
        <motion.div
          id="tax-results"
          className="space-y-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
        >
          {/* Smart Insights */}
          <SmartInsight insights={generateTaxInsights(taxResult, purchasePrice, buyerType)} />

          {/* Tax Brackets Table */}
          <Card className="border shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">פירוט מדרגות מס רכישה</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>מדרגה</TableHead>
                    <TableHead className="text-left">שיעור</TableHead>
                    <TableHead className="text-left">סכום במדרגה</TableHead>
                    <TableHead className="text-left">מס במדרגה</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {taxResult.brackets.map((bracket, i) => (
                    <TableRow key={i}>
                      <TableCell className="text-sm">{formatCurrency(bracket.from)} – {formatCurrency(bracket.to)}</TableCell>
                      <TableCell><Badge variant="outline">{(bracket.rate * 100).toFixed(1)}%</Badge></TableCell>
                      <TableCell>{formatCurrency(bracket.to - bracket.from)}</TableCell>
                      <TableCell className="font-medium">{formatCurrency(bracket.taxInBracket)}</TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="font-bold bg-primary/5">
                    <TableCell>סה״כ</TableCell>
                    <TableCell><Badge>{(taxResult.effectiveRate * 100).toFixed(2)}%</Badge></TableCell>
                    <TableCell>{formatCurrency(purchasePrice)}</TableCell>
                    <TableCell>{formatCurrency(taxResult.totalTax)}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Side Costs Breakdown */}
          {sideCostsResult && (
            <Card className="border shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">פירוט עלויות נלוות</CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="chart">
                  <TabsList className="grid w-full grid-cols-2 mb-4">
                    <TabsTrigger value="chart">גרף</TabsTrigger>
                    <TabsTrigger value="table">טבלה</TabsTrigger>
                  </TabsList>
                  <TabsContent value="chart">
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie data={pieData} cx="50%" cy="50%" innerRadius={70} outerRadius={110} paddingAngle={3} dataKey="value">
                          {pieData.map((_, index) => (<Cell key={index} fill={CHART_COLORS[index % CHART_COLORS.length]} />))}
                        </Pie>
                        <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </TabsContent>
                  <TabsContent value="table">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>פריט</TableHead>
                          <TableHead className="text-left">סכום</TableHead>
                          <TableHead className="text-left">הערות</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        <TableRow>
                          <TableCell className="font-medium">מס רכישה</TableCell>
                          <TableCell>{formatCurrency(taxResult.totalTax)}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">{(taxResult.effectiveRate * 100).toFixed(2)}% אפקטיבי</TableCell>
                        </TableRow>
                        {sideCostsResult.items.map((item, i) => (
                          <TableRow key={i}>
                            <TableCell className="font-medium">{item.name}</TableCell>
                            <TableCell>{formatCurrency(item.amount)}</TableCell>
                            <TableCell className="text-sm text-muted-foreground">{item.description}</TableCell>
                          </TableRow>
                        ))}
                        <TableRow className="font-bold bg-primary/5">
                          <TableCell>סה״כ עלויות</TableCell>
                          <TableCell>{formatCurrency(totalCosts)}</TableCell>
                          <TableCell className="text-sm">{((totalCosts / purchasePrice) * 100).toFixed(1)}% ממחיר הנכס</TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          )}
        </motion.div>
      )}
    </div>
  );
}
