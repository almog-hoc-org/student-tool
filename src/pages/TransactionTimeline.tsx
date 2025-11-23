import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { calculateTransactionCosts } from '@/lib/calculations/transaction-timeline';
import { TransactionStep, TransactionCostCalculatorOutput } from '@/types/timelines';
import { Clock, DollarSign } from 'lucide-react';

const steps: TransactionStep[] = [
  {
    order: 1,
    name: 'Budget & Financial Checkup',
    description:
      'Assess your financial situation, determine your budget, and understand how much you can afford to invest.',
    typicalTimingText: '1-2 weeks',
    typicalCostsDescription: 'No direct costs. Time investment for financial planning.',
  },
  {
    order: 2,
    name: 'Market Search & Property Visits',
    description:
      'Search for properties that fit your criteria, attend viewings, and evaluate multiple options.',
    typicalTimingText: '4-12 weeks',
    typicalCostsDescription: 'Transportation costs, potential broker search fees in some cases.',
  },
  {
    order: 3,
    name: 'Offer / Letter of Intent',
    description:
      'Make an offer on your chosen property, negotiate terms, and sign a preliminary agreement (letter of intent).',
    typicalTimingText: '1-2 weeks',
    typicalCostsDescription: 'Initial deposit (typically 5-10% of purchase price), legal consultation fees.',
  },
  {
    order: 4,
    name: 'Legal & Technical Due Diligence',
    description:
      'Hire a lawyer to check property title, liens, building permits. Conduct professional property inspection.',
    typicalTimingText: '2-4 weeks',
    typicalCostsDescription:
      'Legal fees (₪5,000-15,000), property surveyor/inspector fees (₪1,500-3,000), appraiser fees.',
  },
  {
    order: 5,
    name: 'Mortgage Pre-Approval',
    description:
      'Submit mortgage application to banks, get pre-approval, and finalize financing terms.',
    typicalTimingText: '2-6 weeks',
    typicalCostsDescription:
      'Appraisal fees (₪1,500-3,000), bank processing fees, potential early commitment fees.',
  },
  {
    order: 6,
    name: 'Contract Signing',
    description:
      'Sign the final purchase agreement with all terms, conditions, and payment schedule clearly defined.',
    typicalTimingText: '1-2 weeks',
    typicalCostsDescription:
      'Purchase tax (varies, typically 0-10% based on buyer status and property value), lawyer fees for contract review.',
  },
  {
    order: 7,
    name: 'Payment Schedule & Registration',
    description:
      'Execute payment milestones, transfer ownership at land registry, and complete mortgage funding.',
    typicalTimingText: '4-12 weeks',
    typicalCostsDescription:
      'Land registry fees, mortgage registration fees, broker commission (typically 2% + VAT), additional legal fees.',
  },
  {
    order: 8,
    name: 'Handover / Renovation / Move-In',
    description:
      'Receive keys, conduct final walkthrough, complete any renovations, and move into your new property.',
    typicalTimingText: '2-16 weeks (depending on renovations)',
    typicalCostsDescription:
      'Renovation costs (if applicable), moving costs, utility connection fees, insurance.',
  },
];

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

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-IL', {
      style: 'currency',
      currency: 'ILS',
      minimumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Transaction Timeline</CardTitle>
          <CardDescription>
            Understand the steps and timeline of a typical real-estate purchase, from initial search to final handover.
          </CardDescription>
        </CardHeader>
      </Card>

      <Card className="bg-accent">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Typical Total Timeline
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-lg font-semibold text-primary">3-6 Months</p>
          <p className="text-sm text-muted-foreground mt-1">
            From starting your search to receiving keys. Timeline varies based on financing complexity, property type,
            and market conditions.
          </p>
        </CardContent>
      </Card>

      <div className="space-y-2">
        <h3 className="text-xl font-semibold">Transaction Steps</h3>
        <Accordion type="single" collapsible defaultValue="step-1">
          {steps.map((step) => (
            <AccordionItem key={step.order} value={`step-${step.order}`}>
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center gap-4 text-left w-full">
                  <Badge variant="outline" className="shrink-0">
                    Step {step.order}
                  </Badge>
                  <div className="flex-1">
                    <p className="font-semibold">{step.name}</p>
                    <p className="text-sm text-muted-foreground">{step.typicalTimingText}</p>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="pt-4 space-y-4">
                  <p className="text-sm">{step.description}</p>

                  <div>
                    <h4 className="font-semibold flex items-center gap-2 mb-2">
                      <DollarSign className="h-4 w-4 text-primary" />
                      Typical Costs
                    </h4>
                    <p className="text-sm text-muted-foreground">{step.typicalCostsDescription}</p>
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
          <CardTitle>Transaction Cost Calculator</CardTitle>
          <CardDescription>
            Estimate your total side costs for a property purchase (taxes, legal, broker, etc.)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label>Purchase Price (₪)</Label>
              <Input
                type="number"
                placeholder="e.g. 1500000"
                value={purchasePrice || ''}
                onChange={(e) => setPurchasePrice(Number(e.target.value))}
              />
            </div>
            <div>
              <Label>Side Costs Percentage (%)</Label>
              <Input
                type="number"
                step="0.5"
                placeholder="e.g. 7"
                value={sideCostsPercent}
                onChange={(e) => setSideCostsPercent(Number(e.target.value))}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Typical range: 6-10% (includes taxes, legal, broker, appraiser, etc.)
              </p>
            </div>
          </div>

          <div className="flex justify-center">
            <Button onClick={handleCalculate} className="px-8">
              Calculate Total Cost
            </Button>
          </div>

          {results && (
            <div className="grid md:grid-cols-2 gap-4 pt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm text-muted-foreground">Estimated Side Costs</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-primary">{formatCurrency(results.estimatedSideCosts)}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm text-muted-foreground">Total Cost (Purchase + Side)</CardTitle>
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
          <CardTitle>Important Tips</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>
            • Always budget for side costs (6-10% of purchase price) in addition to your purchase price and down
            payment.
          </p>
          <p>
            • Don't skip professional due diligence - hire a qualified real estate attorney and property inspector.
          </p>
          <p>• Get mortgage pre-approval before making offers to strengthen your negotiating position.</p>
          <p>
            • Keep a buffer for unexpected costs and delays - transactions rarely go exactly as planned.
          </p>
          <p>• Factor in post-purchase costs like renovations, furnishing, property tax, and building fees.</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default TransactionTimeline;
