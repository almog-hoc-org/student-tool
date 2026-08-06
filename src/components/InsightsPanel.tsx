import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Sparkles,
  TrendingUp,
  AlertTriangle,
  Lightbulb,
  ArrowLeft,
  ChevronDown,
} from 'lucide-react';
import { useInsights, type Insight } from '@/hooks/useInsights';
import { LoadingState } from '@/components/ui/loading-state';
import { cn } from '@/lib/utils';

const iconMap = {
  warning: AlertTriangle,
  recommendation: Lightbulb,
  insight: TrendingUp,
  next_step: ArrowLeft,
};

const colorMap = {
  warning: 'text-red-500 bg-red-500/10',
  recommendation: 'text-blue-500 bg-blue-500/10',
  insight: 'text-green-500 bg-green-500/10',
  next_step: 'text-amber-500 bg-amber-500/10',
};

const labelMap = {
  warning: 'אזהרה',
  recommendation: 'המלצה',
  insight: 'תובנה',
  next_step: 'צעד הבא',
};

function InsightCard({ insight }: { insight: Insight }) {
  const Icon = iconMap[insight.type];
  return (
    <Card>
      <CardContent className="p-4 flex gap-3">
        <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center shrink-0', colorMap[insight.type])}>
          <Icon className="w-5 h-5" />
        </div>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground">{labelMap[insight.type]}</span>
            {insight.tool && (
              <span className="text-xs bg-muted px-1.5 py-0.5 rounded">{insight.tool}</span>
            )}
          </div>
          <p className="text-sm font-medium">{insight.title}</p>
          <p className="text-sm text-muted-foreground">{insight.description}</p>
          {insight.href && (
            <Link to={insight.href} className="text-xs text-primary inline-flex items-center gap-1 underline-offset-4 hover:underline">
              עבור לכלי <ArrowLeft className="w-3 h-3" />
            </Link>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Collapsible "תובנות" panel — local analysis of the student's saved data.
 * Lives at the top of the Chat page (the single AI surface).
 */
export function InsightsPanel() {
  const { insights, loading, analyze, hasData } = useInsights();
  const [open, setOpen] = useState(false);

  if (!hasData) return null;

  // ניתוח מחדש בכל פתיחה — הנתונים משתנים בין ביקורים, והפאנל הציג
  // בעבר אזהרות של אתמול כי חושב פעם אחת בלבד
  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (next) analyze();
  };

  return (
    <Collapsible open={open} onOpenChange={handleOpenChange} className="mb-3">
      <CollapsibleTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="w-full justify-between gap-2"
        >
          <span className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            תובנות מהנתונים שלך
          </span>
          <ChevronDown className={cn('w-4 h-4 transition-transform', open && 'rotate-180')} />
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="pt-2 space-y-2">
        {loading ? (
          <LoadingState compact label="מנתח נתונים…" />
        ) : insights.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-2">
            אין תובנות עדיין — מלא עוד נתונים בכלים.
          </p>
        ) : (
          insights.map((insight, i) => <InsightCard key={i} insight={insight} />)
        )}
      </CollapsibleContent>
    </Collapsible>
  );
}
