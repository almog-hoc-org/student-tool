import { ReactNode, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Home,
  Calculator,
  Hammer,
  ClipboardCheck,
  Calendar,
  Building2,
  TrendingUp,
  LayoutDashboard,
  BookOpen,
  MoreHorizontal,
  Bookmark,
  Receipt,
  ArrowRight,
  FileText
} from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';
import { UserMenu } from './UserMenu';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from '@/lib/utils';

interface NavItem {
  name: string;
  shortName: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const allNavItems: NavItem[] = [
  { name: 'בדיקה פיננסית', shortName: 'בדיקה', href: '/financial-checkup', icon: Calculator },
  { name: 'מחשבון משכנתא', shortName: 'משכנתא', href: '/mortgage-calculator', icon: Home },
  { name: 'תוכנית עסקית', shortName: 'תוכנית', href: '/deal-business-plan', icon: TrendingUp },
  { name: 'מס רכישה', shortName: 'מס', href: '/purchase-tax', icon: Receipt },
  { name: 'כדאיות שיפוץ', shortName: 'שיפוץ', href: '/renovation-feasibility', icon: Hammer },
  { name: 'ביקור בנכס', shortName: 'ביקור', href: '/property-visit', icon: ClipboardCheck },
  { name: 'ציר זמן', shortName: 'ציר זמן', href: '/transaction-timeline', icon: Calendar },
  { name: 'התחדשות עירונית', shortName: 'התחדשות', href: '/urban-renewal', icon: Building2 },
];

const bottomTabItems: NavItem[] = [
  allNavItems[0], // בדיקה פיננסית
  allNavItems[1], // מחשבון משכנתא
  allNavItems[2], // תוכנית עסקית
  { name: 'סיכום', shortName: 'סיכום', href: '/summary', icon: FileText },
];

const utilityNav: NavItem[] = [
  { name: 'סטטיסטיקות', shortName: 'סטטיסטיקות', href: '/dashboard', icon: LayoutDashboard },
  { name: 'תרחישים שמורים', shortName: 'שמורים', href: '/history', icon: Bookmark },
  { name: 'מילון מונחים', shortName: 'מילון', href: '/glossary', icon: BookOpen },
];

function getPageTitle(pathname: string): string {
  const all = [...allNavItems, ...utilityNav, { name: 'דף הבית', shortName: 'בית', href: '/' }, { name: 'סיכום', shortName: 'סיכום', href: '/summary' }];
  return all.find(n => n.href === pathname)?.name || '';
}

export function Layout({ children }: { children: ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const currentPath = location.pathname;
  const pageTitle = getPageTitle(currentPath);
  const isHomePage = currentPath === '/';
  const [moreOpen, setMoreOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      {/* Header - compact app-style */}
      <header className="sticky top-0 z-50 border-b border-border bg-background pt-[env(safe-area-inset-top)]">
        <div className="px-4 h-12 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {/* Back button on inner pages */}
            {!isHomePage && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate(-1)}
                className="w-9 h-9"
              >
                <ArrowRight className="w-5 h-5" />
              </Button>
            )}

            {/* Logo */}
            <Link to="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <Home className="w-4 h-4 text-primary-foreground" />
              </div>
              {isHomePage && (
                <span className="font-bold text-sm">נווט הבית</span>
              )}
            </Link>

            {/* Page title on inner pages */}
            {!isHomePage && pageTitle && (
              <span className="font-semibold text-sm truncate">{pageTitle}</span>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            <ThemeToggle />
            <UserMenu />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="pb-20 px-4 py-3 sm:px-6 sm:py-4">
        {children}
      </main>

      {/* Bottom Tab Bar - always visible */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border pb-[env(safe-area-inset-bottom)]">
        <div className="flex items-center justify-around h-16 px-1">
          {bottomTabItems.map((item) => {
            const isActive = currentPath === item.href;
            return (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  'flex flex-col items-center justify-center gap-0.5 flex-1 py-1.5 rounded-lg active:scale-95 transition-colors duration-150',
                  isActive
                    ? 'text-primary'
                    : 'text-muted-foreground'
                )}
              >
                <item.icon className={cn('w-5 h-5', isActive && 'scale-110')} />
                <span className="text-[10px] font-medium">{item.shortName}</span>
                {isActive && <div className="w-1 h-1 rounded-full bg-primary" />}
              </Link>
            );
          })}
          {/* More button */}
          <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
            <SheetTrigger asChild>
              <button className="flex flex-col items-center justify-center gap-0.5 flex-1 py-1.5 text-muted-foreground active:scale-95 transition-colors duration-150">
                <MoreHorizontal className="w-5 h-5" />
                <span className="text-[10px] font-medium">עוד</span>
              </button>
            </SheetTrigger>
            <SheetContent side="bottom" className="rounded-t-2xl pb-safe">
              <div className="grid grid-cols-3 gap-3 p-4">
                {[...allNavItems.filter(item => !bottomTabItems.includes(item)), ...utilityNav].map((item) => (
                  <Link
                    key={item.href}
                    to={item.href}
                    onClick={() => setMoreOpen(false)}
                    className={cn(
                      'flex flex-col items-center gap-2 p-3 rounded-xl active:scale-95 transition-colors duration-150',
                      currentPath === item.href
                        ? 'bg-primary/10 text-primary'
                        : 'bg-muted/50 text-muted-foreground active:bg-muted'
                    )}
                  >
                    <item.icon className="w-6 h-6" />
                    <span className="text-xs font-medium text-center">{item.name}</span>
                  </Link>
                ))}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </div>
  );
}
