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

const navigation = [
  { name: 'Financial Checkup', href: '/', icon: Calculator },
  { name: 'Deal Business Plan', href: '/deal-business-plan', icon: Building2 },
  { name: 'Mortgage Calculator', href: '/mortgage-calculator', icon: CreditCard },
  { name: 'Property Visit Helper', href: '/property-visit', icon: ClipboardCheck },
  { name: 'Renovation Feasibility', href: '/renovation-feasibility', icon: Wrench },
  { name: 'Urban Renewal Timeline', href: '/urban-renewal', icon: Clock },
  { name: 'Transaction Timeline', href: '/transaction-timeline', icon: FileText },
];

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-foreground">The Road to Apartment</h1>
          <p className="text-muted-foreground mt-1">Tools Portal for Property Buyers</p>
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
          <p>The Road to Apartment Tools Portal</p>
          <p className="mt-1">© 2025 · For educational purposes only · Not financial or legal advice</p>
        </div>
      </footer>
    </div>
  );
}
