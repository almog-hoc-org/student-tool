import { Card, CardContent } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Trophy, TrendingUp, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { GlossaryLink } from '@/components/GlossaryLink';
import { cn } from '@/lib/utils';
import type { RankingResult, DealAssessment, ComponentScores } from '@/lib/deal-ranking';

const COMPONENT_LABELS: Array<{ key: keyof ComponentScores; label: React.ReactNode }> = [
  { key: 'cashflow', label: 'תזרים' },
  { key: 'irr', label: <GlossaryLink term="irr">IRR</GlossaryLink> },
  { key: 'profit', label: 'רווח על ההון' },
  { key: 'risk', label: 'ביטחון' },
];

const GRADE_STYLES: Record<DealAssessment['grade'], string> = {
  'מצוינת': 'bg-green-50 text-green-700 border-green-200 dark:bg-green-950/40 dark:text-green-400 dark:border-green-800',
  'טובה': 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800',
  'סבירה': 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800',
  'חלשה': 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-400 dark:border-red-800',
};

function ScoreBar({ value }: { value: number }) {
  return (
    <div className="h-2 flex-1 rounded-full bg-muted overflow-hidden">
      <div
        className={cn(
          'h-full rounded-full transition-all',
          value >= 60 ? 'bg-green-500' : value >= 45 ? 'bg-amber-500' : 'bg-red-500',
        )}
        style={{ width: `${value}%` }}
      />
    </div>
  );
}

export function DealVerdictPanel({ ranking }: { ranking: RankingResult }) {
  if (!ranking.winner) return null;

  return (
    <Card className="border-primary/20 bg-primary/5 shadow-sm">
      <CardContent className="p-4 space-y-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 shrink-0 rounded-xl bg-primary/10 flex items-center justify-center">
            <Trophy className="w-5 h-5 text-primary" />
          </div>
          <div className="min-w-0">
            <h2 className="font-bold text-base leading-snug">{ranking.headline}</h2>
            {ranking.subline && (
              <p className="text-sm text-muted-foreground mt-0.5">{ranking.subline}</p>
            )}
            <p className="text-[11px] text-muted-foreground mt-1">
              הציון מבוסס על תרחיש בינוני, לפי ההעדפה שבחרת. זו עזרה להחלטה — לא תחליף לבדיקה מקצועית.
            </p>
          </div>
        </div>

        <div className="space-y-2">
          {ranking.ranked.map((deal) => (
            <div key={deal.snapshotId} className="rounded-xl border bg-background p-3">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={cn(
                  'inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold',
                  deal.rank === 1 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground',
                )}>
                  {deal.rank}
                </span>
                <span className="font-semibold truncate">{deal.name}</span>
                <Badge variant="outline" className={GRADE_STYLES[deal.grade]}>{deal.grade}</Badge>
                <span className="ms-auto text-lg font-bold tabular-nums">{deal.score}<span className="text-xs text-muted-foreground font-normal">/100</span></span>
              </div>

              <div className="mt-2 grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-1.5">
                {COMPONENT_LABELS.map(({ key, label }) => (
                  <div key={key} className="flex items-center gap-2 text-[11px] text-muted-foreground">
                    <span className="w-16 shrink-0">{label}</span>
                    <ScoreBar value={deal.components[key]} />
                    <span className="w-6 text-end tabular-nums">{deal.components[key]}</span>
                  </div>
                ))}
              </div>

              {(deal.strengths.length > 0 || deal.risks.length > 0) && (
                <Accordion type="single" collapsible className="mt-1">
                  <AccordionItem value="details" className="border-0">
                    <AccordionTrigger className="py-1.5 text-xs text-muted-foreground hover:no-underline">
                      למה הציון הזה? ({deal.strengths.length} חוזקות, {deal.risks.length} סיכונים)
                    </AccordionTrigger>
                    <AccordionContent className="pb-1 space-y-1.5">
                      {deal.strengths.map((s) => (
                        <p key={s} className="flex items-start gap-1.5 text-xs">
                          <CheckCircle2 className="w-3.5 h-3.5 mt-0.5 shrink-0 text-green-600" />
                          <span>{s}</span>
                        </p>
                      ))}
                      {deal.risks.map((r) => (
                        <p key={r} className="flex items-start gap-1.5 text-xs">
                          <ShieldAlert className="w-3.5 h-3.5 mt-0.5 shrink-0 text-amber-600" />
                          <span>{r}</span>
                        </p>
                      ))}
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              )}
            </div>
          ))}
        </div>

        {!ranking.isSingleDeal && (
          <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <TrendingUp className="w-3.5 h-3.5" />
            שנה את "מה חשוב לך" למעלה כדי לראות איך הדירוג משתנה לפי סדר העדיפויות שלך.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
