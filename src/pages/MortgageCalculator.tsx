import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { calculateMortgage, generateAmortizationSchedule, sensitivityAnalysis, MARKET_CONSTANTS, simulateMadadImpact } from '@/lib/calculations/mortgage-calculator';
import { MortgageTrack, MortgageCalculatorOutput, MortgageTrackType, AmortizationRow, SensitivityResult } from '@/types/mortgage-calculator';
import { Plus, Trash2, Calculator, Wallet, Percent, TrendingUp, Loader2, FileDown, Save } from 'lucide-react';
import { he } from '@/lib/translations/he';
import { formatCurrency } from '@/lib/validation/validators';
import { StatsCard } from '@/components/StatsCard';
import { SmartInsight, generateMortgageInsights } from '@/components/SmartInsight';
import { FuelGauge } from '@/components/FuelGauge';
import { ExecutiveSummary } from '@/components/ExecutiveSummary';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, AreaChart, Area, XAxis, YAxis, CartesianGrid, BarChart, Bar } from 'recharts';
import { saveCalculation } from '@/lib/storage/calculator-history';
import { useAutoPersist } from '@/hooks/useAutoPersist';
import { toast } from '@/hooks/use-toast';
import { exportToPDF } from '@/lib/export/pdf-generator';

const TRACK_COLORS = ['hsl(var(--secondary))', 'hsl(var(--primary))', 'hsl(var(--chart-1))', 'hsl(var(--chart-2))'];
const PI_COLORS = ['hsl(var(--secondary))', 'hsl(var(--primary))']; // Navy for principal, Orange for interest

