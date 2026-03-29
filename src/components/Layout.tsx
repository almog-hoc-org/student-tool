import { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Wallet, TrendingUp, Home } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';
import { cn } from '@/lib/utils';

const tabs = [
  { name: 'תקציב', href: '/', icon: Wallet },
  { name: 'תוכנית עסקית', href: '/business-plan', icon: TrendingUp },
  { name: 'משכנתא', href: '/mortgage', icon: Home },
];

export function Layout({ children }: { children: ReactNode }) {
  const location = useLocation();
  const currentPath = location.pathname;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur-sm pt-[env(safe-area-inset-top)]">
        <div className="px-4 h-14 flex items-center justify-between max-w-5xl mx-auto">
          <Link to="/budget" className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center">
              <Home className="w-[18px] h-[18px] text-primary-foreground" />
            </div>
            <span className="font-bold text-base">ארגז הכלים</span>
          </Link>
          <ThemeToggle />
        </div>
      </header>

      {/* Desktop top tabs */}
      <div className="hidden md:block border-b border-border bg-background">
        <div className="max-w-5xl mx-auto flex">
          {tabs.map((tab) => {
            const isActive = currentPath === tab.href;
            return (
              <Link
                key={tab.href}
                to={tab.href}
                className={cn(
                  'flex items-center gap-2 px-6 py-3 text-sm font-medium border-b-2 transition-colors',
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

      {/* Mobile Bottom Tab Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-t border-border pb-[env(safe-area-inset-bottom)]">
        <div className="flex items-center justify-around h-16 px-2">
          {tabs.map((tab) => {
            const isActive = currentPath === tab.href;
            return (
              <Link
                key={tab.href}
                to={tab.href}
                className={cn(
                  'flex flex-col items-center justify-center gap-1 flex-1 py-2 rounded-xl transition-colors',
                  isActive
                    ? 'text-primary'
                    : 'text-muted-foreground'
                )}
              >
                <tab.icon className={cn('w-5 h-5', isActive && 'scale-110')} />
                <span className="text-[11px] font-semibold">{tab.name}</span>
                {isActive && <div className="w-1.5 h-1.5 rounded-full bg-primary" />}
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
