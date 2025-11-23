import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { calculateRenovationFeasibility } from '@/lib/calculations/renovation-feasibility';
import { RenovationInputs, RenovationOutput } from '@/types/renovation-feasibility';

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

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-IL', {
      style: 'currency',
      currency: 'ILS',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const formatPercent = (value: number) => {
    return `${(value * 100).toFixed(2)}%`;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Renovation Feasibility</CardTitle>
          <CardDescription>
            Check if renovating a property is economically worthwhile in terms of value uplift and ROI.
          </CardDescription>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Property Valuation</CardTitle>
        </CardHeader>
        <CardContent className="grid md:grid-cols-2 gap-4">
          <div>
            <Label>Current Property Value (₪)</Label>
            <Input
              type="number"
              placeholder="e.g. 1200000"
              value={input.currentValue || ''}
              onChange={(e) => setInput({ ...input, currentValue: Number(e.target.value) })}
            />
          </div>
          <div>
            <Label>Post-Renovation Value (₪)</Label>
            <Input
              type="number"
              placeholder="e.g. 1500000"
              value={input.postRenovationValue || ''}
              onChange={(e) => setInput({ ...input, postRenovationValue: Number(e.target.value) })}
            />
          </div>
          <div>
            <Label>Renovation Base Cost (₪)</Label>
            <Input
              type="number"
              placeholder="e.g. 200000"
              value={input.renovationBaseCost || ''}
              onChange={(e) => setInput({ ...input, renovationBaseCost: Number(e.target.value) })}
            />
            <p className="text-xs text-muted-foreground mt-1">
              We'll add 15% contingency automatically
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Rental Income (Optional)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <Switch
              checked={input.isForRental}
              onCheckedChange={(checked) => setInput({ ...input, isForRental: checked })}
            />
            <Label>This is a rental property</Label>
          </div>

          {input.isForRental && (
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label>Monthly Rent Before (₪)</Label>
                <Input
                  type="number"
                  placeholder="e.g. 4000"
                  value={input.monthlyRentBefore || ''}
                  onChange={(e) => setInput({ ...input, monthlyRentBefore: Number(e.target.value) })}
                />
              </div>
              <div>
                <Label>Monthly Rent After (₪)</Label>
                <Input
                  type="number"
                  placeholder="e.g. 6000"
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
          Calculate Feasibility
        </Button>
      </div>

      {/* Results */}
      {results && (
        <Card className="border-primary">
          <CardHeader>
            <CardTitle className="text-2xl">Renovation Feasibility Results</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm text-muted-foreground">Total Renovation Cost</CardTitle>
                  <CardDescription>Including 15% contingency</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">{formatCurrency(results.totalRenovationCost)}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm text-muted-foreground">Value Uplift</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-primary">{formatCurrency(results.valueUplift)}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm text-muted-foreground">Paper Profit</CardTitle>
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
                      <CardTitle className="text-sm text-muted-foreground">Yearly Rent Increase</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold text-primary">{formatCurrency(results.rentUpliftYear)}</p>
                    </CardContent>
                  </Card>

                  {results.renovationYield !== undefined && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm text-muted-foreground">Renovation Yield</CardTitle>
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
                  <CardTitle className="text-sm text-muted-foreground">Classification</CardTitle>
                </CardHeader>
                <CardContent>
                  <Badge
                    variant={
                      results.classification === 'Very Attractive'
                        ? 'default'
                        : results.classification === 'Worth Considering'
                        ? 'secondary'
                        : 'destructive'
                    }
                    className="text-base px-3 py-1"
                  >
                    {results.classification}
                  </Badge>
                </CardContent>
              </Card>
            </div>

            <Card className="bg-accent">
              <CardHeader>
                <CardTitle>Recommendation</CardTitle>
              </CardHeader>
              <CardContent>
                {results.classification === 'Not Worth It' && (
                  <div>
                    <p className="text-destructive mb-2">
                      ⚠️ This renovation does not appear economically viable based on the numbers provided.
                    </p>
                    <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                      <li>Consider negotiating lower renovation costs</li>
                      <li>Re-evaluate the post-renovation value estimate</li>
                      <li>If it's for rental, explore ways to increase rent potential</li>
                    </ul>
                  </div>
                )}

                {results.classification === 'Borderline' && (
                  <div>
                    <p className="text-muted-foreground mb-2">
                      💡 This renovation shows marginal returns. Proceed with caution.
                    </p>
                    <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                      <li>Double-check all cost estimates</li>
                      <li>Ensure market value assessments are accurate</li>
                      <li>Consider if non-financial benefits justify the investment</li>
                    </ul>
                  </div>
                )}

                {results.classification === 'Worth Considering' && (
                  <div>
                    <p className="text-primary mb-2">
                      ✓ This renovation shows reasonable returns and may be worth pursuing.
                    </p>
                    <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                      <li>Get detailed quotes from contractors</li>
                      <li>Verify market comps for post-renovation value</li>
                      <li>Plan for unexpected costs and delays</li>
                    </ul>
                  </div>
                )}

                {results.classification === 'Very Attractive' && (
                  <div>
                    <p className="text-primary mb-2">
                      ✓✓ This renovation shows excellent returns and appears to be a strong opportunity!
                    </p>
                    <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                      <li>Move forward with detailed planning and contractor quotes</li>
                      <li>Ensure permits and approvals are in order</li>
                      <li>Have a contingency fund for unexpected issues</li>
                    </ul>
                  </div>
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
