import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, Clock, Bookmark, MessageCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

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
  const [resume, setResume] = useState<ResumeHint | null>(null);

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

  return (
    <Card className="mb-4 bg-gradient-to-br from-primary/5 via-background to-background">
      <CardContent className="p-4 flex items-center gap-3">
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
              התחל עם מחשבון התקציב — ובוא נראה מה אתה יכול לקנות.
            </p>
          )}
        </div>
        {resume && (
          <Link to={resume.link}>
            <Button size="sm" variant="outline" className="gap-1">
              <Clock className="w-3.5 h-3.5" />
              חזור
            </Button>
          </Link>
        )}
      </CardContent>
    </Card>
  );
}
