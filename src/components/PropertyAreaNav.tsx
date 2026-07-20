import { Link, useLocation } from 'react-router-dom';
import { Search, BarChart3 } from 'lucide-react';
import { cn } from '@/lib/utils';

// טאבים משניים של אזור "נכסים" — מקשרים בין בדיקת נכס להשוואת עסקאות,
// כך ששני הכלים נגישים גם במובייל דרך פריט הניווט האחד.
const tabs = [
  { name: 'בדיקת נכס', href: '/property-check', icon: Search },
  { name: 'השוואת עסקאות', href: '/deal-comparison', icon: BarChart3 },
];

export function PropertyAreaNav() {
  const { pathname } = useLocation();
  return (
    <div className="flex gap-1 rounded-xl bg-muted/60 p-1 w-fit">
      {tabs.map((tab) => {
        const isActive = pathname.startsWith(tab.href);
        return (
          <Link
            key={tab.href}
            to={tab.href}
            className={cn(
              'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors',
              isActive
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <tab.icon className="w-4 h-4" />
            {tab.name}
          </Link>
        );
      })}
    </div>
  );
}
