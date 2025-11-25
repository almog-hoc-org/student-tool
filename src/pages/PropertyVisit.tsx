import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { scoreProperty } from '@/lib/calculations/property-visit';
import {
  PropertyBasicInfo,
  PropertyCondition,
  PropertyEnvironment,
  PropertyLegalPlanning,
  PropertyVisitSummary,
} from '@/types/property-visit';
import { he } from '@/lib/translations/he';
import { StatsCard } from '@/components/StatsCard';
import { Building2, Home, MapPin, Award, Calculator, Loader2 } from 'lucide-react';
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, Tooltip } from 'recharts';
import { saveCalculation } from '@/lib/storage/calculator-history';
import { toast } from '@/hooks/use-toast';

const PropertyVisit = () => {
  const [basicInfo, setBasicInfo] = useState<PropertyBasicInfo>({
    address: '',
    city: '',
    floor: 0,
    totalFloors: 0,
    hasElevator: false,
    hasParking: false,
    hasStorage: false,
    directions: '',
    registeredAreaSqm: 0,
  });

  const [condition, setCondition] = useState<PropertyCondition>({
    wallsConditionScore: 5,
    dampnessOrMoldScore: 5,
    electricityPanelScore: 5,
    plumbingScore: 5,
    windowsAndInsulationScore: 5,
    kitchenConditionScore: 5,
    bathroomConditionScore: 5,
  });

  const [environment, setEnvironment] = useState<PropertyEnvironment>({
    noiseLevelScore: 5,
    parkingAvailabilityScore: 5,
    publicTransportScore: 5,
    proximityToServicesScore: 5,
    neighborhoodFeelScore: 5,
  });

  const [legal, setLegal] = useState<PropertyLegalPlanning>({
    hasOfficialDocuments: false,
    knownBuildingIrregularities: false,
    urbanRenewalPotential: 'none',
  });

  const [results, setResults] = useState<PropertyVisitSummary | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);

  const handleCalculate = async () => {
    setIsCalculating(true);
    
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const summary = scoreProperty(basicInfo, condition, environment, legal);
    setResults(summary);
    
    // Save to history
    saveCalculation({
      type: 'property-visit',
      title: `ביקור - ${basicInfo.address}`,
      result: `ציון כולל: ${summary.overallPropertyScore}/100`,
      input: { basicInfo, condition, environment, legal },
    });
    
    toast({
      title: "ההערכה הושלמה בהצלחה",
      description: "התוצאות נשמרו בהיסטוריה",
    });
    
    setIsCalculating(false);
  };

  const getScoreLabel = (score: number) => {
    if (score < 50) return { text: he.propertyVisit.scoreLabels.poor, variant: 'destructive' as const };
    if (score < 75) return { text: he.propertyVisit.scoreLabels.fair, variant: 'secondary' as const };
    return { text: he.propertyVisit.scoreLabels.good, variant: 'default' as const };
  };

  const conditionLabels: Record<keyof PropertyCondition, string> = {
    wallsConditionScore: he.propertyVisit.wallsConditionScore,
    dampnessOrMoldScore: he.propertyVisit.dampnessOrMoldScore,
    electricityPanelScore: he.propertyVisit.electricityPanelScore,
    plumbingScore: he.propertyVisit.plumbingScore,
    windowsAndInsulationScore: he.propertyVisit.windowsAndInsulationScore,
    kitchenConditionScore: he.propertyVisit.kitchenConditionScore,
    bathroomConditionScore: he.propertyVisit.bathroomConditionScore,
  };

  const environmentLabels: Record<keyof PropertyEnvironment, string> = {
    noiseLevelScore: he.propertyVisit.noiseLevelScore,
    parkingAvailabilityScore: he.propertyVisit.parkingAvailabilityScore,
    publicTransportScore: he.propertyVisit.publicTransportScore,
    proximityToServicesScore: he.propertyVisit.proximityToServicesScore,
    neighborhoodFeelScore: he.propertyVisit.neighborhoodFeelScore,
  };

  return (
    <div className="space-y-6 pb-8">
      <Card className="border-0 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-primary/5 via-background to-secondary/5">
          <CardTitle className="text-3xl font-bold">{he.propertyVisit.title}</CardTitle>
          <CardDescription className="text-base">
            {he.propertyVisit.description}
          </CardDescription>
        </CardHeader>
      </Card>

      {/* KPI Cards - Show after calculation */}
      {results && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 animate-in slide-in-from-bottom duration-500">
          <StatsCard
            title={he.propertyVisit.resultsTitle}
            value={`${Math.round(results.overallPropertyScore)}/100`}
            icon={Award}
            iconColor="blue"
          />
          <StatsCard
            title={he.propertyVisit.conditionScore}
            value={`${Math.round(results.conditionScoreWeighted)}/40`}
            icon={Home}
            iconColor="green"
          />
          <StatsCard
            title={he.propertyVisit.environmentScore}
            value={`${Math.round(results.environmentScoreWeighted)}/30`}
            icon={MapPin}
            iconColor="orange"
          />
          <StatsCard
            title={he.propertyVisit.basicFeaturesScore}
            value={`${Math.round(results.basicFeaturesScoreWeighted)}/30`}
            icon={Building2}
            iconColor="purple"
          />
        </div>
      )}

      {/* Basic Info */}
      <Card className="border-0 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-background dark:from-blue-950 dark:to-background">
          <CardTitle className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            {he.propertyVisit.basicInfoTitle}
          </CardTitle>
        </CardHeader>
        <CardContent className="grid md:grid-cols-2 gap-4 pt-6">
          <div>
            <Label>{he.propertyVisit.address}</Label>
            <Input
              value={basicInfo.address}
              onChange={(e) => setBasicInfo({ ...basicInfo, address: e.target.value })}
              placeholder="למשל רחוב הרצל 123"
            />
          </div>
          <div>
            <Label>{he.propertyVisit.city}</Label>
            <Input
              value={basicInfo.city}
              onChange={(e) => setBasicInfo({ ...basicInfo, city: e.target.value })}
              placeholder="למשל תל אביב"
            />
          </div>
          <div>
            <Label>{he.propertyVisit.floor}</Label>
            <Input
              type="number"
              value={basicInfo.floor || ''}
              onChange={(e) => setBasicInfo({ ...basicInfo, floor: Number(e.target.value) })}
            />
          </div>
          <div>
            <Label>{he.propertyVisit.totalFloors}</Label>
            <Input
              type="number"
              value={basicInfo.totalFloors || ''}
              onChange={(e) => setBasicInfo({ ...basicInfo, totalFloors: Number(e.target.value) })}
            />
          </div>
          <div>
            <Label>{he.propertyVisit.registeredAreaSqm}</Label>
            <Input
              type="number"
              value={basicInfo.registeredAreaSqm || ''}
              onChange={(e) => setBasicInfo({ ...basicInfo, registeredAreaSqm: Number(e.target.value) })}
            />
          </div>
          <div>
            <Label>{he.propertyVisit.directions}</Label>
            <Input
              value={basicInfo.directions}
              onChange={(e) => setBasicInfo({ ...basicInfo, directions: e.target.value })}
              placeholder="למשל דרום-מערב"
            />
          </div>
          <div className="flex items-center gap-2">
            <Switch
              checked={basicInfo.hasElevator}
              onCheckedChange={(checked) => setBasicInfo({ ...basicInfo, hasElevator: checked })}
            />
            <Label>{he.propertyVisit.hasElevator}</Label>
          </div>
          <div className="flex items-center gap-2">
            <Switch
              checked={basicInfo.hasParking}
              onCheckedChange={(checked) => setBasicInfo({ ...basicInfo, hasParking: checked })}
            />
            <Label>{he.propertyVisit.hasParking}</Label>
          </div>
          <div className="flex items-center gap-2">
            <Switch
              checked={basicInfo.hasStorage}
              onCheckedChange={(checked) => setBasicInfo({ ...basicInfo, hasStorage: checked })}
            />
            <Label>{he.propertyVisit.hasStorage}</Label>
          </div>
        </CardContent>
      </Card>

      {/* Physical Condition */}
      <Card className="border-0 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-emerald-50 to-background dark:from-emerald-950 dark:to-background">
          <CardTitle className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center">
              <Home className="w-5 h-5 text-white" />
            </div>
            {he.propertyVisit.conditionTitle} (דרג 1-10)
          </CardTitle>
          <CardDescription>10 = מצוין, 1 = גרוע מאוד</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
          {Object.entries(condition).map(([key, value]) => (
            <div key={key}>
              <div className="flex justify-between mb-2">
                <Label>{conditionLabels[key as keyof PropertyCondition]}</Label>
                <span className="font-semibold">{value}/10</span>
              </div>
              <Slider
                value={[value]}
                onValueChange={([val]) => setCondition({ ...condition, [key]: val })}
                min={1}
                max={10}
                step={1}
              />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Environment */}
      <Card className="border-0 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-orange-50 to-background dark:from-orange-950 dark:to-background">
          <CardTitle className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center">
              <MapPin className="w-5 h-5 text-white" />
            </div>
            {he.propertyVisit.environmentTitle} (דרג 1-10)
          </CardTitle>
          <CardDescription>10 = מצוין, 1 = גרוע מאוד</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
          {Object.entries(environment).map(([key, value]) => (
            <div key={key}>
              <div className="flex justify-between mb-2">
                <Label>{environmentLabels[key as keyof PropertyEnvironment]}</Label>
                <span className="font-semibold">{value}/10</span>
              </div>
              <Slider
                value={[value]}
                onValueChange={([val]) => setEnvironment({ ...environment, [key]: val })}
                min={1}
                max={10}
                step={1}
              />
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="flex justify-center sticky bottom-8 z-10">
        <Button onClick={handleCalculate} size="lg" disabled={isCalculating} className="px-12 py-6 text-lg shadow-2xl rounded-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70">
          {isCalculating ? (
            <>
              <Loader2 className="ml-2 h-5 w-5 animate-spin" />
              מעריך...
            </>
          ) : (
            <>
              <Calculator className="ml-2 h-5 w-5" />
              {he.common.calculate}
            </>
          )}
        </Button>
      </div>

      {/* Results */}
      {results && (
        <div className="space-y-6 animate-in slide-in-from-bottom duration-500">
          {/* Radar Chart */}
          <Card className="border-0 shadow-xl">
            <CardHeader>
              <CardTitle className="text-2xl">ניתוח ויזואלי של הנכס</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <RadarChart
                  data={[
                    ...Object.entries(condition).map(([key, value]) => ({
                      category: conditionLabels[key as keyof PropertyCondition],
                      score: value,
                    })),
                    ...Object.entries(environment).map(([key, value]) => ({
                      category: environmentLabels[key as keyof PropertyEnvironment],
                      score: value,
                    })),
                  ]}
                >
                  <PolarGrid className="opacity-30" />
                  <PolarAngleAxis dataKey="category" className="text-xs" />
                  <PolarRadiusAxis angle={90} domain={[0, 10]} />
                  <Radar name="ציון" dataKey="score" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.6} />
                  <Tooltip />
                </RadarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-xl bg-gradient-to-br from-primary/5 to-secondary/5">
            <CardHeader>
              <CardTitle className="text-3xl">{he.propertyVisit.resultsTitle}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center p-8 bg-background/50 rounded-2xl">
                <p className="text-7xl font-bold bg-gradient-to-br from-primary to-primary/60 bg-clip-text text-transparent mb-4">
                  {Math.round(results.overallPropertyScore)}/100
                </p>
                <Badge variant={getScoreLabel(results.overallPropertyScore).variant} className="text-lg px-6 py-2">
                  {getScoreLabel(results.overallPropertyScore).text}
                </Badge>
              </div>

              <div className="grid md:grid-cols-3 gap-4">
              <Card className="border-0 shadow-md hover:shadow-lg transition-shadow bg-gradient-to-br from-emerald-50 to-background dark:from-emerald-950 dark:to-background">
                <CardHeader>
                  <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                    <Home className="w-4 h-4" />
                    {he.propertyVisit.conditionScore}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-muted rounded-full h-3">
                        <div
                          className="bg-gradient-to-r from-emerald-500 to-emerald-600 h-3 rounded-full transition-all duration-500"
                          style={{ width: `${results.conditionScoreWeighted * 2.5}%` }}
                        />
                      </div>
                      <span className="text-lg font-bold">{Math.round(results.conditionScoreWeighted)}/40</span>
                    </div>
                    <p className="text-xs text-muted-foreground text-center">{((results.conditionScoreWeighted / 40) * 100).toFixed(0)}%</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-md hover:shadow-lg transition-shadow bg-gradient-to-br from-orange-50 to-background dark:from-orange-950 dark:to-background">
                <CardHeader>
                  <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    {he.propertyVisit.environmentScore}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-muted rounded-full h-3">
                        <div
                          className="bg-gradient-to-r from-orange-500 to-orange-600 h-3 rounded-full transition-all duration-500"
                          style={{ width: `${(results.environmentScoreWeighted / 30) * 100}%` }}
                        />
                      </div>
                      <span className="text-lg font-bold">{Math.round(results.environmentScoreWeighted)}/30</span>
                    </div>
                    <p className="text-xs text-muted-foreground text-center">{((results.environmentScoreWeighted / 30) * 100).toFixed(0)}%</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-md hover:shadow-lg transition-shadow bg-gradient-to-br from-purple-50 to-background dark:from-purple-950 dark:to-background">
                <CardHeader>
                  <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                    <Building2 className="w-4 h-4" />
                    {he.propertyVisit.basicFeaturesScore}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-muted rounded-full h-3">
                        <div
                          className="bg-gradient-to-r from-purple-500 to-purple-600 h-3 rounded-full transition-all duration-500"
                          style={{ width: `${(results.basicFeaturesScoreWeighted / 30) * 100}%` }}
                        />
                      </div>
                      <span className="text-lg font-bold">{Math.round(results.basicFeaturesScoreWeighted)}/30</span>
                    </div>
                    <p className="text-xs text-muted-foreground text-center">{((results.basicFeaturesScoreWeighted / 30) * 100).toFixed(0)}%</p>
                  </div>
                </CardContent>
              </Card>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default PropertyVisit;