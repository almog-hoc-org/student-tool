import { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  User, Sparkles, LogOut, CheckCircle2, Circle,
  MessageCircle, ArrowLeft, Bookmark,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { getToolSummaries } from '@/lib/tool-summaries';
import { SnapshotsList } from '@/components/SnapshotsList';
import { ExpertContactCard } from '@/components/ExpertContactCard';
import { MyActivityCard } from '@/components/MyActivityCard';
import { JourneyStepper } from '@/components/journey/JourneyStepper';
import { GoalForm } from '@/components/goal/GoalForm';
import { GapCard } from '@/components/goal/GapCard';
import { PrePurchaseChecklist } from '@/components/journey/PrePurchaseChecklist';

export default function Account() {
  const { user, profile, signOut, isAdmin } = useAuth();
  const location = useLocation();

  // גלילה לעוגן (למשל /account#pre-purchase מתוך שלב המסע)
  useEffect(() => {
    if (location.hash) {
      document.getElementById(location.hash.slice(1))?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [location.hash]);

  const tools = getToolSummaries();


  const statusLabels: Record<string, string> = {
    pending: 'ממתין לאישור',
    approved: 'מאושר',
    rejected: 'נדחה',
  };

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header with profile */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            {profile?.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt={profile?.display_name || 'תמונת פרופיל'}
                className="w-16 h-16 rounded-full"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="w-8 h-8 text-primary" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-bold truncate">{profile?.display_name || 'משתמש'}</h1>
              <p
                className="text-sm text-muted-foreground truncate inline-block max-w-full"
                style={{ unicodeBidi: 'plaintext' }}
              >
                {user?.email}
              </p>
              <div className="flex gap-2 mt-2">
                <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                  {statusLabels[profile?.status ?? 'pending']}
                </Badge>
                {isAdmin && (
                  <Badge variant="secondary" className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                    מנהל
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Guided journey */}
      <JourneyStepper />

      {/* Goal + gap */}
      <GoalForm />
      <GapCard />

      {/* Tools summary */}
      <div className="space-y-2">
        <h2 className="font-semibold text-sm text-muted-foreground px-1">הנתונים שלי</h2>
        {tools.map(tool => {
          const Icon = tool.icon;
          return (
            <Link key={tool.key} to={tool.href}>
              <Card className={cn('hover:border-primary/50 transition-colors', tool.done && 'bg-muted/30')}>
                <CardContent className="p-4 flex items-center gap-3">
                  <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center shrink-0',
                    tool.done ? 'bg-green-500/10' : 'bg-muted'
                  )}>
                    {tool.done ? (
                      <CheckCircle2 className="w-5 h-5 text-green-500" />
                    ) : (
                      <Icon className="w-5 h-5 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium">{tool.name}</p>
                    <p className="text-sm text-muted-foreground truncate">
                      {tool.summary ?? 'טרם הוזנו נתונים — התחל כאן'}
                    </p>
                  </div>
                  <ArrowLeft className="w-4 h-4 text-muted-foreground shrink-0" />
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      {/* Pre-purchase checklist */}
      <div id="pre-purchase">
        <PrePurchaseChecklist />
      </div>

      {/* Recent activity — gives the student a sense of their journey */}
      <MyActivityCard />

      {/* Expert contact CTA */}
      <ExpertContactCard />

      {/* Saved snapshots */}
      <div className="space-y-2">
        <h2 className="font-semibold text-sm text-muted-foreground px-1 flex items-center gap-1">
          <Bookmark className="w-4 h-4" />
          התרחישים השמורים שלי
        </h2>
        <SnapshotsList />
      </div>

      {/* AI advisor — single entry point (insights live inside the chat) */}
      <Link to="/chat" className="block">
        <Card className="hover:border-primary/50 transition-colors">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm">יועץ חכם</p>
              <p className="text-xs text-muted-foreground">
                צ׳אט + תובנות מהנתונים שלך, במקום אחד
              </p>
            </div>
            <MessageCircle className="w-4 h-4 text-muted-foreground shrink-0" />
          </CardContent>
        </Card>
      </Link>

      {/* Settings */}
      <div className="space-y-2 pt-2">
        <Button
          variant="outline"
          className="w-full justify-start gap-2 text-destructive hover:text-destructive"
          onClick={signOut}
        >
          <LogOut className="w-4 h-4" />
          התנתק
        </Button>
      </div>
    </div>
  );
}
