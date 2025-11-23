import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { calculateTransactionCosts } from '@/lib/calculations/transaction-timeline';
import { TransactionCostCalculatorOutput } from '@/types/timelines';
import { Clock, DollarSign } from 'lucide-react';
import { he } from '@/lib/translations/he';
import { formatCurrency } from '@/lib/validation/validators';

const TransactionTimeline = () => {
  const [purchasePrice, setPurchasePrice] = useState<number>(0);
  const [sideCostsPercent, setSideCostsPercent] = useState<number>(7);
  const [results, setResults] = useState<TransactionCostCalculatorOutput | null>(null);

  const handleCalculate = () => {
    const output = calculateTransactionCosts({
      purchasePrice,
      sideCostsPercent,
    });
    setResults(output);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">{he.transactionTimeline.title}</CardTitle>
          <CardDescription>
            {he.transactionTimeline.description}
          </CardDescription>
        </CardHeader>
      </Card>

      <Card className="bg-accent">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            ציר זמן כולל טיפוסי
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-lg font-semibold text-primary">3-6 חודשים</p>
          <p className="text-sm text-muted-foreground mt-1">
            מתחילת החיפוש ועד קבלת המפתחות. משך הזמן משתנה בהתאם למורכבות המימון, סוג הנכס ותנאי השוק.
          </p>
        </CardContent>
      </Card>

      <div className="space-y-2">
        <h3 className="text-xl font-semibold">שלבי העסקה</h3>
        <Accordion type="single" collapsible defaultValue="step-1">
          {he.transactionTimeline.steps.map((step, index) => (
            <AccordionItem key={index} value={`step-${index + 1}`}>
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center gap-4 text-right w-full">
                  <Badge variant="outline" className="shrink-0">
                    שלב {index + 1}
                  </Badge>
                  <div className="flex-1">
                    <p className="font-semibold">{step.name}</p>
                    <p className="text-sm text-muted-foreground">{step.timing}</p>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="pt-4 space-y-4">
                  <p className="text-sm">{step.description}</p>

                  <div>
                    <h4 className="font-semibold flex items-center gap-2 mb-2">
                      <DollarSign className="h-4 w-4 text-primary" />
                      עלויות טיפוסיות
                    </h4>
                    <p className="text-sm text-muted-foreground">{step.costs}</p>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>

      {/* Cost Calculator */}
      <Card className="border-primary">
        <CardHeader>
          <CardTitle>{he.transactionTimeline.costCalculatorTitle}</CardTitle>
          <CardDescription>
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
            <Button onClick={handleCalculate} className="px-8">
              {he.common.calculate}
            </Button>
          </div>

          {results && (
            <div className="grid md:grid-cols-2 gap-4 pt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm text-muted-foreground">{he.transactionTimeline.estimatedSideCosts}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-primary">{formatCurrency(results.estimatedSideCosts)}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm text-muted-foreground">{he.transactionTimeline.totalCost}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">{formatCurrency(results.totalCost)}</p>
                </CardContent>
              </Card>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="bg-accent">
        <CardHeader>
          <CardTitle>טיפים חשובים</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
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