const MortgageCalculator = () => {
  const [tracks, setTracks] = useAutoPersist<MortgageTrack[]>('mortgage-tracks', [
    {
      id: '1',
      name: he.mortgageCalculator.trackTypeOptions.fixedUnlinked,
      type: 'fixedUnlinked',
      principal: 0,
      annualInterestRate: 0,
      years: 20,
    },
  ]);

  const [monthlyIncome, setMonthlyIncome] = useAutoPersist<number>('mortgage-income', 0);
  const [isOffPlan, setIsOffPlan] = useAutoPersist<boolean>('mortgage-offplan', false);
  const [madadRate, setMadadRate] = useAutoPersist<number>('mortgage-madad-rate', MARKET_CONSTANTS.DEFAULT_MADAD_RATE);
  const [madadYears, setMadadYears] = useAutoPersist<number>('mortgage-madad-years', 3);

  const [results, setResults] = useState<MortgageCalculatorOutput | null>(null);
  const [amortization, setAmortization] = useState<AmortizationRow[]>([]);
  const [sensitivity, setSensitivity] = useState<SensitivityResult[]>([]);
  const [isCalculating, setIsCalculating] = useState(false);

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

  const handleCalculate = async () => {
    setIsCalculating(true);
    await new Promise(resolve => setTimeout(resolve, 400));

    const output = calculateMortgage({ tracks });
    setResults(output);
    setAmortization(generateAmortizationSchedule(tracks));
    setSensitivity(sensitivityAnalysis(tracks));

    const totalPrincipal = tracks.reduce((sum, t) => sum + t.principal, 0);
    saveCalculation({
      type: 'mortgage',
      title: `משכנתא ${formatCurrency(totalPrincipal)}`,
      result: `תשלום חודשי: ${formatCurrency(output.totalMonthlyPayment)}`,
      input: { tracks },
    });

    toast({ title: "החישוב הושלם בהצלחה", description: "התוצאות נשמרו בהיסטוריה" });
    setIsCalculating(false);
  };

  const trackTypeLabels: Record<MortgageTrackType, string> = {
    fixedUnlinked: he.mortgageCalculator.trackTypeOptions.fixedUnlinked,
    fixedLinked: he.mortgageCalculator.trackTypeOptions.fixedLinked,
    prime: he.mortgageCalculator.trackTypeOptions.prime,
    variableLinked: he.mortgageCalculator.trackTypeOptions.variableLinked,
  };

  const totalPrincipal = tracks.reduce((sum, t) => sum + t.principal, 0);
  const dtiRatio = results && monthlyIncome > 0 ? results.totalMonthlyPayment / monthlyIncome : null;
  const dtiPercent = dtiRatio !== null ? dtiRatio * 100 : 0;

  // Madad simulation
  const madadResult = isOffPlan && totalPrincipal > 0
    ? simulateMadadImpact({ linkedAmount: totalPrincipal, annualMadadRate: madadRate, years: madadYears })
    : null;

  // Traffic light status helpers
  const getDtiStatus = (): 'positive' | 'neutral' | 'negative' => {
    if (dtiRatio === null) return 'neutral';
    if (dtiRatio < 0.30) return 'positive';
    if (dtiRatio < 0.40) return 'neutral';
    return 'negative';
  };

  const getInterestStatus = (): 'positive' | 'neutral' | 'negative' => {
    if (!results || totalPrincipal === 0) return 'neutral';
    const ratio = results.totalInterestPaid / totalPrincipal;
    if (ratio < 0.3) return 'positive';
    if (ratio < 0.6) return 'neutral';
    return 'negative';
  };

  return (
    <div className="space-y-6 pb-8">
      <Card className="border-0 shadow-lg glass-card">
        <CardHeader>
          <CardTitle className="text-3xl font-bold">{he.mortgageCalculator.title}</CardTitle>
          <CardDescription className="text-base">
            {he.mortgageCalculator.description}
          </CardDescription>
          <div className="flex gap-2 mt-2">
            <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">פריים: {MARKET_CONSTANTS.PRIME_RATE}%</span>
            <span className="text-xs bg-secondary/10 text-secondary-foreground px-2 py-1 rounded-full">ריבית בנק ישראל: {MARKET_CONSTANTS.BOI_RATE}%</span>
          </div>
        </CardHeader>
      </Card>

      {/* KPI Cards */}
      {results && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatsCard
            title={he.mortgageCalculator.totalMonthlyPayment}
            value={formatCurrency(results.totalMonthlyPayment)}
            icon={Wallet}
            iconColor="navy"
            status={getDtiStatus()}
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
            title="סך ריבית"
            value={formatCurrency(results.totalInterestPaid)}
            icon={Calculator}
            iconColor="orange"
            status={getInterestStatus()}
          />
        </div>
      )}

      {/* Monthly Income */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
              <Wallet className="w-5 h-5 text-primary" />
            </div>
            כמה אתה מרוויח בחודש? (לבדיקת יחס החזר/הכנסה)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Label>הכנסה חודשית נטו ({he.common.currency})</Label>
          <Input
            type="number"
            value={monthlyIncome || ''}
            onChange={(e) => setMonthlyIncome(Number(e.target.value))}
            placeholder="למשל 20000"
            className="max-w-xs"
          />
          {monthlyIncome > 0 && (
            <p className="text-sm text-muted-foreground mt-2">
              תשלום מקסימלי מותר (40%): <span className="font-semibold text-foreground">{formatCurrency(monthlyIncome * MARKET_CONSTANTS.MAX_DTI)}</span>
            </p>
          )}
        </CardContent>
      </Card>

      {/* Track Cards */}
      {tracks.map((track, index) => (
        <Card key={track.id} className="border-0 shadow-lg">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
                  <Calculator className="w-5 h-5 text-primary-foreground" />
                </div>
                <CardTitle>מסלול {index + 1}</CardTitle>
              </div>
              {tracks.length > 1 && (
                <Button variant="ghost" size="sm" onClick={() => removeTrack(track.id)} className="text-destructive hover:bg-destructive/10">
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 pt-6">
            <div>
              <Label>{he.mortgageCalculator.trackName}</Label>
              <Input value={track.name} onChange={(e) => updateTrack(track.id, { name: e.target.value })} />
            </div>
            <div>
              <Label>{he.mortgageCalculator.trackType}</Label>
              <Select value={track.type} onValueChange={(value: MortgageTrackType) => updateTrack(track.id, { type: value })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="fixedUnlinked">{he.mortgageCalculator.trackTypeOptions.fixedUnlinked}</SelectItem>
                  <SelectItem value="fixedLinked">{he.mortgageCalculator.trackTypeOptions.fixedLinked}</SelectItem>
                  <SelectItem value="prime">{he.mortgageCalculator.trackTypeOptions.prime}</SelectItem>
                  <SelectItem value="variableLinked">{he.mortgageCalculator.trackTypeOptions.variableLinked}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>כמה כסף תרצה ללוות במסלול הזה? ({he.common.currency})</Label>
              <Input type="number" value={track.principal || ''} onChange={(e) => updateTrack(track.id, { principal: Number(e.target.value) })} placeholder="למשל 500000" />
            </div>
            <div>
              <Label>{he.mortgageCalculator.annualInterestRate}</Label>
              <Input type="number" step="0.1" value={track.annualInterestRate || ''} onChange={(e) => updateTrack(track.id, { annualInterestRate: Number(e.target.value) })} placeholder="למשל 3.5" />
            </div>
            <div>
              <Label>לכמה שנים? (תקופת ההלוואה)</Label>
              <Input type="number" value={track.years} onChange={(e) => updateTrack(track.id, { years: Number(e.target.value) })} placeholder="למשל 20" />
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Madad Simulator */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-lg">
            <div className="w-10 h-10 bg-secondary/10 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-secondary-foreground" />
            </div>
            מדד תשומות הבנייה (לרכישה מקבלן)
          </CardTitle>
          <CardDescription>רלוונטי בלבד לדירות מקבלן – רכישה "על הנייר"</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <Switch checked={isOffPlan} onCheckedChange={setIsOffPlan} />
            <Label>הדירה נרכשת מקבלן (צמודת מדד)</Label>
          </div>
          {isOffPlan && (
            <div className="grid md:grid-cols-2 gap-4 p-4 rounded-xl bg-accent/50">
              <div>
                <Label>שיעור מדד שנתי משוער (%)</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={madadRate}
                  onChange={(e) => setMadadRate(Number(e.target.value))}
                />
                <p className="text-xs text-muted-foreground mt-1">ברירת מחדל: {MARKET_CONSTANTS.DEFAULT_MADAD_RATE}% (ינואר 2026)</p>
              </div>
              <div>
                <Label>שנות בנייה צפויות</Label>
                <Input
                  type="number"
                  value={madadYears}
                  onChange={(e) => setMadadYears(Number(e.target.value))}
                />
              </div>
              {madadResult && (
                <div className="md:col-span-2 p-4 rounded-xl bg-card border">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                    <div>
                      <p className="text-xs text-muted-foreground">סכום מקורי</p>
                      <p className="text-lg font-bold">{formatCurrency(madadResult.originalTotal)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">תוספת מדד</p>
                      <p className="text-lg font-bold text-destructive">{formatCurrency(madadResult.additionalCost)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">סכום מעודכן</p>
                      <p className="text-lg font-bold">{formatCurrency(madadResult.adjustedTotal)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">חשיפה אפקטיבית</p>
                      <p className="text-lg font-bold">{(MARKET_CONSTANTS.MADAD_EXPOSURE * 100).toFixed(0)}%</p>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-3 text-center">
                    לפי חוק יוני 2025: 20% הראשונים פטורים ממדד, היתרה צמודה ב-50% — חשיפה אפקטיבית ~40%
                  </p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex gap-4 justify-center sticky bottom-8 z-10">
        <Button onClick={addTrack} variant="outline" size="lg" className="px-6 shadow-lg">
          <Plus className="h-5 w-5 ml-2" />
          {he.common.addTrack}
        </Button>
        <Button onClick={handleCalculate} size="lg" disabled={isCalculating} className="px-12 py-6 text-lg shadow-2xl rounded-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70">
          {isCalculating ? (<><Loader2 className="ml-2 h-5 w-5 animate-spin" />מחשב...</>) : (<><Calculator className="ml-2 h-5 w-5" />{he.common.calculate}</>)}
        </Button>
      </div>

      {results && (
        <div className="space-y-6">
          <div className="flex justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={() => exportToPDF({
                title: 'חישוב משכנתא',
                subtitle: `סכום: ${formatCurrency(totalPrincipal)} | החזר חודשי: ${formatCurrency(results.totalMonthlyPayment)}`,
                executiveSummary: [
                  `החזר חודשי: ${formatCurrency(results.totalMonthlyPayment)}`,
                  `סה״כ ריבית: ${formatCurrency(results.totalInterestPaid)}`,
                  `ריבית ממוצעת משוקללת: ${results.weightedAverageInterest.toFixed(2)}%`,
                  ...(dtiRatio !== null ? [`יחס החזר/הכנסה: ${dtiPercent.toFixed(1)}%`] : []),
                ],
                sections: [
                  {
                    title: 'פרטי המסלולים',
                    items: tracks.map((t, i) => ({
                      label: `מסלול ${i + 1}: ${he.mortgageCalculator.trackTypes[t.type]}`,
                      value: `${formatCurrency(t.principal)} | ${t.annualInterestRate}% | ${t.years} שנים`,
                    })),
                  },
                  {
                    title: 'תוצאות',
                    items: [
                      { label: 'החזר חודשי', value: formatCurrency(results.totalMonthlyPayment) },
                      { label: 'סה״כ ריבית', value: formatCurrency(results.totalInterestPaid) },
                      { label: 'סה״כ תשלום', value: formatCurrency(totalPrincipal + results.totalInterestPaid) },
                      { label: 'ריבית ממוצעת', value: `${results.weightedAverageInterest.toFixed(2)}%` },
                    ],
                  },
                ],
                chartElementId: 'mortgage-chart',
              })}
            >
              <FileDown className="w-4 h-4 ml-2" />
              ייצוא PDF
            </Button>
          </div>

          {/* Executive Summary */}
          <ExecutiveSummary
            type="mortgage"
            data={{
              monthlyPayment: results.totalMonthlyPayment,
              dtiRatio: dtiRatio,
              totalInterest: results.totalInterestPaid,
              totalPrincipal,
              weightedRate: results.weightedAverageInterest / 100,
            }}
          />

          {/* Smart Insights */}
          <SmartInsight
            insights={generateMortgageInsights({
              monthlyPayment: results.totalMonthlyPayment,
              monthlyIncome: monthlyIncome > 0 ? monthlyIncome : undefined,
              totalInterest: results.totalInterestPaid,
              totalPrincipal,
            })}
          />

          {/* DTI Fuel Gauge */}
          {dtiRatio !== null && (
            <FuelGauge
              value={dtiPercent}
              maxValue={60}
              label="יחס החזר/הכנסה (DTI)"
              sublabel={`${dtiPercent.toFixed(1)}% — מקסימום מותר: ${(MARKET_CONSTANTS.MAX_DTI * 100).toFixed(0)}%`}
              thresholds={{ green: 50, yellow: 67 }}
            />
          )}

          {/* Principal vs Interest Donut */}
          <Card className="border-0 shadow-xl">
            <CardHeader>
              <CardTitle className="text-2xl">התפלגות קרן מול ריבית</CardTitle>
              <CardDescription>כמה מסך התשלום הולך לקרן וכמה לריבית</CardDescription>
            </CardHeader>
            <CardContent>
              <div id="mortgage-chart">
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={[
                      { name: 'קרן', value: totalPrincipal },
                      { name: 'ריבית', value: results.totalInterestPaid },
                    ]}
                    cx="50%"
                    cy="50%"
                    innerRadius={80}
                    outerRadius={120}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    <Cell fill={PI_COLORS[0]} />
                    <Cell fill={PI_COLORS[1]} />
                  </Pie>
                  <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
              </div>
              <div className="text-center mt-2">
                <p className="text-sm text-muted-foreground">
                  סך תשלום: <span className="font-bold text-foreground">{formatCurrency(totalPrincipal + results.totalInterestPaid)}</span>
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Monthly Payment Distribution by Track */}
          {tracks.length > 1 && (
            <Card className="border-0 shadow-xl">
              <CardHeader>
                <CardTitle className="text-2xl">התפלגות תשלום חודשי לפי מסלולים</CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="chart" className="w-full">
                  <TabsList className="grid w-full grid-cols-2 mb-6">
                    <TabsTrigger value="chart">גרף</TabsTrigger>
                    <TabsTrigger value="table">טבלה</TabsTrigger>
                  </TabsList>
                  <TabsContent value="chart">
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie data={tracks.map((track) => ({ name: track.name, value: results.tracks.find(t => t.trackId === track.id)?.monthlyPayment || 0 }))} cx="50%" cy="50%" innerRadius={80} outerRadius={120} paddingAngle={5} dataKey="value">
                          {tracks.map((_, index) => (<Cell key={`cell-${index}`} fill={TRACK_COLORS[index % TRACK_COLORS.length]} />))}
                        </Pie>
                        <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </TabsContent>
                  <TabsContent value="table">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>מסלול</TableHead>
                          <TableHead className="text-left">תשלום חודשי</TableHead>
                          <TableHead className="text-left">% מסך התשלום</TableHead>
                          <TableHead className="text-left">סה"כ ריבית</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {results.tracks.map((track, index) => {
                          const trackInfo = tracks.find(t => t.id === track.trackId)!;
                          return (
                            <TableRow key={track.trackId}>
                              <TableCell className="font-medium">{trackInfo.name}</TableCell>
                              <TableCell>{formatCurrency(track.monthlyPayment)}</TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <div className="flex-1 bg-muted rounded-full h-2 max-w-[100px]">
                                    <div className="h-2 rounded-full" style={{ width: `${(track.monthlyPayment / results.totalMonthlyPayment) * 100}%`, backgroundColor: TRACK_COLORS[index % TRACK_COLORS.length] }} />
                                  </div>
                                  <span className="text-sm">{((track.monthlyPayment / results.totalMonthlyPayment) * 100).toFixed(1)}%</span>
                                </div>
                              </TableCell>
                              <TableCell>{formatCurrency(track.totalInterestPaid)}</TableCell>
                            </TableRow>
                          );
                        })}
                        <TableRow className="font-bold bg-primary/5">
                          <TableCell>סה"כ</TableCell>
                          <TableCell>{formatCurrency(results.totalMonthlyPayment)}</TableCell>
                          <TableCell>100%</TableCell>
                          <TableCell>{formatCurrency(results.totalInterestPaid)}</TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          )}

          {/* Amortization Chart */}
          {amortization.length > 0 && (
            <Card className="border-0 shadow-xl">
              <CardHeader>
                <CardTitle className="text-2xl">גרף אמורטיזציה – קרן מול ריבית לאורך השנים</CardTitle>
                <CardDescription>כמה מהתשלום השנתי שלך הולך לקרן וכמה לריבית</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={350}>
                  <AreaChart data={amortization}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="year" label={{ value: 'שנה', position: 'insideBottom', offset: -5 }} />
                    <YAxis tickFormatter={(v) => `₪${(v / 1000).toFixed(0)}k`} />
                    <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                    <Legend />
                    <Area type="monotone" dataKey="principalPayment" name="תשלום קרן" stackId="1" stroke="hsl(var(--secondary))" fill="hsl(var(--secondary))" fillOpacity={0.6} />
                    <Area type="monotone" dataKey="interestPayment" name="תשלום ריבית" stackId="1" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.4} />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* Sensitivity Analysis */}
          {sensitivity.length > 0 && (
            <Card className="border-0 shadow-xl">
              <CardHeader>
                <CardTitle className="text-2xl">ניתוח רגישות – מה קורה אם הריבית משתנה?</CardTitle>
                <CardDescription>השפעת שינויי ריבית על ההחזר החודשי שלך</CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="chart" className="w-full">
                  <TabsList className="grid w-full grid-cols-2 mb-6">
                    <TabsTrigger value="chart">גרף</TabsTrigger>
                    <TabsTrigger value="table">טבלה</TabsTrigger>
                  </TabsList>
                  <TabsContent value="chart">
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={sensitivity.map(s => ({
                        name: s.deltaPercent === 0 ? 'נוכחי' : `${s.deltaPercent > 0 ? '+' : ''}${s.deltaPercent}%`,
                        payment: Math.round(s.totalMonthlyPayment),
                      }))}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis tickFormatter={(v) => `₪${(v / 1000).toFixed(1)}k`} />
                        <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                        <Bar dataKey="payment" name="החזר חודשי" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </TabsContent>
                  <TabsContent value="table">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>שינוי ריבית</TableHead>
                          <TableHead className="text-left">החזר חודשי</TableHead>
                          <TableHead className="text-left">הפרש מהנוכחי</TableHead>
                          <TableHead className="text-left">סך ריבית</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {sensitivity.map((s) => {
                          const currentPayment = sensitivity.find(x => x.deltaPercent === 0)?.totalMonthlyPayment || 0;
                          const diff = s.totalMonthlyPayment - currentPayment;
                          return (
                            <TableRow key={s.deltaPercent} className={s.deltaPercent === 0 ? 'bg-primary/5 font-bold' : ''}>
                              <TableCell>{s.deltaPercent === 0 ? 'נוכחי' : `${s.deltaPercent > 0 ? '+' : ''}${s.deltaPercent}%`}</TableCell>
                              <TableCell>{formatCurrency(s.totalMonthlyPayment)}</TableCell>
                              <TableCell className={diff > 0 ? 'text-destructive' : diff < 0 ? 'text-[hsl(var(--chart-1))]' : ''}>
                                {diff === 0 ? '—' : `${diff > 0 ? '+' : ''}${formatCurrency(diff)}`}
                              </TableCell>
                              <TableCell>{formatCurrency(s.totalInterestPaid)}</TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          )}

          {/* Track Details */}
          <Card className="border-0 shadow-xl">
            <CardHeader>
              <CardTitle className="text-3xl">{he.mortgageCalculator.resultsTitle}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="text-xl font-semibold mb-4">{he.mortgageCalculator.trackResultsTitle}</h3>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {results.tracks.map((trackResult, index) => {
                    const track = tracks.find((t) => t.id === trackResult.trackId)!;
                    return (
                      <Card key={trackResult.trackId} className="border-0 shadow-md hover:shadow-lg transition-shadow">
                        <CardHeader className="pb-3">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                              <Calculator className="w-4 h-4 text-primary-foreground" />
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
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default MortgageCalculator;
