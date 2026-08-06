import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, Lightbulb, ArrowLeft } from 'lucide-react';
import { insightsForTool, type Insight } from '@/lib/insights-engine';
import { cn } from '@/lib/utils';

/**
 * האזהרות וההמלצות הדחופות של כלי — מוצגות בעמוד התוצאות עצמו.
 * לפני זה כל התובנות חיו בפאנל מכווץ בעמוד הצ'אט בלבד, ותלמיד שלא
 * פתח אותו מעולם לא ראה אזהרת תזרים שלילי או DTI חורג.
 *
 * recomputeKey: ערך שמשתנה עם התוצאה — מרענן את התובנות אחרי כל חישוב.
 */
export function PageInsights({ tool, recomputeKey }: { tool: string; recomputeKey?: unknown }) {
  const [items, setItems] = useState<Insight[]>([]);

  // התובנות נקראות מ-localStorage, שנכתב ב-effect של עמוד הכלי —
  // דחייה קצרה מבטיחה שהחישוב רואה את הערכים העדכניים ולא את הקודמים
  useEffect(() => {
    const t = setTimeout(() => setItems(insightsForTool(tool)), 100);
    return () => clearTimeout(t);
  }, [tool, recomputeKey]);

  if (items.length === 0) return null;

  return (
    <div className="space-y-2">
      {items.map((insight, i) => {
        const isWarning = insight.type === 'warning';
        const Icon = isWarning ? AlertTriangle : Lightbulb;
        return (
          <div
            key={i}
            className={cn(
              'rounded-xl border px-4 py-3 text-sm flex items-start gap-2',
              isWarning
                ? 'border-red-300 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-950/40 dark:text-red-300'
                : 'border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-300',
            )}
          >
            <Icon className="w-4 h-4 mt-0.5 shrink-0" />
            <div className="min-w-0">
              <span className="font-semibold">{insight.title}.</span> {insight.description}
              {insight.href && insight.tool !== tool && (
                <>
                  {' '}
                  <Link to={insight.href} className="underline underline-offset-2 font-medium inline-flex items-center gap-0.5">
                    לטיפול <ArrowLeft className="w-3 h-3" />
                  </Link>
                </>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
