import { ReactNode, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Home,
  Calculator,
  Hammer,
  ClipboardCheck,
  Calendar,
  Building2,
  TrendingUp,
  Menu,
  ChevronRight,
  LayoutDashboard,
  BookOpen,
  MoreHorizontal,
  Bookmark,
  Receipt,
  X
} from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';
import { UserMenu } from './UserMenu';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface NavGroup {
  label: string;
  items: NavItem[];
}

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const navGroups: NavGroup[] = [
  {
    label: 'הערכת כדאיות',
    items: [
      { name: 'בדיקה פיננסית', href: '/financial-checkup', icon: Calculator },
      { name: 'תוכנית עסקית', href: '/deal-business-plan', icon: TrendingUp },
    ]
  },
  {
    label: 'מימון',
    items: [
      { name: 'מחשבון משכנתא', href: '/mortgage-calculator', icon: Home },
      { name: 'מס רכישה', href: '/purchase-tax', icon: Receipt },
    ]
  },
  {
    label: 'בדיקת נכס',
    items: [
      { name: 'כדאיות שיפוץ', href: '/renovation-feasibility', icon: Hammer },
      { name: 'ביקור בנכס', href: '/property-visit', icon: ClipboardCheck },
    ]
  },
  {
    label: 'תהליכים',
    items: [
      { name: 'ציר זמן', href: '/transaction-timeline', icon: Calendar },
      { name: 'התחדשות עירונית', href: '/urban-renewal', icon: Building2 },
    ]
  },
];

const flatNavItems = navGroups.flatMap(g => g.items);
const bottomTabItems = [
  flatNavItems[0], // בדיקה פיננסית
  flatNavItems[2], // מחשבון משכנתא
  flatNavItems[1], // תוכנית עסקית
  flatNavItems[4], // ביקור בנכס
];

const utilityNav = [
  { name: 'סטטיסטיקות', href: '/dashboard', icon: LayoutDashboard },
  { name: 'תרחישים שמורים', href: '/history', icon: Bookmark },
  { name: 'מילון מונחים', href: '/glossary', icon: BookOpen },
];

function getPageTitle(pathname: string): string {
  const all = [...flatNavItems, ...utilityNav, { name: 'דף הבית', href: '/' }];
  return all.find(n => n.href === pathname)?.name || '';
}

function SidebarNavItem({ item, isActive, onClick }: { item: NavItem; isActive: boolean; onClick?: () => void }) {
  return (
    <Link
      to={item.href}
      onClick={onClick}
      className={cn(
        'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 text-sm',
        isActive
          ? 'bg-[hsl(var(--sidebar-primary))] text-[hsl(var(--sidebar-primary-foreground))] font-medium shadow-md'
          : 'text-[hsl(var(--sidebar-foreground)/0.7)] hover:bg-[hsl(var(--sidebar-accent))] hover:text-[hsl(var(--sidebar-foreground))]'
      )}
    >
      <item.icon className="w-4.5 h-4.5 flex-shrink-0" />
      <span>{item.name}</span>
    </Link>
  );
}

