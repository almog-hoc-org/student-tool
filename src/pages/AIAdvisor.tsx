import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sparkles, TrendingUp, AlertTriangle, Lightbulb, ArrowLeft, Loader2 } from 'lucide-react';
import { useInsights, type Insight } from '@/hooks/useInsights';
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
        </div>
      </CardContent>
    </Card>
  );
}

export default function AIAdvisor() {
  const { profile } = useAuth();
  const { insights, loading, analyze, hasData } = useInsights();
  const [analyzed, setAnalyzed] = useState(false);

  const handleAnalyze = () => {
    analyze();
    setAnalyzed(true);
  };

  return (
    <div className="space-y-6" dir="rtl">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-primary" />
          יועץ חכם
        </h1>
        <p className="text-muted-foreground text-sm">
          ניתוח אוטומטי של כל הנתונים שהכנסת — תקציב, תוכנית עסקית ומשכנתא — עם תובנות והמלצות מותאמות אישית.
        </p>
      </div>

      {!analyzed ? (
        <Card>
          <CardContent className="p-8 text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center">
              <Sparkles className="w-8 h-8 text-primary" />
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold text-lg">
                שלום {profile?.display_name || 'לך'}!
              </h3>
              <p className="text-muted-foreground text-sm max-w-md mx-auto">
                היועץ החכם מנתח את כל הנתונים שהכנסת בכלים השונים ומספק תובנות, אזהרות והמלצות מותאמות אישית.
              </p>
              {!hasData && (
                <p className="text-amber-500 text-sm">
                  טרם הכנסת נתונים בכלים. השתמש קודם במחשבון התקציב, תוכנית עסקית או משכנתא.
                </p>
              )}
            </div>
            <Button onClick={handleAnalyze} size="lg" className="gap-2" disabled={!hasData}>
              <Sparkles className="w-4 h-4" />
              נתח את הנתונים שלי
            </Button>
          </CardContent>
        </Card>
      ) : loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : insights.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">לא נמצאו תובנות. הכנס עוד נתונים בכלים ונסה שוב.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {insights.map((insight, i) => (
            <InsightCard key={i} insight={insight} />
          ))}
          <p className="text-xs text-muted-foreground text-center pt-4">
            * המידע הוא להעשרה בלבד ואינו מהווה ייעוץ פיננסי מקצועי.
          </p>
        </div>
      )}
    </div>
  );
}
