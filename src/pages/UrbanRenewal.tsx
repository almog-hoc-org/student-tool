import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Clock, AlertTriangle, TrendingUp, Users, Building } from 'lucide-react';
import { he } from '@/lib/translations/he';

const UrbanRenewal = () => {
  const [expandedPhase, setExpandedPhase] = useState<string>('phase-1');

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">{he.urbanRenewal.title}</CardTitle>
          <CardDescription>
            {he.urbanRenewal.description}
          </CardDescription>
        </CardHeader>
      </Card>

      <Card className="bg-accent">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            ציר זמן כולל טיפוסי
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-lg font-semibold text-primary">5-10 שנים</p>
          <p className="text-sm text-muted-foreground mt-1">
            מהתארגנות ראשונית ועד מסירה סופית. משך הזמן בפועל משתנה משמעותית לפי מיקום, מורכבות הפרויקט ותנאי שוק.
          </p>
        </CardContent>
      </Card>

      <div className="space-y-2">
        <h3 className="text-xl font-semibold">שלבי הפרויקט</h3>
        <Accordion type="single" collapsible value={expandedPhase} onValueChange={setExpandedPhase}>
          {he.urbanRenewal.phases.map((phase, index) => (
            <AccordionItem key={index} value={`phase-${index + 1}`}>
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center gap-4 text-right w-full">
                  <Badge variant="outline" className="shrink-0">
                    שלב {index + 1}
                  </Badge>
                  <div className="flex-1">
                    <p className="font-semibold">{phase.name}</p>
                    <p className="text-sm text-muted-foreground">{phase.duration}</p>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="pt-4 space-y-6">
                  {/* Key Activities */}
                  <div>
                    <h4 className="font-semibold flex items-center gap-2 mb-3">
                      <Building className="h-4 w-4 text-primary" />
                      פעילויות מרכזיות
                    </h4>
                    <ul className="space-y-2">
                      {phase.activities.map((activity, idx) => (
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
                      סיכונים עיקריים
                    </h4>
                    <ul className="space-y-2">
                      {phase.risks.map((risk, idx) => (
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
                        ערך לדיירים
                      </h4>
                      <ul className="space-y-2">
                        {phase.valueResidents.map((point, idx) => (
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
                        ערך למשקיעים
                      </h4>
                      <ul className="space-y-2">
                        {phase.valueInvestors.map((point, idx) => (
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
          <CardTitle>הערות חשובות</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>
            • הערכות לוחות הזמנים משוערות ומשתנות משמעותית בהתאם למיקום, מורכבות הפרויקט ורשויות מקומיות.
          </p>
          <p>• עליית ערך משמעותית מתרחשת בדרך כלל לאחר אישור תכנית ובמהלך שלב הבנייה.</p>
          <p>
            • משקיעים מומלצים להתמקד בפרויקטים שעברו מכשולים רגולטוריים ראשוניים לפרופיל סיכון נמוך יותר.
          </p>
          <p>• ייעוץ משפטי ובדיקת נאותות יסודית חיוניים לפני התחייבות לכל פרויקט התחדשות עירונית.</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default UrbanRenewal;