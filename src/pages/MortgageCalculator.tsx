import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { calculateMortgage } from '@/lib/calculations/mortgage-calculator';
import { MortgageTrack, MortgageCalculatorOutput, MortgageTrackType } from '@/types/mortgage-calculator';
import { Plus, Trash2 } from 'lucide-react';
import { he } from '@/lib/translations/he';
import { formatCurrency, formatPercent } from '@/lib/validation/validators';

const MortgageCalculator = () => {
  const [tracks, setTracks] = useState<MortgageTrack[]>([
    {
      id: '1',
      name: he.mortgageCalculator.trackTypeOptions.fixedUnlinked,
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
      name: he.mortgageCalculator.trackName,
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

  const trackTypeLabels: Record<MortgageTrackType, string> = {
    fixedUnlinked: he.mortgageCalculator.trackTypeOptions.fixedUnlinked,
    fixedLinked: he.mortgageCalculator.trackTypeOptions.fixedLinked,
    prime: he.mortgageCalculator.trackTypeOptions.prime,
    variableLinked: he.mortgageCalculator.trackTypeOptions.variableLinked,
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">{he.mortgageCalculator.title}</CardTitle>
          <CardDescription>
            {he.mortgageCalculator.description}
          </CardDescription>
        </CardHeader>
      </Card>

      {tracks.map((track, index) => (
        <Card key={track.id}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>מסלול {index + 1}</CardTitle>
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
              <Label>{he.mortgageCalculator.trackName}</Label>
              <Input
                value={track.name}
                onChange={(e) => updateTrack(track.id, { name: e.target.value })}
                placeholder={he.mortgageCalculator.trackTypeOptions.fixedUnlinked}
              />
            </div>

            <div>
              <Label>{he.mortgageCalculator.trackType}</Label>
              <Select
                value={track.type}
                onValueChange={(value: MortgageTrackType) => updateTrack(track.id, { type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fixedUnlinked">{he.mortgageCalculator.trackTypeOptions.fixedUnlinked}</SelectItem>
                  <SelectItem value="fixedLinked">{he.mortgageCalculator.trackTypeOptions.fixedLinked}</SelectItem>
                  <SelectItem value="prime">{he.mortgageCalculator.trackTypeOptions.prime}</SelectItem>
                  <SelectItem value="variableLinked">{he.mortgageCalculator.trackTypeOptions.variableLinked}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>{he.mortgageCalculator.principal} ({he.common.currency})</Label>
              <Input
                type="number"
                value={track.principal || ''}
                onChange={(e) => updateTrack(track.id, { principal: Number(e.target.value) })}
                placeholder="למשל 500000"
              />
            </div>

            <div>
              <Label>{he.mortgageCalculator.annualInterestRate}</Label>
              <Input
                type="number"
                step="0.1"
                value={track.annualInterestRate || ''}
                onChange={(e) => updateTrack(track.id, { annualInterestRate: Number(e.target.value) })}
                placeholder="למשל 3.5"
              />
            </div>

            <div>
              <Label>{he.mortgageCalculator.years}</Label>
              <Input
                type="number"
                value={track.years}
                onChange={(e) => updateTrack(track.id, { years: Number(e.target.value) })}
                placeholder="למשל 20"
              />
            </div>
          </CardContent>
        </Card>
      ))}

      <div className="flex gap-4 justify-center">
        <Button onClick={addTrack} variant="outline">
          <Plus className="h-4 w-4 ml-2" />
          {he.common.addTrack}
        </Button>
        <Button onClick={handleCalculate} size="lg" className="px-8">
          {he.common.calculate}
        </Button>
      </div>

      {results && (
        <Card className="border-primary">
          <CardHeader>
            <CardTitle className="text-2xl">{he.mortgageCalculator.resultsTitle}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm text-muted-foreground">{he.mortgageCalculator.totalMonthlyPayment}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-primary">
                    {formatCurrency(results.totalMonthlyPayment)}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm text-muted-foreground">{he.mortgageCalculator.weightedAverageInterest}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-primary">
                    {results.weightedAverageInterest.toFixed(2)}%
                  </p>
                </CardContent>
              </Card>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4">{he.mortgageCalculator.trackResultsTitle}</h3>
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
                          <p className="text-sm text-muted-foreground">{he.mortgageCalculator.monthlyPayment}</p>
                          <p className="text-lg font-semibold">{formatCurrency(trackResult.monthlyPayment)}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">{he.mortgageCalculator.totalInterestPaid}</p>
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
