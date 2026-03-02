import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calculator,
  Home,
  TrendingUp,
  Hammer,
  ClipboardCheck,
  Calendar,
  Building2,
  MoreHorizontal,
  Bookmark,
  FileDown,
} from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { useDashboard } from '@/contexts/DashboardContext';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';

interface NavItem {
  id: string;
  label: string;
  href: string;
  icon: React.ElementType;
  group: string;
}

const navItems: NavItem[] = [
  { id: 'financial-checkup', label: 'בדיקה פיננסית', href: '/financial-checkup', icon: Calculator, group: 'הערכת כדאיות' },
  { id: 'deal-business-plan', label: 'תוכנית עסקית', href: '/deal-business-plan', icon: TrendingUp, group: 'הערכת כדאיות' },
  { id: 'mortgage-calculator', label: 'מחשבון משכנתא', href: '/mortgage-calculator', icon: Home, group: 'מימון' },
  { id: 'renovation-feasibility', label: 'כדאיות שיפוץ', href: '/renovation-feasibility', icon: Hammer, group: 'בדיקת נכס' },
  { id: 'property-visit', label: 'ביקור בנכס', href: '/property-visit', icon: ClipboardCheck, group: 'בדיקת נכס' },
  { id: 'transaction-timeline', label: 'ציר זמן עסקה', href: '/transaction-timeline', icon: Calendar, group: 'תהליכים' },
  { id: 'urban-renewal', label: 'התחדשות עירונית', href: '/urban-renewal', icon: Building2, group: 'תהליכים' },
];

// Primary items for the mobile bottom tab bar
const mobileTabItems = navItems.filter((item) =>
  ['financial-checkup', 'mortgage-calculator', 'deal-business-plan', 'property-visit'].includes(item.id)
);

// Overflow items for the "More" sheet on mobile
const mobileOverflowItems = navItems.filter(
  (item) => !mobileTabItems.some((tab) => tab.id === item.id)
);

// Group the navigation items for the sidebar
const groups = Array.from(new Set(navItems.map((item) => item.group)));

function getGroupedItems(): { group: string; items: NavItem[] }[] {
  return groups.map((group) => ({
    group,
    items: navItems.filter((item) => item.group === group),
  }));
}

const contentVariants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -12 },
};

interface DashboardShellProps {
  children: React.ReactNode;
}

