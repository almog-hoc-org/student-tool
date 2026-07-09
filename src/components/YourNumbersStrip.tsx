import { Link, useLocation } from 'react-router-dom';
import { getToolSummaries } from '@/lib/tool-summaries';
import { cn } from '@/lib/utils';

/**
 * רצועת "המספרים שלך" — צ'יפים קומפקטיים עם הנתונים השמורים של התלמיד.
 * מוצגת רק כשיש נתונים; בביקור ראשון לא תופסת מקום.
 */
export function YourNumbersStrip() {
  const location = useLocation();
  const items = getToolSummaries().filter(t => t.done && t.summary);

  if (items.length === 0) return null;

  return (
    <div className="flex items-center gap-2 overflow-x-auto no-scrollbar -mx-1 px-1">
      <span className="text-[11px] font-semibold text-muted-foreground shrink-0">
        המספרים שלך:
      </span>
      {items.map(({ key, name, icon: Icon, href, summary }) => {
        const isCurrent = href === location.pathname;
        return (
          <Link
            key={key}
            to={href}
            className={cn(
              'shrink-0 inline-flex items-center gap-1.5 rounded-full border bg-card px-3 py-1.5 text-xs transition-colors',
              isCurrent ? 'border-primary/40 bg-primary/5' : 'hover:border-primary/40 hover:bg-muted/60',
            )}
          >
            <Icon className="w-3.5 h-3.5 text-primary" />
            <span className="font-medium">{name}</span>
            <span className="text-muted-foreground fig">{summary}</span>
          </Link>
        );
      })}
    </div>
  );
}
