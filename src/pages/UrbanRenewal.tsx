import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { UrbanRenewalPhase } from '@/types/timelines';
import { Clock, AlertTriangle, TrendingUp, Users, Building } from 'lucide-react';

const phases: UrbanRenewalPhase[] = [
  {
    order: 1,
    name: 'Initiation & Residents Organization',
    typicalDurationText: '6-12 months',
    keyActivities: [
      'Initial meetings with residents',
      'Formation of residents committee',
      'Preliminary feasibility studies',
      'Selection of entrepreneur/developer',
    ],
    mainRisks: [
      'Lack of consensus among residents',
      'Unrealistic expectations',
      'Difficulty finding suitable developer',
    ],
    valueCreationPointsForResidents: [
      'Early involvement in decision-making',
      'Understanding of process and timeline',
      'Building community consensus',
    ],
    valueCreationPointsForInvestors: [
      'Early entry at lower prices',
      'Opportunity to influence project direction',
      'Time to arrange financing',
    ],
  },
  {
    order: 2,
    name: 'Preliminary Design',
    typicalDurationText: '3-6 months',
    keyActivities: [
      'Architectural concept development',
      'Structural assessment of existing building',
      'Initial planning for unit distribution',
      'Economic feasibility analysis',
    ],
    mainRisks: [
      'Unexpected structural issues discovered',
      'Disagreement on design direction',
      'Preliminary costs higher than expected',
    ],
    valueCreationPointsForResidents: [
      'Visualization of future property',
      'Understanding of upgrade potential',
      'Input on design preferences',
    ],
    valueCreationPointsForInvestors: [
      'Clearer picture of final product',
      'Better assessment of value potential',
      'Opportunity to secure favorable terms',
    ],
  },
  {
    order: 3,
    name: 'Planning Authorities Submission',
    typicalDurationText: '12-24 months',
    keyActivities: [
      'Detailed architectural plans',
      'Submission to local planning committee',
      'Traffic and environmental impact studies',
      'Infrastructure coordination',
    ],
    mainRisks: [
      'Planning objections from neighbors',
      'Required design changes by authorities',
      'Long approval queues',
      'Changing planning regulations',
    ],
    valueCreationPointsForResidents: [
      'Official validation of project',
      'Protection of rights in approved plan',
      'Clarity on final apartment specifications',
    ],
    valueCreationPointsForInvestors: [
      'Significant risk reduction post-approval',
      'Property value increase',
      'Clearer exit strategy timing',
    ],
  },
  {
    order: 4,
    name: 'Approvals & Objections',
    typicalDurationText: '6-18 months',
    keyActivities: [
      'Response to planning objections',
      'Negotiations with objectors',
      'Final planning committee approval',
      'Legal validity period begins',
    ],
    mainRisks: [
      'Sustained objections requiring legal action',
      'Compromise on project scope',
      'Additional costs for modifications',
    ],
    valueCreationPointsForResidents: [
      'Resolution of uncertainties',
      'Finalization of agreements',
      'Moving toward execution phase',
    ],
    valueCreationPointsForInvestors: [
      'Major de-risking milestone',
      'Market value increase',
      'Ability to secure better financing',
    ],
  },
  {
    order: 5,
    name: 'Building Permit',
    typicalDurationText: '6-12 months',
    keyActivities: [
      'Detailed engineering plans',
      'Contractor selection',
      'Building permit application',
      'Final financing arrangements',
    ],
    mainRisks: [
      'Permit delays',
      'Rising construction costs',
      'Contractor reliability issues',
    ],
    valueCreationPointsForResidents: [
      'Project becomes tangible',
      'Evacuation timeline clarity',
      'Alternative housing arrangements',
    ],
    valueCreationPointsForInvestors: [
      'Short-term execution timeline visible',
      'Final investment commitments',
      'Peak value appreciation approaching',
    ],
  },
  {
    order: 6,
    name: 'Evacuation & Demolition',
    typicalDurationText: '3-6 months',
    keyActivities: [
      'Resident relocation',
      'Temporary housing arrangements',
      'Building evacuation',
      'Demolition work',
      'Site preparation',
    ],
    mainRisks: [
      'Relocation challenges',
      'Temporary housing costs',
      'Emotional stress on residents',
      'Unexpected hazardous materials',
    ],
    valueCreationPointsForResidents: [
      'Moving toward new property',
      'Temporary housing compensation',
      'End of old property maintenance',
    ],
    valueCreationPointsForInvestors: [
      'Active construction phase begins',
      'Visible progress',
      'Timeline to completion shortens',
    ],
  },
  {
    order: 7,
    name: 'Construction',
    typicalDurationText: '24-36 months',
    keyActivities: [
      'Foundation and structural work',
      'Building shell construction',
      'MEP (mechanical, electrical, plumbing) installation',
      'Finishing work',
      'Quality inspections',
    ],
    mainRisks: [
      'Construction delays',
      'Quality issues',
      'Contractor financial problems',
      'Cost overruns',
      'Market changes during construction',
    ],
    valueCreationPointsForResidents: [
      'Regular progress updates',
      'Selection of fixtures and finishes',
      'Anticipation of completion',
    ],
    valueCreationPointsForInvestors: [
      'Value crystallizing',
      'Marketing and sale opportunities',
      'Pre-sale value realization',
    ],
  },
  {
    order: 8,
    name: 'Handover & Registration',
    typicalDurationText: '6-12 months',
    keyActivities: [
      'Final inspections',
      'Certificate of occupancy',
      'Apartment handover',
      'Land registration updates',
      'Final payments',
    ],
    mainRisks: [
      'Defects requiring fixes',
      'Registration delays',
      'Final cost adjustments',
    ],
    valueCreationPointsForResidents: [
      'New apartment possession',
      'Modern, upgraded living space',
      'Potential additional square footage',
      'New property value',
    ],
    valueCreationPointsForInvestors: [
      'Value realization',
      'Sale or rental opportunities',
      'Return on investment',
      'Exit strategy execution',
    ],
  },
];

