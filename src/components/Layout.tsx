import { NavLink } from '@/components/NavLink';
import {
  Calculator,
  Building2,
  CreditCard,
  ClipboardCheck,
  Wrench,
  Clock,
  FileText,
  Home,
  History as HistoryIcon,
} from 'lucide-react';
import { he } from '@/lib/translations/he';
import { ThemeToggle } from '@/components/ThemeToggle';
import { NotificationCenter } from '@/components/NotificationCenter';

const navigation = [
  { name: 'דף הבית', href: '/', icon: Home },
  { name: he.nav.financialCheckup, href: '/financial-checkup', icon: Calculator },
  { name: he.nav.dealBusinessPlan, href: '/deal-business-plan', icon: Building2 },
  { name: he.nav.mortgageCalculator, href: '/mortgage-calculator', icon: CreditCard },
  { name: he.nav.propertyVisit, href: '/property-visit', icon: ClipboardCheck },
  { name: he.nav.renovationFeasibility, href: '/renovation-feasibility', icon: Wrench },
  { name: he.nav.urbanRenewal, href: '/urban-renewal', icon: Clock },
  { name: he.nav.transactionTimeline, href: '/transaction-timeline', icon: FileText },
  { name: 'היסטוריה', href: '/history', icon: HistoryIcon },
];

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex bg-background">
      {/* Modern Sidebar */}
      <aside className="hidden lg:flex w-20 bg-gradient-to-b from-secondary to-secondary/90 flex-col items-center py-6 border-l border-border/50">
        {/* Logo */}
        <div className="mb-8">
          <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110">
            <Home className="w-6 h-6 text-primary-foreground" />
          </div>
        </div>
        
        {/* Navigation Icons */}
        <nav className="flex-1 flex flex-col gap-3">
          {navigation.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink 
                key={item.href} 
                to={item.href}
                className="group relative"
              >
                <div className="w-12 h-12 rounded-xl bg-secondary-foreground/10 hover:bg-primary transition-all duration-300 flex items-center justify-center relative overflow-hidden">
                  <Icon className="w-5 h-5 text-secondary-foreground group-hover:text-primary-foreground transition-colors relative z-10" />
                </div>
                {/* Tooltip */}
                <div className="absolute left-full mr-3 top-1/2 -translate-y-1/2 bg-card text-card-foreground px-3 py-2 rounded-lg shadow-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap text-sm font-medium">
                  {item.name}
                </div>
              </NavLink>
            );
          })}
        </nav>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Header */}
        <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
          <div className="container mx-auto px-4 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl lg:text-3xl font-bold text-foreground">הדרך לדירה</h1>
                <p className="text-muted-foreground text-sm mt-0.5">פורטל כלים למשקיעי נדל״ן</p>
              </div>
              <div className="flex items-center gap-2">
                <NotificationCenter />
                <ThemeToggle />
              </div>
            </div>
          </div>
        </header>

        {/* Mobile Navigation */}
        <nav className="lg:hidden border-b border-border bg-card/50 sticky top-[73px] z-10">
          <div className="container mx-auto px-4">
            <div className="flex gap-1 overflow-x-auto py-2 scrollbar-hide">
              {navigation.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.name}
                    to={item.href}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors whitespace-nowrap"
                    activeClassName="bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground"
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.name}</span>
                  </NavLink>
                );
              })}
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <main className="flex-1 bg-gradient-to-br from-background to-accent/20">
          <div className="container mx-auto px-4 lg:px-8 py-6 lg:py-8">
            {children}
          </div>
        </main>

        {/* Footer */}
        <footer className="border-t border-border bg-card/50 backdrop-blur-sm mt-auto">
          <div className="container mx-auto px-4 lg:px-8 py-6 text-center text-sm text-muted-foreground">
            <p className="font-medium">פורטל כלים – הדרך לדירה</p>
            <p className="mt-1 text-xs">© 2025 · למטרות חינוכיות בלבד · אינו מהווה ייעוץ פיננסי או משפטי</p>
          </div>
        </footer>
      </div>
    </div>
  );
}
