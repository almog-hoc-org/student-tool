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
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { motion } from 'framer-motion';
import { saveCalculation } from '@/lib/storage/calculator-history';
import { toast } from '@/hooks/use-toast';

const RenovationFeasibility = () => {
  const [input, setInput] = useState<RenovationInputs>({
    currentValue: 0,
    postRenovationValue: 0,
    renovationBaseCost: 0,
    isForRental: false,
    monthlyRentBefore: 0,
    monthlyRentAfter: 0,
  });

  const [results, setResults] = useState<RenovationOutput | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);

  const handleCalculate = async () => {
    setIsCalculating(true);
    
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const output = calculateRenovationFeasibility(input);
    setResults(output);
    
    // Save to history
    saveCalculation({
      type: 'renovation',
      title: `שיפוץ ${formatCurrency(input.currentValue)}`,
      result: `רווח: ${formatCurrency(output.paperProfit)}`,
      input,
    });
    
    toast({
      title: "החישוב הושלם בהצלחה",
      description: "התוצאות נשמרו בהיסטוריה",
    });

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

      {/* KPI Cards - Show after calculation */}
      {results && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <StatsCard
            title={he.renovationFeasibility.totalRenovationCost}
            value={formatCurrency(results.totalRenovationCost)}
            icon={Hammer}
            iconColor="orange"
          />
          <StatsCard
            title={he.renovationFeasibility.valueUplift}
            value={formatCurrency(results.valueUplift)}
            icon={TrendingUp}
            iconColor="green"
          />
          <StatsCard
            title={he.renovationFeasibility.paperProfit}
            value={formatCurrency(results.paperProfit)}
            icon={DollarSign}
            iconColor={results.paperProfit >= 0 ? 'green' : 'orange'}
          />
          <StatsCard
            title={he.renovationFeasibility.classification}
            value={he.renovationFeasibility.classificationLabels[results.classification as keyof typeof he.renovationFeasibility.classificationLabels]}
            icon={Calculator}
            iconColor="purple"
          />
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        <Card className="border-0 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-background dark:from-blue-950 dark:to-background">
            <CardTitle className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-white" />
              </div>
              {he.renovationFeasibility.inputsTitle}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
          <div>
            <Label>{he.renovationFeasibility.currentValue} ({he.common.currency})</Label>
            <Input
              type="number"
              placeholder="למשל 1200000"
              value={input.currentValue || ''}
              onChange={(e) => setInput({ ...input, currentValue: Number(e.target.value) })}
            />
          </div>
          <div>
            <Label>{he.renovationFeasibility.postRenovationValue} ({he.common.currency})</Label>
            <Input
              type="number"
              placeholder="למשל 1500000"
              value={input.postRenovationValue || ''}
              onChange={(e) => setInput({ ...input, postRenovationValue: Number(e.target.value) })}
            />
          </div>
          <div>
            <Label>{he.renovationFeasibility.renovationBaseCost} ({he.common.currency})</Label>
            <Input
              type="number"
              placeholder="למשל 200000"
              value={input.renovationBaseCost || ''}
              onChange={(e) => setInput({ ...input, renovationBaseCost: Number(e.target.value) })}
            />
              <p className="text-xs text-muted-foreground mt-1">
                נוסיף אוטומטית 15% מרווח ביטחון
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-emerald-50 to-background dark:from-emerald-950 dark:to-background">
            <CardTitle className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              הכנסה משכירות (אופציונלי)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
          <div className="flex items-center gap-2">
            <Switch
              checked={input.isForRental}
              onCheckedChange={(checked) => setInput({ ...input, isForRental: checked })}
            />
            <Label>{he.renovationFeasibility.isForRental}</Label>
          </div>

          {input.isForRental && (
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label>{he.renovationFeasibility.monthlyRentBefore} ({he.common.currency})</Label>
                <Input
                  type="number"
                  placeholder="למשל 4000"
                  value={input.monthlyRentBefore || ''}
                  onChange={(e) => setInput({ ...input, monthlyRentBefore: Number(e.target.value) })}
                />
              </div>
              <div>
                <Label>{he.renovationFeasibility.monthlyRentAfter} ({he.common.currency})</Label>
                <Input
                  type="number"
                  placeholder="למשל 6000"
                  value={input.monthlyRentAfter || ''}
                  onChange={(e) => setInput({ ...input, monthlyRentAfter: Number(e.target.value) })}
                />
              </div>
            </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-center sticky bottom-20 md:bottom-8 z-10">
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
        <motion.div
          id="renovation-results"
          className="space-y-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
        >
          {/* Before/After Chart */}
          <Card className="border-0 shadow-xl">
            <CardHeader>
              <CardTitle className="text-2xl">השוואה: לפני ואחרי שיפוץ</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={[
                    { category: 'ערך נוכחי', value: input.currentValue },
                    { category: 'עלות שיפוץ', value: results.totalRenovationCost },
                    { category: 'ערך לאחר שיפוץ', value: input.postRenovationValue },
                    { category: 'רווח נייר', value: results.paperProfit >= 0 ? results.paperProfit : 0 },
                  ]}
                >
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis dataKey="category" />
                  <YAxis />
                  <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                  <Bar dataKey="value" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-xl bg-gradient-to-br from-primary/5 to-secondary/5">
            <CardHeader>
              <CardTitle className="text-3xl">{he.renovationFeasibility.resultsTitle}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm text-muted-foreground">{he.renovationFeasibility.totalRenovationCost}</CardTitle>
                  <CardDescription>כולל 15% מרווח ביטחון</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">{formatCurrency(results.totalRenovationCost)}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm text-muted-foreground">{he.renovationFeasibility.valueUplift}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-primary">{formatCurrency(results.valueUplift)}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm text-muted-foreground">{he.renovationFeasibility.paperProfit}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className={`text-2xl font-bold ${results.paperProfit >= 0 ? 'text-primary' : 'text-destructive'}`}>
                    {formatCurrency(results.paperProfit)}
                  </p>
                </CardContent>
              </Card>

              {results.rentUpliftYear !== undefined && (
                <>
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm text-muted-foreground">{he.renovationFeasibility.rentUpliftYear}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold text-primary">{formatCurrency(results.rentUpliftYear)}</p>
                    </CardContent>
                  </Card>

                  {results.renovationYield !== undefined && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm text-muted-foreground">{he.renovationFeasibility.renovationYield}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-2xl font-bold text-primary">{formatPercent(results.renovationYield)}</p>
                      </CardContent>
                    </Card>
                  )}
                </>
              )}

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm text-muted-foreground">{he.renovationFeasibility.classification}</CardTitle>
                </CardHeader>
                <CardContent>
                  <Badge
                    variant={classificationVariant(results.classification)}
                    className="text-base px-3 py-1"
                  >
                    {he.renovationFeasibility.classificationLabels[results.classification as keyof typeof he.renovationFeasibility.classificationLabels]}
                  </Badge>
                </CardContent>
              </Card>
              </div>

              <Card className="bg-accent/50 border-0">
                <CardHeader>
                  <CardTitle className="text-xl">המלצה</CardTitle>
                </CardHeader>
                <CardContent className="text-base">
                {results.classification === 'Not Worth It' && (
                  <p className="text-destructive">
                    {he.renovationFeasibility.explanationNotWorth}
                  </p>
                )}
                {results.classification === 'Borderline' && (
                  <p className="text-muted-foreground">
                    {he.renovationFeasibility.explanationBorderline}
                  </p>
                )}
                {results.classification === 'Worth Considering' && (
                  <p className="text-primary">
                    {he.renovationFeasibility.explanationWorthConsidering}
                  </p>
                )}
                {results.classification === 'Very Attractive' && (
                  <p className="text-primary">
                    {he.renovationFeasibility.explanationVeryAttractive}
                  </p>
                )}
                </CardContent>
              </Card>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
};

export default RenovationFeasibility;