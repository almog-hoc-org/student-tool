import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { calculateMortgage } from '@/lib/calculations/mortgage-calculator';
import { MortgageTrack, MortgageCalculatorOutput, MortgageTrackType } from '@/types/mortgage-calculator';
import { Plus, Trash2, Calculator, Wallet, Percent, TrendingUp } from 'lucide-react';
import { he } from '@/lib/translations/he';
import { formatCurrency, formatPercent } from '@/lib/validation/validators';
import { StatsCard } from '@/components/StatsCard';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', 'hsl(var(--muted))'];

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

  const totalPrincipal = tracks.reduce((sum, t) => sum + t.principal, 0);

  return (
    <div className="space-y-6 pb-8">
      <Card className="border-0 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-primary/5 via-background to-secondary/5">
          <CardTitle className="text-3xl font-bold">{he.mortgageCalculator.title}</CardTitle>
          <CardDescription className="text-base">
            {he.mortgageCalculator.description}
          </CardDescription>
        </CardHeader>
      </Card>

      {/* KPI Cards - Show after calculation */}
      {results && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 animate-in slide-in-from-bottom duration-500">
          <StatsCard
            title={he.mortgageCalculator.totalMonthlyPayment}
            value={formatCurrency(results.totalMonthlyPayment)}
            icon={Wallet}
            iconColor="blue"
          />
          <StatsCard
            title={he.mortgageCalculator.weightedAverageInterest}
            value={`${results.weightedAverageInterest.toFixed(2)}%`}
            icon={Percent}
            iconColor="orange"
          />
          <StatsCard
            title="סך קרן"
            value={formatCurrency(totalPrincipal)}
            icon={TrendingUp}
            iconColor="green"
          />
          <StatsCard
            title="מספר מסלולים"
            value={tracks.length.toString()}
            icon={Calculator}
            iconColor="purple"
          />
        </div>
      )}

      {tracks.map((track, index) => {
        const trackColors = ['from-blue-50', 'from-emerald-50', 'from-orange-50', 'from-purple-50'];
        const iconColors = ['bg-blue-500', 'bg-emerald-500', 'bg-orange-500', 'bg-purple-500'];
        return (
          <Card key={track.id} className="border-0 shadow-lg">
            <CardHeader className={`bg-gradient-to-r ${trackColors[index % 4]} to-background dark:${trackColors[index % 4].replace('50', '950')} dark:to-background`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 ${iconColors[index % 4]} rounded-xl flex items-center justify-center`}>
                    <Calculator className="w-5 h-5 text-white" />
                  </div>
                  <CardTitle>מסלול {index + 1}</CardTitle>
                </div>
                {tracks.length > 1 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeTrack(track.id)}
                    className="text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 pt-6">
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
        );
      })}

      <div className="flex gap-4 justify-center sticky bottom-8 z-10">
        <Button onClick={addTrack} variant="outline" size="lg" className="px-6 shadow-lg">
          <Plus className="h-5 w-5 ml-2" />
          {he.common.addTrack}
        </Button>
        <Button onClick={handleCalculate} size="lg" className="px-12 py-6 text-lg shadow-2xl rounded-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70">
          <Calculator className="ml-2 h-5 w-5" />
          {he.common.calculate}
        </Button>
      </div>

      {results && (
        <div className="space-y-6 animate-in slide-in-from-bottom duration-500">
          {/* Pie Chart for Track Distribution */}
          <Card className="border-0 shadow-xl">
            <CardHeader>
              <CardTitle className="text-2xl">פילוח קרן לפי מסלולים</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <PieChart>
                  <Pie
                    data={tracks.map((track) => ({
                      name: track.name,
                      value: track.principal,
                    }))}
                    cx="50%"
                    cy="50%"
                    innerRadius={80}
                    outerRadius={120}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {tracks.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-xl bg-gradient-to-br from-primary/5 to-secondary/5">
            <CardHeader>
              <CardTitle className="text-3xl">{he.mortgageCalculator.resultsTitle}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="text-xl font-semibold mb-4">{he.mortgageCalculator.trackResultsTitle}</h3>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {results.tracks.map((trackResult, index) => {
                  const track = tracks.find((t) => t.id === trackResult.trackId)!;
                  const iconColors = ['bg-blue-500', 'bg-emerald-500', 'bg-orange-500', 'bg-purple-500'];
                  return (
                    <Card key={trackResult.trackId} className="border-0 shadow-md hover:shadow-lg transition-shadow">
                      <CardHeader className="pb-3">
                        <div className="flex items-center gap-2 mb-2">
                          <div className={`w-8 h-8 ${iconColors[index % 4]} rounded-lg flex items-center justify-center`}>
                            <Calculator className="w-4 h-4 text-white" />
                          </div>
                          <CardTitle className="text-base">{track.name}</CardTitle>
                        </div>
                        <CardDescription>{trackTypeLabels[track.type]}</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="p-3 bg-primary/5 rounded-lg">
                          <p className="text-xs text-muted-foreground mb-1">{he.mortgageCalculator.monthlyPayment}</p>
                          <p className="text-xl font-bold text-primary">{formatCurrency(trackResult.monthlyPayment)}</p>
                        </div>
                        <div className="p-3 bg-muted/50 rounded-lg">
                          <p className="text-xs text-muted-foreground mb-1">{he.mortgageCalculator.totalInterestPaid}</p>
                          <p className="text-lg font-semibold">{formatCurrency(trackResult.totalInterestPaid)}</p>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default MortgageCalculator;
