import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Clock, AlertTriangle, TrendingUp, Users, Building, CheckCircle2 } from 'lucide-react';
import { he } from '@/lib/translations/he';
import { PageHero } from '@/components/PageHero';

const UrbanRenewal = () => {
  const [expandedPhase, setExpandedPhase] = useState<string>('phase-1');

  return (
    <div className="space-y-6 pb-8">
      <PageHero
        icon={<Building className="w-6 h-6 text-primary" />}
        title={he.urbanRenewal.title}
        description={he.urbanRenewal.description}
      />

      <Card className="border shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-lg">
            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
              <Clock className="h-5 w-5 text-primary" />
            </div>
            ציר זמן כולל טיפוסי
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold text-primary mb-2">5-10 שנים</p>
          <p className="text-sm text-muted-foreground">
            מהתארגנות ראשונית ועד מסירה סופית. משך הזמן בפועל משתנה משמעותית לפי מיקום, מורכבות הפרויקט ותנאי שוק.
          </p>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <h3 className="text-lg font-bold">שלבי הפרויקט</h3>
        <Accordion type="single" collapsible value={expandedPhase} onValueChange={setExpandedPhase} className="space-y-3">
          {he.urbanRenewal.phases.map((phase, index) => (
            <AccordionItem key={index} value={`phase-${index + 1}`} className="border shadow-sm rounded-lg overflow-hidden">
              <AccordionTrigger className="hover:no-underline px-6">
                <div className="flex items-center gap-4 text-right w-full">
                  <div className="shrink-0">
                    <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                      <CheckCircle2 className="w-5 h-5 text-primary" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-base">{phase.name}</p>
                    <p className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
                      <Clock className="h-3 w-3" />
                      {phase.duration}
                    </p>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-6">
                <div className="pt-4 space-y-6">
                  {/* Key Activities */}
                  <div className="p-4 bg-primary/5 rounded-lg">
                    <h4 className="font-bold flex items-center gap-2 mb-3 text-sm">
                      <Building className="h-4 w-4 text-primary" />
                      פעילויות מרכזיות
                    </h4>
                    <ul className="space-y-2">
                      {phase.activities.map((activity, idx) => (
                        <li key={idx} className="flex items-start gap-3 text-sm">
                          <CheckCircle2 className="text-primary mt-0.5 h-4 w-4 shrink-0" />
                          <span>{activity}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Main Risks */}
                  <div className="p-4 bg-destructive/5 rounded-lg">
                    <h4 className="font-bold flex items-center gap-2 mb-3 text-sm">
                      <AlertTriangle className="h-4 w-4 text-destructive" />
                      סיכונים עיקריים
                    </h4>
                    <ul className="space-y-2">
                      {phase.risks.map((risk, idx) => (
                        <li key={idx} className="flex items-start gap-3 text-sm">
                          <AlertTriangle className="text-destructive mt-0.5 h-4 w-4 shrink-0" />
                          <span>{risk}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    {/* For Residents */}
                    <div className="p-4 bg-accent/50 rounded-lg">
                      <h4 className="font-bold flex items-center gap-2 mb-3 text-sm">
                        <Users className="h-4 w-4 text-primary" />
                        ערך לדיירים
                      </h4>
                      <ul className="space-y-2">
                        {phase.valueResidents.map((point, idx) => (
                          <li key={idx} className="flex items-start gap-3 text-sm">
                            <CheckCircle2 className="text-primary mt-0.5 h-4 w-4 shrink-0" />
                            <span>{point}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* For Investors */}
                    <div className="p-4 bg-secondary/10 rounded-lg">
                      <h4 className="font-bold flex items-center gap-2 mb-3 text-sm">
                        <TrendingUp className="h-4 w-4 text-secondary-foreground" />
                        ערך למשקיעים
                      </h4>
                      <ul className="space-y-2">
                        {phase.valueInvestors.map((point, idx) => (
                          <li key={idx} className="flex items-start gap-3 text-sm">
                            <CheckCircle2 className="text-secondary-foreground mt-0.5 h-4 w-4 shrink-0" />
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

      <Card className="border shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">הערות חשובות</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
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