export function DashboardShell({ children }: DashboardShellProps) {
  const isMobile = useIsMobile();
  const location = useLocation();
  const { activeCalculator, setActiveCalculator } = useDashboard();
  const [moreOpen, setMoreOpen] = useState(false);

  const currentPath = location.pathname;

  // Determine the active item based on the current route
  const activeId =
    navItems.find((item) => item.href === currentPath)?.id || activeCalculator;

  return (
    <div className="flex min-h-screen">
      {/* Desktop Sidebar */}
      {!isMobile && (
        <aside
          className="fixed top-0 right-0 h-screen w-[260px] z-40 flex flex-col bg-[hsl(var(--sidebar-background))] border-l border-[hsl(var(--sidebar-border))]"
        >
          {/* Sidebar Header / Logo */}
          <div className="flex items-center gap-3 px-5 py-5 border-b border-[hsl(var(--sidebar-border))]">
            <div className="w-10 h-10 rounded-xl bg-[hsl(var(--sidebar-primary))] flex items-center justify-center shrink-0">
              <Calculator className="w-5 h-5 text-[hsl(var(--sidebar-primary-foreground))]" />
            </div>
            <div>
              <h1 className="font-bold text-[hsl(var(--sidebar-foreground))] text-base leading-tight">
                כלי נדל"ן
              </h1>
              <p className="text-xs text-[hsl(var(--sidebar-foreground))] opacity-60">
                לוח מחוונים
              </p>
            </div>
          </div>

          {/* Navigation Groups */}
          <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-5">
            {getGroupedItems().map(({ group, items }) => (
              <div key={group}>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-[hsl(var(--sidebar-foreground))] opacity-50 px-3 mb-2">
                  {group}
                </p>
                <ul className="space-y-1">
                  {items.map((item) => {
                    const isActive = item.id === activeId;
                    const Icon = item.icon;
                    return (
                      <li key={item.id}>
                        <Link
                          to={item.href}
                          onClick={() => setActiveCalculator(item.id)}
                          className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-150 ${
                            isActive
                              ? 'bg-[hsl(var(--sidebar-primary))] text-[hsl(var(--sidebar-primary-foreground))] font-medium shadow-md'
                              : 'text-[hsl(var(--sidebar-foreground))] hover:bg-[hsl(var(--sidebar-accent))] hover:text-[hsl(var(--sidebar-accent-foreground))]'
                          }`}
                        >
                          <Icon className="w-[18px] h-[18px] shrink-0" />
                          <span>{item.label}</span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </nav>

          {/* Sidebar Footer — Quick Actions */}
          <div className="border-t border-[hsl(var(--sidebar-border))] px-3 py-4 space-y-1">
            <button
              type="button"
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm w-full text-[hsl(var(--sidebar-foreground))] hover:bg-[hsl(var(--sidebar-accent))] hover:text-[hsl(var(--sidebar-accent-foreground))] transition-all duration-150"
            >
              <Bookmark className="w-[18px] h-[18px] shrink-0" />
              <span>תרחישים שמורים</span>
            </button>
            <button
              type="button"
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm w-full text-[hsl(var(--sidebar-foreground))] hover:bg-[hsl(var(--sidebar-accent))] hover:text-[hsl(var(--sidebar-accent-foreground))] transition-all duration-150"
            >
              <FileDown className="w-[18px] h-[18px] shrink-0" />
              <span>ייצוא דוחות</span>
            </button>
          </div>
        </aside>
      )}

      {/* Main Content Area */}
      <main
        className={`flex-1 min-h-screen ${
          !isMobile ? 'mr-[260px]' : 'pb-20'
        }`}
      >
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentPath}
              variants={contentVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.25, ease: 'easeInOut' }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* Mobile Bottom Tab Bar */}
      {isMobile && (
        <nav className="fixed bottom-0 left-0 right-0 z-50 bg-[hsl(var(--sidebar-background))] border-t border-[hsl(var(--sidebar-border))] safe-area-pb">
          <div className="flex items-center justify-around h-16 px-1">
            {mobileTabItems.map((item) => {
              const isActive = item.id === activeId;
              const Icon = item.icon;
              return (
                <Link
                  key={item.id}
                  to={item.href}
                  onClick={() => setActiveCalculator(item.id)}
                  className={`flex flex-col items-center justify-center gap-0.5 flex-1 h-full rounded-lg transition-colors duration-150 ${
                    isActive
                      ? 'text-[hsl(var(--sidebar-primary))]'
                      : 'text-[hsl(var(--sidebar-foreground))] opacity-60'
                  }`}
                >
                  <div
                    className={`flex items-center justify-center w-10 h-7 rounded-full transition-colors duration-150 ${
                      isActive
                        ? 'bg-[hsl(var(--sidebar-primary)/0.15)]'
                        : ''
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-medium leading-tight">
                    {item.label}
                  </span>
                </Link>
              );
            })}

            {/* More Button */}
            <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
              <SheetTrigger asChild>
                <button
                  type="button"
                  className="flex flex-col items-center justify-center gap-0.5 flex-1 h-full rounded-lg text-[hsl(var(--sidebar-foreground))] opacity-60 transition-colors duration-150"
                >
                  <div className="flex items-center justify-center w-10 h-7">
                    <MoreHorizontal className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-medium leading-tight">
                    עוד
                  </span>
                </button>
              </SheetTrigger>
              <SheetContent side="bottom" className="rounded-t-2xl bg-[hsl(var(--sidebar-background))] border-[hsl(var(--sidebar-border))]">
                <SheetHeader>
                  <SheetTitle className="text-[hsl(var(--sidebar-foreground))]">
                    כלים נוספים
                  </SheetTitle>
                </SheetHeader>
                <nav className="grid grid-cols-3 gap-3 py-4">
                  {mobileOverflowItems.map((item) => {
                    const isActive = item.id === activeId;
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.id}
                        to={item.href}
                        onClick={() => {
                          setActiveCalculator(item.id);
                          setMoreOpen(false);
                        }}
                        className={`flex flex-col items-center gap-2 p-4 rounded-xl transition-colors duration-150 ${
                          isActive
                            ? 'bg-[hsl(var(--sidebar-primary))] text-[hsl(var(--sidebar-primary-foreground))]'
                            : 'bg-[hsl(var(--sidebar-accent))] text-[hsl(var(--sidebar-accent-foreground))]'
                        }`}
                      >
                        <Icon className="w-6 h-6" />
                        <span className="text-xs font-medium text-center leading-tight">
                          {item.label}
                        </span>
                      </Link>
                    );
                  })}
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </nav>
      )}
    </div>
  );
}

export default DashboardShell;