export function Layout({ children }: { children: ReactNode }) {
  const location = useLocation();
  const currentPath = location.pathname;
  const pageTitle = getPageTitle(currentPath);
  const isHomePage = currentPath === '/';
  const isMobile = useIsMobile();
  const [moreOpen, setMoreOpen] = useState(false);

  const isCalculatorPage = flatNavItems.some(item => item.href === currentPath);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border/40 bg-background/85 backdrop-blur-xl">
        <div className="max-w-[1400px] mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Mobile Menu (only on non-calculator pages) */}
            {!isCalculatorPage && (
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="lg:hidden">
                    <Menu className="w-5 h-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-72 p-0 bg-[hsl(var(--sidebar-background))]">
                  <div className="p-5 border-b border-[hsl(var(--sidebar-border))]">
                    <Link to="/" className="flex items-center gap-2.5">
                      <div className="w-9 h-9 bg-[hsl(var(--sidebar-primary))] rounded-lg flex items-center justify-center">
                        <Home className="w-4.5 h-4.5 text-white" />
                      </div>
                      <div>
                        <h2 className="font-bold text-[hsl(var(--sidebar-foreground))]">נווט הבית</h2>
                        <p className="text-xs text-[hsl(var(--sidebar-foreground)/0.5)]">כלים חכמים לנדל"ן</p>
                      </div>
                    </Link>
                  </div>
                  <nav className="p-3 space-y-4">
                    {navGroups.map((group) => (
                      <div key={group.label}>
                        <p className="text-xs font-medium text-[hsl(var(--sidebar-foreground)/0.4)] px-3 mb-1.5 uppercase tracking-wider">{group.label}</p>
                        <div className="space-y-0.5">
                          {group.items.map((item) => (
                            <SidebarNavItem
                              key={item.href}
                              item={item}
                              isActive={currentPath === item.href}
                            />
                          ))}
                        </div>
                      </div>
                    ))}
                    <div className="border-t border-[hsl(var(--sidebar-border))] pt-3">
                      {utilityNav.map((item) => (
                        <SidebarNavItem
                          key={item.href}
                          item={item}
                          isActive={currentPath === item.href}
                        />
                      ))}
                    </div>
                  </nav>
                </SheetContent>
              </Sheet>
            )}

            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 group">
              <div className="w-8 h-8 bg-gradient-to-br from-primary to-primary/70 rounded-lg flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow duration-200">
                <Home className="w-4 h-4 text-primary-foreground" />
              </div>
              <div className="hidden sm:block">
                <span className="font-bold text-sm text-gradient-primary">נווט הבית</span>
              </div>
            </Link>
          </div>

          {/* Breadcrumbs - Desktop */}
          {!isHomePage && pageTitle && (
            <Breadcrumb className="hidden md:flex">
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink asChild>
                    <Link to="/" className="text-muted-foreground hover:text-foreground text-sm">
                      דף הבית
                    </Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator>
                  <ChevronRight className="w-3.5 h-3.5" />
                </BreadcrumbSeparator>
                <BreadcrumbItem>
                  <BreadcrumbPage className="text-sm">{pageTitle}</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          )}

          <div className="flex items-center gap-1.5">
            <ThemeToggle />
            <UserMenu />
          </div>
        </div>
      </header>

      <div className="flex min-h-[calc(100vh-3.5rem)]">
        {/* Desktop Sidebar - only on calculator pages */}
        {isCalculatorPage && !isMobile && (
          <aside className="w-[240px] flex-shrink-0 bg-[hsl(var(--sidebar-background))] border-l border-[hsl(var(--sidebar-border))] sticky top-14 h-[calc(100vh-3.5rem)] overflow-y-auto">
            {/* Sidebar brand */}
            <div className="px-4 py-4 border-b border-[hsl(var(--sidebar-border))]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 bg-gradient-to-br from-[hsl(var(--sidebar-primary))] to-[hsl(var(--sidebar-primary)/0.7)] rounded-lg flex items-center justify-center shadow-sm">
                  <Home className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="font-bold text-sm text-[hsl(var(--sidebar-foreground))]">נווט הבית</p>
                  <p className="text-[10px] text-[hsl(var(--sidebar-foreground)/0.45)]">כלים חכמים לנדל"ן</p>
                </div>
              </div>
            </div>
            <nav className="p-3 space-y-4">
              {navGroups.map((group) => (
                <div key={group.label}>
                  <p className="text-[10px] font-semibold text-[hsl(var(--sidebar-foreground)/0.35)] px-3 mb-1.5 uppercase tracking-widest">{group.label}</p>
                  <div className="space-y-0.5">
                    {group.items.map((item) => (
                      <SidebarNavItem
                        key={item.href}
                        item={item}
                        isActive={currentPath === item.href}
                      />
                    ))}
                  </div>
                </div>
              ))}
              <div className="border-t border-[hsl(var(--sidebar-border))] pt-3 space-y-0.5">
                {utilityNav.map((item) => (
                  <SidebarNavItem
                    key={item.href}
                    item={item}
                    isActive={currentPath === item.href}
                  />
                ))}
              </div>
            </nav>
          </aside>
        )}

        {/* Main Content */}
        <main className={cn(
          'flex-1 pb-8',
          isCalculatorPage && !isMobile && 'max-w-[1100px]',
          isMobile && isCalculatorPage && 'pb-24'
        )}>
          <AnimatePresence mode="wait">
            <motion.div
              key={currentPath}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
              className="p-4 sm:p-6"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Mobile Bottom Tab Bar - only on calculator pages */}
      {isCalculatorPage && isMobile && (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-xl border-t border-border/50 safe-area-bottom">
          <div className="flex items-center justify-around h-16 px-1">
            {bottomTabItems.map((item) => {
              const isActive = currentPath === item.href;
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  className={cn(
                    'flex flex-col items-center justify-center gap-0.5 flex-1 py-1.5 rounded-lg transition-all',
                    isActive
                      ? 'text-primary'
                      : 'text-muted-foreground'
                  )}
                >
                  <item.icon className={cn('w-5 h-5 transition-transform duration-200', isActive && 'scale-110')} />
                  <span className="text-[10px] font-medium">{item.name.split(' ')[0]}</span>
                  {isActive && <div className="w-1 h-1 rounded-full bg-primary" />}
                </Link>
              );
            })}
            {/* More button */}
            <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
              <SheetTrigger asChild>
                <button className="flex flex-col items-center justify-center gap-0.5 flex-1 py-1.5 text-muted-foreground">
                  <MoreHorizontal className="w-5 h-5" />
                  <span className="text-[10px] font-medium">עוד</span>
                </button>
              </SheetTrigger>
              <SheetContent side="bottom" className="rounded-t-2xl pb-safe">
                <div className="grid grid-cols-2 gap-3 p-4">
                  {[...flatNavItems.filter(item => !bottomTabItems.includes(item)), ...utilityNav].map((item) => (
                    <Link
                      key={item.href}
                      to={item.href}
                      onClick={() => setMoreOpen(false)}
                      className={cn(
                        'flex flex-col items-center gap-2 p-3 rounded-xl transition-all',
                        currentPath === item.href
                          ? 'bg-primary/10 text-primary'
                          : 'bg-muted/50 text-muted-foreground hover:bg-muted'
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
      )}

      {/* Footer - only on non-calculator pages */}
      {!isCalculatorPage && (
        <footer className="border-t border-border/30 py-8 mt-auto">
          <div className="max-w-6xl mx-auto px-4 text-center text-sm text-muted-foreground space-y-1">
            <p className="font-medium">נווט הבית — כלים חכמים לנדל״ן ישראלי</p>
            <p className="text-xs opacity-50">
              המידע להמחשה בלבד ואינו מהווה ייעוץ פיננסי או משפטי
            </p>
          </div>
        </footer>
      )}
    </div>
  );
}
