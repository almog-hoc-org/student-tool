import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { calculateMortgage } from '@/lib/calculations/mortgage-calculator';
import { MortgageTrack, MortgageCalculatorOutput, MortgageTrackType } from '@/types/mortgage-calculator';
import { Plus, Trash2 } from 'lucide-react';

const MortgageCalculator = () => {
  const [tracks, setTracks] = useState<MortgageTrack[]>([
    {
      id: '1',
      name: 'Fixed Unlinked',
      type: 'fixedUnlinked',
      principal: 0,
      annualInterestRate: 0,
      years: 20,
    },
  ]);

  const [results, setResults] = useState<MortgageCalculatorOutput | null>(null);

  const addTrack = () => {
    const newTrack: MortgageTrack = {
      id: Date.now().toString(),
      name: 'New Track',
      type: 'fixedUnlinked',
      principal: 0,
      annualInterestRate: 0,
      years: 20,
    };
    setTracks([...tracks, newTrack]);
  };

  const removeTrack = (id: string) => {
    setTracks(tracks.filter((t) => t.id !== id));
  };

  const updateTrack = (id: string, updates: Partial<MortgageTrack>) => {
    setTracks(tracks.map((t) => (t.id === id ? { ...t, ...updates } : t)));
  };

  const handleCalculate = () => {
    const output = calculateMortgage({ tracks });
    setResults(output);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-IL', {
      style: 'currency',
      currency: 'ILS',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const trackTypeLabels: Record<MortgageTrackType, string> = {
    fixedUnlinked: 'Fixed Unlinked',
    fixedLinked: 'Fixed Linked (CPI)',
    prime: 'Prime',
    variableLinked: 'Variable Linked',
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Mortgage Calculator</CardTitle>
          <CardDescription>
            Build your mortgage mix from multiple tracks and see total monthly payments and interest costs.
          </CardDescription>
        </CardHeader>
      </Card>

      {tracks.map((track, index) => (
        <Card key={track.id}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Track {index + 1}</CardTitle>
              {tracks.length > 1 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeTrack(track.id)}
                  className="text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <Label>Track Name</Label>
              <Input
                value={track.name}
                onChange={(e) => updateTrack(track.id, { name: e.target.value })}
                placeholder="e.g. Fixed Unlinked"
              />
            </div>

            <div>
              <Label>Track Type</Label>
              <Select
                value={track.type}
                onValueChange={(value: MortgageTrackType) => updateTrack(track.id, { type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fixedUnlinked">Fixed Unlinked</SelectItem>
                  <SelectItem value="fixedLinked">Fixed Linked (CPI)</SelectItem>
                  <SelectItem value="prime">Prime</SelectItem>
                  <SelectItem value="variableLinked">Variable Linked</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Principal Amount (₪)</Label>
              <Input
                type="number"
                value={track.principal || ''}
                onChange={(e) => updateTrack(track.id, { principal: Number(e.target.value) })}
                placeholder="e.g. 500000"
              />
            </div>

            <div>
              <Label>Annual Interest Rate (%)</Label>
              <Input
                type="number"
                step="0.1"
                value={track.annualInterestRate || ''}
                onChange={(e) => updateTrack(track.id, { annualInterestRate: Number(e.target.value) })}
                placeholder="e.g. 3.5"
              />
            </div>

            <div>
              <Label>Years</Label>
              <Input
                type="number"
                value={track.years}
                onChange={(e) => updateTrack(track.id, { years: Number(e.target.value) })}
                placeholder="e.g. 20"
              />
            </div>
          </CardContent>
        </Card>
      ))}

      <div className="flex gap-4 justify-center">
        <Button onClick={addTrack} variant="outline">
          <Plus className="h-4 w-4 mr-2" />
          Add Track
        </Button>
        <Button onClick={handleCalculate} size="lg" className="px-8">
          Calculate Mortgage
        </Button>
      </div>

      {results && (
        <Card className="border-primary">
          <CardHeader>
            <CardTitle className="text-2xl">Mortgage Calculation Results</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm text-muted-foreground">Total Monthly Payment</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-primary">
                    {formatCurrency(results.totalMonthlyPayment)}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm text-muted-foreground">Weighted Average Interest</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-primary">
                    {results.weightedAverageInterest.toFixed(2)}%
                  </p>
                </CardContent>
              </Card>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4">Track Breakdown</h3>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {results.tracks.map((trackResult, index) => {
                  const track = tracks.find((t) => t.id === trackResult.trackId)!;
                  return (
                    <Card key={trackResult.trackId}>
                      <CardHeader>
                        <CardTitle className="text-base">{track.name}</CardTitle>
                        <CardDescription>{trackTypeLabels[track.type]}</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <div>
                          <p className="text-sm text-muted-foreground">Monthly Payment</p>
                          <p className="text-lg font-semibold">{formatCurrency(trackResult.monthlyPayment)}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Total Interest</p>
                          <p className="text-lg font-semibold">{formatCurrency(trackResult.totalInterestPaid)}</p>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default MortgageCalculator;
