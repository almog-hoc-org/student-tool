import { useMemo, useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { generateInsights, type InsightToolKey } from '@/lib/insights-engine';
import { save, load } from '@/lib/storage';
import { useAuth } from '@/contexts/AuthContext';

type DismissedMap = Record<string, string>;

interface InsightBannerProps {
  /** העמוד שבו הבאנר מוצג — מסנן תובנות רלוונטיות בלבד */
  context: InsightToolKey;
  /** ערך שמשתנה כשהתוצאות מתעדכנות — מרענן את התובנות */
  refreshKey?: unknown;
}

/**
 * באנר אזהרה דק לעמודי הכלים: מציג את האזהרה החשובה ביותר מהנתונים
 * של התלמיד. דחייה נשמרת (לפי כותרת) כדי לא להציק שוב.
 */
export function InsightBanner({ context, refreshKey }: InsightBannerProps) {
  const { user } = useAuth();
  const [dismissedTick, setDismissedTick] = useState(0);

  const insight = useMemo(() => {
    const dismissed = load<DismissedMap>('insight_dismissed') ?? {};
    return generateInsights().find(i =>
      i.type === 'warning'
      && (i.toolKey === context || i.toolKey === undefined)
      && !dismissed[i.title],
    ) ?? null;
    // refreshKey/dismissedTick מרעננים את החישוב כשהתוצאות או הדחיות משתנות
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [context, refreshKey, dismissedTick]);

  if (!insight) return null;

  const dismiss = () => {
    const dismissed = load<DismissedMap>('insight_dismissed') ?? {};
    dismissed[insight.title] = new Date().toISOString();
    save('insight_dismissed', dismissed, user?.id);
    setDismissedTick(t => t + 1);
  };

  return (
    <Alert dir="rtl" className="border-amber-500/40 bg-amber-500/10 text-amber-900 dark:text-amber-200 pl-10 relative">
      <AlertTriangle className="h-4 w-4 !text-amber-600" />
      <AlertTitle className="text-sm">{insight.title}</AlertTitle>
      <AlertDescription className="text-xs leading-6">{insight.description}</AlertDescription>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label="סגור התראה"
        onClick={dismiss}
        className="absolute left-2 top-2 h-6 w-6 text-amber-700 hover:text-amber-900 dark:text-amber-300"
      >
        <X className="h-3.5 w-3.5" />
      </Button>
    </Alert>
  );
}
