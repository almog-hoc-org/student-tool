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

  const handleCalculate = () => {
    const output = calculateRenovationFeasibility(input);
    setResults(output);
  };

  const classificationVariant = (classification: string) => {
    if (classification === 'Very Attractive') return 'default';
    if (classification === 'Worth Considering') return 'secondary';
    return 'destructive';
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">{he.renovationFeasibility.title}</CardTitle>
          <CardDescription>
            {he.renovationFeasibility.description}
          </CardDescription>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{he.renovationFeasibility.inputsTitle}</CardTitle>
        </CardHeader>
        <CardContent className="grid md:grid-cols-2 gap-4">
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

      <Card>
        <CardHeader>
          <CardTitle>הכנסה משכירות (אופציונלי)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
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

      <div className="flex justify-center">
        <Button onClick={handleCalculate} size="lg" className="px-8">
          {he.common.calculate}
        </Button>
      </div>

      {/* Results */}
      {results && (
        <Card className="border-primary">
          <CardHeader>
            <CardTitle className="text-2xl">{he.renovationFeasibility.resultsTitle}</CardTitle>
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

            <Card className="bg-accent">
              <CardHeader>
                <CardTitle>המלצה</CardTitle>
              </CardHeader>
              <CardContent>
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
      )}
    </div>
  );
};

export default RenovationFeasibility;