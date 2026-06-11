import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Sparkles, Clock, Bookmark, MessageCircle, Target } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useJourney } from '@/hooks/useJourney';
import { JourneyStepper } from '@/components/journey/JourneyStepper';
import { GoalForm } from '@/components/goal/GoalForm';
import { LABELS } from '@/lib/content/labels';

interface ResumeHint {
  kind: 'snapshot' | 'conversation';
  label: string;
  link: string;
  when: string;
}

function greetingFor(name: string | null | undefined): string {
  const hour = new Date().getHours();
  const prefix =
    hour < 6
      ? 'לילה טוב'
      : hour < 12
        ? 'בוקר טוב'
        : hour < 18
          ? 'צהריים טובים'
          : 'ערב טוב';
  return name ? `${prefix}, ${name}!` : `${prefix}!`;
}

export function HomeGreeting() {
  const { user, profile } = useAuth();
  const { isDone, refresh } = useJourney();
  const [searchParams, setSearchParams] = useSearchParams();
  const [resume, setResume] = useState<ResumeHint | null>(null);
  const [goalOpen, setGoalOpen] = useState(false);

  // Onboarding hands off with ?goal=1 — open the goal dialog directly.
  useEffect(() => {
    if (searchParams.get('goal') === '1') {
      setGoalOpen(true);
      searchParams.delete('goal');
      setSearchParams(searchParams, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!user) return;
    (async () => {
      // Look at most-recent snapshot OR conversation, pick whichever is newer.
      const [{ data: snap }, { data: convo }] = await Promise.all([
        supabase
          .from('calculation_snapshots')
          .select('name, tool_key, created_at')
          .order('created_at', { ascending: false })
          .limit(1),
        supabase
          .from('conversations')
          .select('id, title, last_message_at, status')
          .order('last_message_at', { ascending: false })
          .limit(1),
      ]);

      const candidates: ResumeHint[] = [];
      if (snap && snap[0]) {
        candidates.push({
          kind: 'snapshot',
          label: `המשך מ-"${snap[0].name}"`,
          link: '/account',
          when: snap[0].created_at,
        });
      }
      if (convo && convo[0]) {
        candidates.push({
          kind: 'conversation',
          label:
            convo[0].status === 'awaiting_human'
              ? 'הפנייה שלך ממתינה לנציג'
              : 'המשך את השיחה האחרונה',
          link: '/chat',
          when: convo[0].last_message_at,
        });
      }
      if (candidates.length === 0) return;
      candidates.sort((a, b) => (a.when < b.when ? 1 : -1));
      setResume(candidates[0]);
    })();
  }, [user]);

  const needsGoal = !isDone('goal');

  return (
    <>
      <Card className="mb-4">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold truncate">
                {greetingFor(profile?.display_name)}
              </p>
              {resume ? (
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  {resume.kind === 'snapshot' ? (
                    <Bookmark className="w-3 h-3" />
                  ) : (
                    <MessageCircle className="w-3 h-3" />
                  )}
                  {resume.label}
                </p>
              ) : (
                <p className="text-xs text-muted-foreground">
                  המסע שלך לדירה מתחיל כאן — שלב אחרי שלב.
                </p>
              )}
            </div>
            {needsGoal ? (
              <Button
                size="sm"
                onClick={() => setGoalOpen(true)}
                className="gap-1.5 bg-gold text-foreground hover:bg-gold/90 shrink-0"
              >
                <Target className="w-3.5 h-3.5" />
                הגדר יעד
              </Button>
            ) : resume ? (
              <Link to={resume.link}>
                <Button size="sm" variant="outline" className="gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  חזור
                </Button>
              </Link>
            ) : null}
          </div>

          {/* Journey progress — single compact line, no separate card */}
          <div className="border-t pt-3">
            <JourneyStepper variant="compact" onGoalClick={() => setGoalOpen(true)} />
          </div>
        </CardContent>
      </Card>

      <Dialog open={goalOpen} onOpenChange={setGoalOpen}>
        <DialogContent className="max-w-lg max-h-[85dvh] overflow-y-auto" dir="rtl">
          <DialogHeader>
            <DialogTitle>{LABELS.goal.title}</DialogTitle>
          </DialogHeader>
          <GoalForm
            compact
            onSaved={() => {
              setGoalOpen(false);
              refresh();
            }}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