const UrbanRenewal = () => {
  const [expandedPhase, setExpandedPhase] = useState<string>('phase-1');

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Urban Renewal Timeline</CardTitle>
          <CardDescription>
            Visual explanation of main phases in a typical Pinui-Binui (urban renewal) project, including duration,
            risks, and value creation points.
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
          <p className="text-lg font-semibold text-primary">5-10 Years</p>
          <p className="text-sm text-muted-foreground mt-1">
            From initial organization to final handover. Actual duration varies significantly by location, project
            complexity, and market conditions.
          </p>
        </CardContent>
      </Card>

      <div className="space-y-2">
        <h3 className="text-xl font-semibold">Project Phases</h3>
        <Accordion type="single" collapsible value={expandedPhase} onValueChange={setExpandedPhase}>
          {phases.map((phase) => (
            <AccordionItem key={phase.order} value={`phase-${phase.order}`}>
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center gap-4 text-left w-full">
                  <Badge variant="outline" className="shrink-0">
                    Phase {phase.order}
                  </Badge>
                  <div className="flex-1">
                    <p className="font-semibold">{phase.name}</p>
                    <p className="text-sm text-muted-foreground">{phase.typicalDurationText}</p>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="pt-4 space-y-6">
                  {/* Key Activities */}
                  <div>
                    <h4 className="font-semibold flex items-center gap-2 mb-3">
                      <Building className="h-4 w-4 text-primary" />
                      Key Activities
                    </h4>
                    <ul className="space-y-2">
                      {phase.keyActivities.map((activity, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm">
                          <span className="text-primary mt-0.5">•</span>
                          <span>{activity}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Main Risks */}
                  <div>
                    <h4 className="font-semibold flex items-center gap-2 mb-3">
                      <AlertTriangle className="h-4 w-4 text-destructive" />
                      Main Risks
                    </h4>
                    <ul className="space-y-2">
                      {phase.mainRisks.map((risk, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm">
                          <span className="text-destructive mt-0.5">⚠</span>
                          <span>{risk}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    {/* For Residents */}
                    <div>
                      <h4 className="font-semibold flex items-center gap-2 mb-3">
                        <Users className="h-4 w-4 text-primary" />
                        Value for Residents
                      </h4>
                      <ul className="space-y-2">
                        {phase.valueCreationPointsForResidents.map((point, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-sm">
                            <span className="text-primary mt-0.5">✓</span>
                            <span>{point}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* For Investors */}
                    <div>
                      <h4 className="font-semibold flex items-center gap-2 mb-3">
                        <TrendingUp className="h-4 w-4 text-primary" />
                        Value for Investors
                      </h4>
                      <ul className="space-y-2">
                        {phase.valueCreationPointsForInvestors.map((point, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-sm">
                            <span className="text-primary mt-0.5">✓</span>
                            <span>{point}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>

      <Card className="bg-accent">
        <CardHeader>
          <CardTitle>Important Notes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>
            • Timeline estimates are approximate and vary significantly based on location, project complexity, and local
            authorities.
          </p>
          <p>• Major value appreciation typically occurs after planning approval and during construction phases.</p>
          <p>
            • Investors should focus on projects that have cleared early regulatory hurdles for lower risk profiles.
          </p>
          <p>• Legal advice and thorough due diligence are essential before committing to any urban renewal project.</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default UrbanRenewal;
