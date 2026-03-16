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
import { PageHero } from '@/components/PageHero';
import { InteractiveChecklist } from '@/components/InteractiveChecklist';
import { checklists } from '@/lib/data/checklists';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { motion } from 'framer-motion';

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
      <PageHero
        icon={<Clock className="h-5 w-5 text-primary" />}
        title={he.transactionTimeline.title}
        description={he.transactionTimeline.description}
      />

      {/* KPI Cards */}
      {results && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4"
        >
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
        </motion.div>
      )}

      {/* Interactive Checklists */}
      <div className="space-y-3">
        <h3 className="text-base font-semibold">צ'קליסטים</h3>
        <Tabs defaultValue={checklists[0].id}>
          <TabsList className="grid w-full grid-cols-3 h-auto">
            {checklists.map((cl) => (
              <TabsTrigger key={cl.id} value={cl.id} className="text-xs py-2 px-1">
                {cl.title}
              </TabsTrigger>
            ))}
          </TabsList>
          {checklists.map((cl) => (
            <TabsContent key={cl.id} value={cl.id}>
              <InteractiveChecklist checklist={cl} />
            </TabsContent>
          ))}
        </Tabs>
      </div>

      <Card className="border shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-lg">
            <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
              <Clock className="h-4 w-4 text-primary" />
            </div>
            ציר זמן כולל טיפוסי
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold text-primary mb-2">3-6 חודשים</p>
          <p className="text-sm text-muted-foreground">
            מתחילת החיפוש ועד קבלת המפתחות. משך הזמן משתנה בהתאם למורכבות המימון, סוג הנכס ותנאי השוק.
          </p>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <h3 className="text-lg font-bold">שלבי העסקה</h3>
        <Accordion type="single" collapsible defaultValue="step-1" className="space-y-3">
          {he.transactionTimeline.steps.map((step, index) => (
            <AccordionItem key={index} value={`step-${index + 1}`} className="border shadow-sm rounded-lg overflow-hidden">
              <AccordionTrigger className="hover:no-underline bg-accent/30 px-4 sm:px-6">
                <div className="flex items-center gap-4 text-right w-full">
                  <Badge variant="outline" className="shrink-0 text-sm px-2.5 py-0.5">
                    {index + 1}
                  </Badge>
                  <div className="flex-1">
                    <p className="font-semibold text-base">{step.name}</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
                      <Clock className="h-3 w-3" />
                      {step.timing}
                    </p>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 sm:px-6">
                <div className="pt-4 space-y-4">
                  <p className="text-sm leading-relaxed">{step.description}</p>
                  <div className="p-3 bg-accent/50 rounded-lg border border-border">
                    <h4 className="font-semibold flex items-center gap-2 mb-1.5 text-sm">
                      <DollarSign className="h-4 w-4 text-primary" />
                      עלויות טיפוסיות
                    </h4>
                    <p className="text-xs text-muted-foreground">{step.costs}</p>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>

      {/* Cost Calculator */}
      <Card className="border shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-lg">
            <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
              <Calculator className="h-4 w-4 text-primary" />
            </div>
            {he.transactionTimeline.costCalculatorTitle}
          </CardTitle>
          <CardDescription className="text-sm">
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
            <Button onClick={handleCalculate} size="lg" disabled={isCalculating}>
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

      <Card className="border shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">טיפים חשובים</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>• תמיד תקצב עלויות נלוות (6-10% ממחיר הרכישה) בנוסף למחיר הרכישה וההון העצמי.</p>
          <p>• אל תדלג על בדיקות נאותות מקצועיות - שכור עורך דין נדל"ן מוסמך ובודק נכסים.</p>
          <p>• קבל אישור עקרוני למשכנתא לפני הגשת הצעות כדי לחזק את כוח המיקוח שלך.</p>
          <p>• שמור מרווח לעלויות בלתי צפויות ועיכובים - עסקאות לעולם לא הולכות בדיוק כמו שתכננו.</p>
          <p>• קח בחשבון עלויות לאחר רכישה כמו שיפוצים, ריהוט, ארנונה ודמי ועד בית.</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default TransactionTimeline;
