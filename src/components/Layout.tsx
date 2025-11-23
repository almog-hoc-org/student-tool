import { NavLink } from '@/components/NavLink';
import {
  Calculator,
  Building2,
  CreditCard,
  ClipboardCheck,
  Wrench,
  Clock,
  FileText,
} from 'lucide-react';
import { he } from '@/lib/translations/he';

const navigation = [
  { name: he.nav.financialCheckup, href: '/', icon: Calculator },
  { name: he.nav.dealBusinessPlan, href: '/deal-business-plan', icon: Building2 },
  { name: he.nav.mortgageCalculator, href: '/mortgage-calculator', icon: CreditCard },
  { name: he.nav.propertyVisit, href: '/property-visit', icon: ClipboardCheck },
  { name: he.nav.renovationFeasibility, href: '/renovation-feasibility', icon: Wrench },
  { name: he.nav.urbanRenewal, href: '/urban-renewal', icon: Clock },
  { name: he.nav.transactionTimeline, href: '/transaction-timeline', icon: FileText },
];

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-foreground">הדרך לדירה</h1>
          <p className="text-muted-foreground mt-1">פורטל כלים למשקיעי נדל״ן</p>
        </div>
      </header>

      {/* Navigation */}
      <nav className="border-b border-border bg-card/50 sticky top-0 z-10">
        <div className="container mx-auto px-4">
          <div className="flex gap-1 overflow-x-auto py-2">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.name}
                  to={item.href}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors whitespace-nowrap"
                  activeClassName="bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground"
                >
                  <Icon className="h-4 w-4" />
                  <span className="hidden md:inline">{item.name}</span>
                </NavLink>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-card mt-12">
        <div className="container mx-auto px-4 py-6 text-center text-sm text-muted-foreground">
          <p>פורטל כלים – הדרך לדירה</p>
          <p className="mt-1">© 2025 · למטרות חינוכיות בלבד · אינו מהווה ייעוץ פיננסי או משפטי</p>
        </div>
      </footer>
    </div>
  );
}
