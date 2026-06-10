import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  ArrowLeft,
  Target,
  Wallet,
  Home,
  Search,
  FileCheck,
  TrendingUp,
  CheckCircle2,
} from 'lucide-react';
import { useJourney } from '@/hooks/useJourney';
import { MILESTONES, type MilestoneKey } from '@/lib/journey';
import { LABELS } from '@/lib/content/labels';

const ROUTES: Record<MilestoneKey, string> = {
  goal: '/account',
  budget: '/',
  business_plan: '/business-plan',
  mortgage: '/mortgage',
  property_check: '/property-check',
  pre_purchase: '/account',
};

const ICONS: Record<MilestoneKey, React.ComponentType<{ className?: string }>> = {
  goal: Target,
  budget: Wallet,
  business_plan: TrendingUp,
  mortgage: Home,
  property_check: Search,
  pre_purchase: FileCheck,
};

const HINTS: Record<MilestoneKey, string> = {
  goal: 'נתחיל בהגדרת היעד שלך — מחיר דירה ולוח זמנים.',
  budget: 'בוא נראה מה אתה יכול לקנות עם ההון וההכנסה שלך.',
  business_plan: 'יש תקציב — נבחן עסקה: איזו דירה, מה ההחזר ופוטנציאל הרווח.',
  mortgage: 'יש לך את העסקה — עכשיו נבנה תמהיל משכנתא שתואם אותה.',
  property_check: 'מצאת נכס מעניין? בוא נבדוק אותו לעומק.',
  pre_purchase: 'כמעט שם — צ׳קליסט אחרון לפני חתימה.',
};

export interface NextStepCardProps {
  /** If provided, skip suggesting the same milestone the user is currently on. */
  currentMilestone?: MilestoneKey;
}

export default function NextStepCard({ currentMilestone }: NextStepCardProps) {
  const { current, completedCount, total } = useJourney();
  // Skip what we are already on — push the next one in the chain.
  const suggestion: MilestoneKey | null = (() => {
    if (current === currentMilestone) {
      const idx = MILESTONES.indexOf(current);
      return MILESTONES[idx + 1] ?? null;
    }
    return current;
  })();

  if (!suggestion) {
    return (
      <Card className="bg-green-500/5 border-green-500/30">
        <CardContent className="flex items-center justify-between gap-4 p-4">
          <div className="flex items-center gap-3 text-green-600">
            <CheckCircle2 className="w-5 h-5" />
            <span className="text-sm font-medium">סיימת את כל שלבי המסע — כל הכבוד!</span>
          </div>
          <Link to="/account">
            <Button variant="outline" size="sm" className="gap-1.5 border-green-500/30 text-green-700">
              {LABELS.account.journeyTitle}
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  const Icon = ICONS[suggestion];
  const stepLabel = LABELS.journey.steps[suggestion].name;

  return (
    <Card className="bg-primary/5 border-primary/20">
      <CardContent className="flex items-center justify-between gap-4 p-4">
        <div className="flex items-center gap-3 text-primary min-w-0">
          <Icon className="w-5 h-5 shrink-0" />
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground">
              {completedCount}/{total} · השלב הבא
            </p>
            <p className="text-sm font-semibold truncate">{stepLabel}</p>
            <p className="text-xs text-muted-foreground line-clamp-2">{HINTS[suggestion]}</p>
          </div>
        </div>
        <Link to={ROUTES[suggestion]} className="shrink-0">
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 border-primary/30 text-primary hover:bg-primary/10"
          >
            {LABELS.journey.nextStepCta}
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}
