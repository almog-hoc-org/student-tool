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

  const handleCalculate = () => {
    const summary = scoreProperty(basicInfo, condition, environment, legal);
    setResults(summary);
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
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">{he.propertyVisit.title}</CardTitle>
          <CardDescription>
            {he.propertyVisit.description}
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Basic Info */}
      <Card>
        <CardHeader>
          <CardTitle>{he.propertyVisit.basicInfoTitle}</CardTitle>
        </CardHeader>
        <CardContent className="grid md:grid-cols-2 gap-4">
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
      <Card>
        <CardHeader>
          <CardTitle>{he.propertyVisit.conditionTitle} (דרג 1-10)</CardTitle>
          <CardDescription>10 = מצוין, 1 = גרוע מאוד</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
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
      <Card>
        <CardHeader>
          <CardTitle>{he.propertyVisit.environmentTitle} (דרג 1-10)</CardTitle>
          <CardDescription>10 = מצוין, 1 = גרוע מאוד</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
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

      <div className="flex justify-center">
        <Button onClick={handleCalculate} size="lg" className="px-8">
          {he.common.calculate}
        </Button>
      </div>

      {/* Results */}
      {results && (
        <Card className="border-primary">
          <CardHeader>
            <CardTitle className="text-2xl">{he.propertyVisit.resultsTitle}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center">
              <p className="text-6xl font-bold text-primary mb-4">
                {Math.round(results.overallPropertyScore)}/100
              </p>
              <Badge variant={getScoreLabel(results.overallPropertyScore).variant} className="text-lg px-4 py-2">
                {getScoreLabel(results.overallPropertyScore).text}
              </Badge>
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm text-muted-foreground">{he.propertyVisit.conditionScore}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-muted rounded-full h-2">
                      <div
                        className="bg-primary h-2 rounded-full"
                        style={{ width: `${results.conditionScoreWeighted * 2.5}%` }}
                      />
                    </div>
                    <span className="text-sm font-semibold">{Math.round(results.conditionScoreWeighted)}/40</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm text-muted-foreground">{he.propertyVisit.environmentScore}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-muted rounded-full h-2">
                      <div
                        className="bg-primary h-2 rounded-full"
                        style={{ width: `${(results.environmentScoreWeighted / 30) * 100}%` }}
                      />
                    </div>
                    <span className="text-sm font-semibold">{Math.round(results.environmentScoreWeighted)}/30</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm text-muted-foreground">{he.propertyVisit.basicFeaturesScore}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-muted rounded-full h-2">
                      <div
                        className="bg-primary h-2 rounded-full"
                        style={{ width: `${(results.basicFeaturesScoreWeighted / 30) * 100}%` }}
                      />
                    </div>
                    <span className="text-sm font-semibold">{Math.round(results.basicFeaturesScoreWeighted)}/30</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default PropertyVisit;