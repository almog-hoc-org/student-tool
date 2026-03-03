import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { calculateRenovationFeasibility } from '@/lib/calculations/renovation-feasibility';
import { RenovationInputs, RenovationOutput } from '@/types/renovation-feasibility';
import { he } from '@/lib/translations/he';
import { formatCurrency, formatPercent } from '@/lib/validation/validators';
import { StatsCard } from '@/components/StatsCard';
import { FieldWithTooltip } from '@/components/FieldWithTooltip';
import { AnimatedCard } from '@/components/AnimatedCard';
import { Hammer, TrendingUp, DollarSign, Calculator, Loader2, FileDown } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { saveCalculation } from '@/lib/storage/calculator-history';
import { toast } from '@/hooks/use-toast';
import { useAutoPersist } from '@/hooks/useAutoPersist';
import { exportToPDF } from '@/lib/export/pdf-generator';

const RenovationFeasibility = () => {
  const [input, setInput] = useAutoPersist<RenovationInputs>('renovation-inputs', {
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
  };

  const classificationVariant = (classification: string) => {
    if (classification === 'Very Attractive') return 'default';
    if (classification === 'Worth Considering') return 'secondary';
    return 'destructive';
  };

  return (
    <div className="space-y-6 pb-8">
      <Card className="border-0 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-primary/5 via-background to-secondary/5">
          <CardTitle className="text-3xl font-bold">{he.renovationFeasibility.title}</CardTitle>
          <CardDescription className="text-base">
            {he.renovationFeasibility.description}
          </CardDescription>
        </CardHeader>
      </Card>

      {/* KPI Cards - Show after calculation */}
      {results && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <AnimatedCard delay={0}>
            <StatsCard
              title={he.renovationFeasibility.totalRenovationCost}
              value={formatCurrency(results.totalRenovationCost)}
              icon={Hammer}
              iconColor="orange"
            />
          </AnimatedCard>
          <AnimatedCard delay={0.1}>
            <StatsCard
              title={he.renovationFeasibility.valueUplift}
              value={formatCurrency(results.valueUplift)}
              icon={TrendingUp}
              iconColor="green"
            />
          </AnimatedCard>
          <AnimatedCard delay={0.2}>
            <StatsCard
              title={he.renovationFeasibility.paperProfit}
              value={formatCurrency(results.paperProfit)}
              icon={DollarSign}
              iconColor={results.paperProfit >= 0 ? 'green' : 'orange'}
            />
          </AnimatedCard>
          <AnimatedCard delay={0.3}>
            <StatsCard
              title={he.renovationFeasibility.classification}
              value={he.renovationFeasibility.classificationLabels[results.classification as keyof typeof he.renovationFeasibility.classificationLabels]}
              icon={Calculator}
              iconColor="purple"
            />
          </AnimatedCard>
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
          <FieldWithTooltip
            label={he.renovationFeasibility.currentValue}
            tooltip="מחיר השוק של הנכס לפני שיפוץ, לפי שמאות או עסקאות דומות באזור"
            value={input.currentValue || ''}
            onChange={(v) => setInput({ ...input, currentValue: Number(v) })}
            prefix="₪"
            placeholder="למשל 1,200,000"
          />
          <FieldWithTooltip
            label={he.renovationFeasibility.postRenovationValue}
            tooltip="הערכת שווי הנכס לאחר השיפוץ, לפי נכסים משופצים דומים באזור"
            value={input.postRenovationValue || ''}
            onChange={(v) => setInput({ ...input, postRenovationValue: Number(v) })}
            prefix="₪"
            placeholder="למשל 1,500,000"
          />
          <div>
            <FieldWithTooltip
              label={he.renovationFeasibility.renovationBaseCost}
              tooltip="עלות השיפוץ הבסיסית לפני מרווח ביטחון. נוסיף אוטומטית 15% למקרים בלתי צפויים"
              value={input.renovationBaseCost || ''}
              onChange={(v) => setInput({ ...input, renovationBaseCost: Number(v) })}
              prefix="₪"
              placeholder="למשל 200,000"
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
              <FieldWithTooltip
                label={he.renovationFeasibility.monthlyRentBefore}
                tooltip="שכר הדירה החודשי הנוכחי שהנכס מניב לפני השיפוץ"
                value={input.monthlyRentBefore || ''}
                onChange={(v) => setInput({ ...input, monthlyRentBefore: Number(v) })}
                prefix="₪"
                placeholder="למשל 4,000"
              />
              <FieldWithTooltip
                label={he.renovationFeasibility.monthlyRentAfter}
                tooltip="שכר הדירה הצפוי לאחר השיפוץ, לפי השוואה לנכסים משופצים באזור"
                value={input.monthlyRentAfter || ''}
                onChange={(v) => setInput({ ...input, monthlyRentAfter: Number(v) })}
                prefix="₪"
                placeholder="למשל 6,000"
              />
            </div>
            )}
          </CardContent>
        </Card>
      </div>

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
          {/* Before/After Chart */}
          <Card className="border-0 shadow-xl">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-2xl">השוואה: לפני ואחרי שיפוץ</CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => exportToPDF({
                  title: 'בדיקת כדאיות שיפוץ',
                  subtitle: `שווי נוכחי: ${formatCurrency(input.currentValue)}`,
                  sections: [
                    {
                      title: 'תוצאות',
                      items: [
                        { label: 'שווי נוכחי', value: formatCurrency(input.currentValue) },
                        { label: 'שווי לאחר שיפוץ', value: formatCurrency(input.postRenovationValue) },
                        { label: 'עלות שיפוץ כוללת', value: formatCurrency(results.totalRenovationCost) },
                        { label: 'עליית ערך', value: formatCurrency(results.valueUplift) },
                        { label: 'רווח על הנייר', value: formatCurrency(results.paperProfit) },
                        { label: 'סיווג', value: he.renovationFeasibility.classificationLabels[results.classification as keyof typeof he.renovationFeasibility.classificationLabels] },
                        ...(results.rentUpliftYear !== undefined ? [{ label: 'עליית שכירות שנתית', value: formatCurrency(results.rentUpliftYear) }] : []),
                        ...(results.renovationYield !== undefined ? [{ label: 'תשואת שיפוץ', value: formatPercent(results.renovationYield) }] : []),
                      ],
                    },
                  ],
                  chartElementId: 'renovation-chart',
                })}
              >
                <FileDown className="w-4 h-4 ml-2" />
                ייצוא PDF
              </Button>
            </CardHeader>
            <CardContent>
              <div id="renovation-chart">
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
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-xl bg-gradient-to-br from-primary/5 to-secondary/5">
            <CardHeader>
              <CardTitle className="text-3xl">{he.renovationFeasibility.resultsTitle}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
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
        </div>
      )}
    </div>
  );
};

export default RenovationFeasibility;