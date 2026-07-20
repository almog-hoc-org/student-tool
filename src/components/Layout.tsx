import { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Wallet, TrendingUp, Home, MessageCircle, Settings, LogOut, UserCircle, User, Search, HelpCircle } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';
import { NotificationCenter } from './NotificationCenter';
import { Logo } from './Logo';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

// ניווט אחד ויחיד — 5 יעדים זהים בדסקטופ ובמובייל.
// מדריך/אזור אישי/ניהול יושבים בתפריט האווטאר; השוואת עסקאות
// נגישה כטאב משני בתוך "נכסים" (property-check + deal-comparison).
const navTabs = [
  { name: 'תקציב', href: '/', icon: Wallet, activePrefixes: [] as string[] },
  { name: 'תוכנית עסקית', href: '/business-plan', icon: TrendingUp, activePrefixes: ['/business-plan'] },
  { name: 'משכנתא', href: '/mortgage', icon: Home, activePrefixes: ['/mortgage'] },
  { name: 'נכסים', href: '/property-check', icon: Search, activePrefixes: ['/property-check', '/deal-comparison'] },
  { name: 'יועץ', href: '/chat', icon: MessageCircle, activePrefixes: ['/chat'] },
];

function isTabActive(tab: (typeof navTabs)[number], currentPath: string): boolean {
  if (tab.href === '/') return currentPath === '/';
  return tab.activePrefixes.some((p) => currentPath.startsWith(p));
}

export function Layout({ children }: { children: ReactNode }) {
  const location = useLocation();
  const currentPath = location.pathname;
  const { profile, isAdmin, signOut } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur-sm pt-[env(safe-area-inset-top)]">
        <div className="px-4 h-14 flex items-center justify-between max-w-5xl mx-auto">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center">
              <Logo className="w-[22px] h-[22px] text-primary-foreground" />
            </div>
            <span className="font-bold text-base font-display">הדרך לדירה</span>
          </Link>
          <div className="flex items-center gap-2">
            <NotificationCenter />
            <ThemeToggle />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full">
                  {profile?.avatar_url ? (
                    <img
                      src={profile.avatar_url}
                      alt={profile?.display_name || 'תמונת פרופיל'}
                      className="w-8 h-8 rounded-full"
                    />
                  ) : (
                    <UserCircle className="w-5 h-5" />
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" dir="rtl">
                <div className="px-3 py-2 text-sm">
                  <p className="font-medium">{profile?.display_name || 'משתמש'}</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/guide" className="gap-2">
                    <HelpCircle className="w-4 h-4" />
                    מדריך שימוש
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/account" className="gap-2">
                    <User className="w-4 h-4" />
                    האזור שלי
                  </Link>
                </DropdownMenuItem>
                {isAdmin && (
                  <DropdownMenuItem asChild>
                    <Link to="/admin" className="gap-2">
                      <Settings className="w-4 h-4" />
                      ניהול
                    </Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={signOut} className="gap-2 text-destructive">
                  <LogOut className="w-4 h-4" />
                  התנתק
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Desktop top tabs */}
      <div className="hidden md:block border-b border-border bg-background">
        <div className="max-w-5xl mx-auto flex overflow-x-auto no-scrollbar">
          {navTabs.map((tab) => {
            const isActive = isTabActive(tab, currentPath);
            return (
              <Link
                key={tab.href}
                to={tab.href}
                className={cn(
                  'flex shrink-0 items-center gap-2 px-3 py-3 text-sm font-medium border-b-2 transition-colors lg:px-5',
                  isActive
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                )}
              >
                <tab.icon className="w-4 h-4" />
                {tab.name}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Main Content */}
      <main className="pb-20 md:pb-8 px-4 py-4 sm:px-6">
        <div className="max-w-5xl mx-auto">
          {children}
        </div>
      </main>

      {/* Mobile Bottom Tab Bar - exactly 5 tabs, fills the viewport width */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-t border-border pb-[env(safe-area-inset-bottom)]">
        <div className="flex h-16 px-1">
          {navTabs.map((tab) => {
            const isActive = isTabActive(tab, currentPath);
            return (
              <Link
                key={tab.href}
                to={tab.href}
                className={cn(
                  'flex flex-1 min-w-0 flex-col items-center justify-center gap-1 py-2 rounded-xl transition-colors',
                  isActive
                    ? 'text-primary'
                    : 'text-muted-foreground'
                )}
              >
                <tab.icon className={cn('w-5 h-5', isActive && 'scale-110')} />
                <span className="text-[10px] font-semibold leading-tight text-center truncate w-full px-0.5">{tab.name}</span>
                {isActive && <div className="w-1.5 h-1.5 rounded-full bg-primary" />}
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
