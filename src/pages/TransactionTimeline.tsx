import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { calculateTransactionCosts } from '@/lib/calculations/transaction-timeline';
import { TransactionCostCalculatorOutput } from '@/types/timelines';
import { Clock, DollarSign, Calculator, Wallet, Loader2 } from 'lucide-react';
import { he } from '@/lib/translations/he';
import { formatCurrency } from '@/lib/validation/validators';
import { StatsCard } from '@/components/StatsCard';
import { saveCalculation } from '@/lib/storage/calculator-history';
import { toast } from '@/hooks/use-toast';

const TransactionTimeline = () => {
  const [purchasePrice, setPurchasePrice] = useState<number>(1800000);
  const [sideCostsPercent, setSideCostsPercent] = useState<number>(7);
  const [results, setResults] = useState<TransactionCostCalculatorOutput | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);

  const handleCalculate = async () => {
    setIsCalculating(true);
    
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const output = calculateTransactionCosts({
      purchasePrice,
      sideCostsPercent,
    });
    setResults(output);
    
    // Save to history
    saveCalculation({
      type: 'transaction-timeline',
      title: `ציר זמן לעסקה - ${formatCurrency(purchasePrice)}`,
      result: `עלות כוללת: ${formatCurrency(output.totalCost)}`,
      input: { purchasePrice, sideCostsPercent },
    });
    
    toast({
      title: "החישוב הושלם בהצלחה",
      description: "התוצאות נשמרו בהיסטוריה",
    });
    
    setIsCalculating(false);
  };

  return (
    <div className="space-y-6 pb-8">
      <Card className="border-0 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-primary/5 via-background to-secondary/5">
          <CardTitle className="text-3xl font-bold">{he.transactionTimeline.title}</CardTitle>
          <CardDescription className="text-base">
            {he.transactionTimeline.description}
          </CardDescription>
        </CardHeader>
      </Card>

      {/* KPI Cards - Show after calculation */}
      {results && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 animate-in slide-in-from-bottom duration-500">
          <StatsCard
            title={he.transactionTimeline.purchasePrice}
            value={formatCurrency(purchasePrice)}
            icon={DollarSign}
            iconColor="blue"
          />
          <StatsCard
            title={he.transactionTimeline.estimatedSideCosts}
            value={formatCurrency(results.estimatedSideCosts)}
            icon={Wallet}
            iconColor="orange"
          />
          <StatsCard
            title={he.transactionTimeline.totalCost}
            value={formatCurrency(results.totalCost)}
            icon={Calculator}
            iconColor="green"
          />
        </div>
      )}

      <Card className="bg-gradient-to-r from-primary/10 to-secondary/10 border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-xl">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
              <Clock className="h-5 w-5 text-primary-foreground" />
            </div>
            ציר זמן כולל טיפוסי
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold text-primary mb-2">3-6 חודשים</p>
          <p className="text-base text-muted-foreground">
            מתחילת החיפוש ועד קבלת המפתחות. משך הזמן משתנה בהתאם למורכבות המימון, סוג הנכס ותנאי השוק.
          </p>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <h3 className="text-2xl font-bold">שלבי העסקה</h3>
        <Accordion type="single" collapsible defaultValue="step-1" className="space-y-3">
          {he.transactionTimeline.steps.map((step, index) => {
            const stepColors = ['from-blue-50', 'from-emerald-50', 'from-orange-50', 'from-purple-50', 'from-pink-50', 'from-indigo-50'];
            return (
              <AccordionItem key={index} value={`step-${index + 1}`} className="border-0 shadow-md rounded-lg overflow-hidden">
                <AccordionTrigger className={`hover:no-underline bg-gradient-to-r ${stepColors[index % 6]} to-background dark:${stepColors[index % 6].replace('50', '950')} dark:to-background px-6`}>
                  <div className="flex items-center gap-4 text-right w-full">
                    <Badge variant="outline" className="shrink-0 text-base px-3 py-1">
                      {index + 1}
                    </Badge>
                    <div className="flex-1">
                      <p className="font-bold text-lg">{step.name}</p>
                      <p className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
                        <Clock className="h-3 w-3" />
                        {step.timing}
                      </p>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-6">
                  <div className="pt-4 space-y-4">
                    <p className="text-base leading-relaxed">{step.description}</p>

                    <div className="p-4 bg-primary/5 rounded-lg">
                      <h4 className="font-semibold flex items-center gap-2 mb-2 text-base">
                        <DollarSign className="h-5 w-5 text-primary" />
                        עלויות טיפוסיות
                      </h4>
                      <p className="text-sm text-muted-foreground">{step.costs}</p>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      </div>

      {/* Cost Calculator */}
      <Card className="border">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-2xl">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
              <Calculator className="h-5 w-5 text-primary-foreground" />
            </div>
            {he.transactionTimeline.costCalculatorTitle}
          </CardTitle>
          <CardDescription className="text-base">
            הערך את סך העלויות הנלוות לרכישת נכס (מיסים, משפטי, מתווך וכו')
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label>{he.transactionTimeline.purchasePrice} ({he.common.currency})</Label>
              <Input
                type="number"
                placeholder="למשל 1500000"
                value={purchasePrice || ''}
                onChange={(e) => setPurchasePrice(Number(e.target.value))}
              />
            </div>
            <div>
              <Label>{he.transactionTimeline.sideCostsPercent}</Label>
              <Input
                type="number"
                step="0.5"
                placeholder="למשל 7"
                value={sideCostsPercent}
                onChange={(e) => setSideCostsPercent(Number(e.target.value))}
              />
              <p className="text-xs text-muted-foreground mt-1">
                טווח טיפוסי: 6-10% (כולל מיסים, משפטי, מתווך, שמאי וכו')
              </p>
            </div>
          </div>

          <div className="flex justify-center">
            <Button onClick={handleCalculate} size="lg" disabled={isCalculating} className="px-12 py-6 text-lg shadow-xl rounded-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70">
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
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-r from-accent/50 to-accent/30 border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl">טיפים חשובים</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-base">
          <p>
            • תמיד תקצב עלויות נלוות (6-10% ממחיר הרכישה) בנוסף למחיר הרכישה וההון העצמי.
          </p>
          <p>
            • אל תדלג על בדיקות נאותות מקצועיות - שכור עורך דין נדל"ן מוסמך ובודק נכסים.
          </p>
          <p>• קבל אישור עקרוני למשכנתא לפני הגשת הצעות כדי לחזק את כוח המיקוח שלך.</p>
          <p>
            • שמור מרווח לעלויות בלתי צפויות ועיכובים - עסקאות לעולם לא הולכות בדיוק כמו שתכננו.
          </p>
          <p>• קח בחשבון עלויות לאחר רכישה כמו שיפוצים, ריהוט, ארנונה ודמי ועד בית.</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default TransactionTimeline;