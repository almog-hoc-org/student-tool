import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { calculateRenovationFeasibility } from '@/lib/calculations/renovation-feasibility';
import { RenovationInputs, RenovationOutput } from '@/types/renovation-feasibility';
import { he } from '@/lib/translations/he';
import { formatCurrency, formatPercent } from '@/lib/validation/validators';
import { StatsCard } from '@/components/StatsCard';
import { Hammer, TrendingUp, DollarSign, Calculator, Loader2 } from 'lucide-react';
import { PageHero } from '@/components/PageHero';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { motion } from 'framer-motion';
import { saveCalculation } from '@/lib/storage/calculator-history';
import { toast } from '@/hooks/use-toast';

const RenovationFeasibility = () => {
  const [input, setInput] = useState<RenovationInputs>({
    currentValue: 1200000,
    postRenovationValue: 1500000,
    renovationBaseCost: 200000,
    isForRental: false,
    monthlyRentBefore: 4000,
    monthlyRentAfter: 6000,
  });

  const [results, setResults] = useState<RenovationOutput | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);

  const handleCalculate = async () => {
    if (input.currentValue <= 0 || input.renovationBaseCost <= 0) {
      toast({ title: 'שגיאה', description: 'יש להזין ערך נוכחי ועלות שיפוץ חיובית', variant: 'destructive' });
      return;
    }
    setIsCalculating(true);
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const output = calculateRenovationFeasibility(input);
    setResults(output);
    
    saveCalculation({
      type: 'renovation',
      title: `שיפוץ ${formatCurrency(input.currentValue)}`,
      result: `רווח: ${formatCurrency(output.paperProfit)}`,
      input,
    });
    
    toast({ title: "החישוב הושלם בהצלחה", description: "התוצאות נשמרו בהיסטוריה" });
    setIsCalculating(false);

    setTimeout(() => {
      document.getElementById('renovation-results')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  const classificationVariant = (classification: string) => {
    if (classification === 'Very Attractive') return 'default';
    if (classification === 'Worth Considering') return 'secondary';
    return 'destructive';
  };

  return (
    <div className="space-y-6 pb-8">
      <PageHero
        icon={<Hammer className="w-6 h-6 text-primary" />}
        title={he.renovationFeasibility.title}
        description={he.renovationFeasibility.description}
      />

      {/* KPI Cards */}
      {results && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          <StatsCard title={he.renovationFeasibility.totalRenovationCost} value={formatCurrency(results.totalRenovationCost)} icon={Hammer} iconColor="orange" />
          <StatsCard title={he.renovationFeasibility.valueUplift} value={formatCurrency(results.valueUplift)} icon={TrendingUp} iconColor="green" />
          <StatsCard title={he.renovationFeasibility.paperProfit} value={formatCurrency(results.paperProfit)} icon={DollarSign} iconColor={results.paperProfit >= 0 ? 'green' : 'orange'} />
          <StatsCard
            title={he.renovationFeasibility.classification}
            value={he.renovationFeasibility.classificationLabels[results.classification as keyof typeof he.renovationFeasibility.classificationLabels]}
            icon={Calculator}
            iconColor="purple"
          />
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        <Card className="border shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-primary" />
              </div>
              {he.renovationFeasibility.inputsTitle}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            <div>
              <Label>{he.renovationFeasibility.currentValue} ({he.common.currency})</Label>
              <Input type="number" placeholder="למשל 1200000" value={input.currentValue || ''} onChange={(e) => setInput({ ...input, currentValue: Number(e.target.value) })} />
            </div>
            <div>
              <Label>{he.renovationFeasibility.postRenovationValue} ({he.common.currency})</Label>
              <Input type="number" placeholder="למשל 1500000" value={input.postRenovationValue || ''} onChange={(e) => setInput({ ...input, postRenovationValue: Number(e.target.value) })} />
            </div>
            <div>
              <Label>{he.renovationFeasibility.renovationBaseCost} ({he.common.currency})</Label>
              <Input type="number" placeholder="למשל 200000" value={input.renovationBaseCost || ''} onChange={(e) => setInput({ ...input, renovationBaseCost: Number(e.target.value) })} />
              <p className="text-xs text-muted-foreground mt-1">נוסיף אוטומטית 15% מרווח ביטחון</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-primary" />
              </div>
              הכנסה משכירות (אופציונלי)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            <div className="flex items-center gap-2">
              <Switch checked={input.isForRental} onCheckedChange={(checked) => setInput({ ...input, isForRental: checked })} />
              <Label>{he.renovationFeasibility.isForRental}</Label>
            </div>

            {input.isForRental && (
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label>{he.renovationFeasibility.monthlyRentBefore} ({he.common.currency})</Label>
                  <Input type="number" placeholder="למשל 4000" value={input.monthlyRentBefore || ''} onChange={(e) => setInput({ ...input, monthlyRentBefore: Number(e.target.value) })} />
                </div>
                <div>
                  <Label>{he.renovationFeasibility.monthlyRentAfter} ({he.common.currency})</Label>
                  <Input type="number" placeholder="למשל 6000" value={input.monthlyRentAfter || ''} onChange={(e) => setInput({ ...input, monthlyRentAfter: Number(e.target.value) })} />
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-center sticky bottom-20 md:bottom-8 z-10">
        <Button onClick={handleCalculate} size="lg" disabled={isCalculating} className="px-12 py-6 text-lg rounded-full">
          {isCalculating ? (<><Loader2 className="ml-2 h-5 w-5 animate-spin" />מחשב...</>) : (<><Calculator className="ml-2 h-5 w-5" />{he.common.calculate}</>)}
        </Button>
      </div>

      {/* Results */}
      {results && (
        <motion.div
          id="renovation-results"
          className="space-y-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
        >
          {/* Before/After Chart */}
          <Card className="border shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">השוואה: לפני ואחרי שיפוץ</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={[
                  { category: 'ערך נוכחי', value: input.currentValue },
                  { category: 'עלות שיפוץ', value: results.totalRenovationCost },
                  { category: 'ערך לאחר שיפוץ', value: input.postRenovationValue },
                  { category: 'רווח נייר', value: results.paperProfit >= 0 ? results.paperProfit : 0 },
                ]}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis dataKey="category" />
                  <YAxis />
                  <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                  <Bar dataKey="value" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Summary card */}
          <Card className="border shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">סיכום והמלצה</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div className="p-3 rounded-lg bg-accent/50">
                  <p className="text-xs text-muted-foreground">{he.renovationFeasibility.totalRenovationCost}</p>
                  <p className="text-lg font-bold">{formatCurrency(results.totalRenovationCost)}</p>
                  <p className="text-xs text-muted-foreground">כולל 15% מרווח ביטחון</p>
                </div>
                <div className="p-3 rounded-lg bg-accent/50">
                  <p className="text-xs text-muted-foreground">{he.renovationFeasibility.valueUplift}</p>
                  <p className="text-lg font-bold">{formatCurrency(results.valueUplift)}</p>
                </div>
                <div className="p-3 rounded-lg bg-accent/50">
                  <p className="text-xs text-muted-foreground">{he.renovationFeasibility.paperProfit}</p>
                  <p className={`text-lg font-bold ${results.paperProfit >= 0 ? '' : 'text-destructive'}`}>{formatCurrency(results.paperProfit)}</p>
                </div>
                {results.rentUpliftYear !== undefined && (
                  <div className="p-3 rounded-lg bg-accent/50">
                    <p className="text-xs text-muted-foreground">{he.renovationFeasibility.rentUpliftYear}</p>
                    <p className="text-lg font-bold">{formatCurrency(results.rentUpliftYear)}</p>
                  </div>
                )}
                {results.renovationYield !== undefined && (
                  <div className="p-3 rounded-lg bg-accent/50">
                    <p className="text-xs text-muted-foreground">{he.renovationFeasibility.renovationYield}</p>
                    <p className="text-lg font-bold">{formatPercent(results.renovationYield)}</p>
                  </div>
                )}
                <div className="p-3 rounded-lg bg-accent/50">
                  <p className="text-xs text-muted-foreground">{he.renovationFeasibility.classification}</p>
                  <Badge variant={classificationVariant(results.classification)} className="text-sm mt-1">
                    {he.renovationFeasibility.classificationLabels[results.classification as keyof typeof he.renovationFeasibility.classificationLabels]}
                  </Badge>
                </div>
              </div>

              <div className="p-4 rounded-lg bg-accent/30 border border-border/50">
                {results.classification === 'Not Worth It' && <p className="text-destructive text-sm">{he.renovationFeasibility.explanationNotWorth}</p>}
                {results.classification === 'Borderline' && <p className="text-muted-foreground text-sm">{he.renovationFeasibility.explanationBorderline}</p>}
                {results.classification === 'Worth Considering' && <p className="text-primary text-sm">{he.renovationFeasibility.explanationWorthConsidering}</p>}
                {results.classification === 'Very Attractive' && <p className="text-primary text-sm">{he.renovationFeasibility.explanationVeryAttractive}</p>}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
};

export default RenovationFeasibility;
