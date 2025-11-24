import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Clock, AlertTriangle, TrendingUp, Users, Building, CheckCircle2 } from 'lucide-react';
import { he } from '@/lib/translations/he';

const UrbanRenewal = () => {
  const [expandedPhase, setExpandedPhase] = useState<string>('phase-1');

  return (
    <div className="space-y-6 pb-8">
      <Card className="border-0 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-primary/5 via-background to-secondary/5">
          <CardTitle className="text-3xl font-bold">{he.urbanRenewal.title}</CardTitle>
          <CardDescription className="text-base">
            {he.urbanRenewal.description}
          </CardDescription>
        </CardHeader>
      </Card>

      <Card className="bg-gradient-to-r from-primary/10 to-secondary/10 border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-xl">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
              <Clock className="h-5 w-5 text-primary-foreground" />
            </div>
            ציר זמן כולל טיפוסי
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold text-primary mb-2">5-10 שנים</p>
          <p className="text-base text-muted-foreground">
            מהתארגנות ראשונית ועד מסירה סופית. משך הזמן בפועל משתנה משמעותית לפי מיקום, מורכבות הפרויקט ותנאי שוק.
          </p>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <h3 className="text-2xl font-bold">שלבי הפרויקט</h3>
        <Accordion type="single" collapsible value={expandedPhase} onValueChange={setExpandedPhase} className="space-y-3">
          {he.urbanRenewal.phases.map((phase, index) => {
            const phaseColors = ['from-blue-50', 'from-emerald-50', 'from-orange-50', 'from-purple-50', 'from-pink-50'];
            return (
              <AccordionItem key={index} value={`phase-${index + 1}`} className="border-0 shadow-md rounded-lg overflow-hidden">
                <AccordionTrigger className={`hover:no-underline bg-gradient-to-r ${phaseColors[index % 5]} to-background dark:${phaseColors[index % 5].replace('50', '950')} dark:to-background px-6`}>
                  <div className="flex items-center gap-4 text-right w-full">
                    <div className="shrink-0">
                      <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
                        <CheckCircle2 className="w-5 h-5 text-primary-foreground" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-lg">{phase.name}</p>
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
                    <h4 className="font-bold flex items-center gap-2 mb-3 text-base">
                      <Building className="h-5 w-5 text-primary" />
                      פעילויות מרכזיות
                    </h4>
                    <ul className="space-y-2">
                      {phase.activities.map((activity, idx) => (
                        <li key={idx} className="flex items-start gap-3 text-base">
                          <CheckCircle2 className="text-primary mt-0.5 h-5 w-5 shrink-0" />
                          <span>{activity}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Main Risks */}
                  <div className="p-4 bg-destructive/5 rounded-lg">
                    <h4 className="font-bold flex items-center gap-2 mb-3 text-base">
                      <AlertTriangle className="h-5 w-5 text-destructive" />
                      סיכונים עיקריים
                    </h4>
                    <ul className="space-y-2">
                      {phase.risks.map((risk, idx) => (
                        <li key={idx} className="flex items-start gap-3 text-base">
                          <AlertTriangle className="text-destructive mt-0.5 h-5 w-5 shrink-0" />
                          <span>{risk}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    {/* For Residents */}
                    <div className="p-4 bg-emerald-50 dark:bg-emerald-950 rounded-lg">
                      <h4 className="font-bold flex items-center gap-2 mb-3 text-base">
                        <Users className="h-5 w-5 text-emerald-600" />
                        ערך לדיירים
                      </h4>
                      <ul className="space-y-2">
                        {phase.valueResidents.map((point, idx) => (
                          <li key={idx} className="flex items-start gap-3 text-base">
                            <CheckCircle2 className="text-emerald-600 mt-0.5 h-5 w-5 shrink-0" />
                            <span>{point}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* For Investors */}
                    <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
                      <h4 className="font-bold flex items-center gap-2 mb-3 text-base">
                        <TrendingUp className="h-5 w-5 text-blue-600" />
                        ערך למשקיעים
                      </h4>
                      <ul className="space-y-2">
                        {phase.valueInvestors.map((point, idx) => (
                          <li key={idx} className="flex items-start gap-3 text-base">
                            <CheckCircle2 className="text-blue-600 mt-0.5 h-5 w-5 shrink-0" />
                            <span>{point}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
            );
          })}
        </Accordion>
      </div>

      <Card className="bg-gradient-to-r from-accent/50 to-accent/30 border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl">הערות חשובות</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-base">
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