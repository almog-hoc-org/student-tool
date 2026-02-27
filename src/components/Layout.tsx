import { ReactNode } from 'react';
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
  BookOpen
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

const navigation = [
  { name: 'דף הבית', href: '/', icon: Home },
  { name: 'בדיקה פיננסית', href: '/financial-checkup', icon: Calculator, group: 'הערכת כדאיות' },
  { name: 'תוכנית עסקית', href: '/deal-business-plan', icon: TrendingUp, group: 'הערכת כדאיות' },
  { name: 'מחשבון משכנתא', href: '/mortgage-calculator', icon: Home, group: 'מימון' },
  { name: 'כדאיות שיפוץ', href: '/renovation-feasibility', icon: Hammer, group: 'בדיקת נכס' },
  { name: 'ביקור בנכס', href: '/property-visit', icon: ClipboardCheck, group: 'בדיקת נכס' },
  { name: 'ציר זמן', href: '/transaction-timeline', icon: Calendar, group: 'תהליכים' },
  { name: 'התחדשות עירונית', href: '/urban-renewal', icon: Building2, group: 'תהליכים' },
  { name: 'סטטיסטיקות', href: '/dashboard', icon: LayoutDashboard },
  { name: 'מילון מונחים', href: '/glossary', icon: BookOpen },
];

function NavItem({ item, isActive, onClick }: { item: typeof navigation[0]; isActive: boolean; onClick?: () => void }) {
  return (
    <Link
      to={item.href}
      onClick={onClick}
      className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
        isActive 
          ? 'bg-accent text-accent-foreground font-medium' 
          : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
      }`}
    >
      <item.icon className="w-5 h-5" />
      <span>{item.name}</span>
    </Link>
  );
}

function getPageTitle(pathname: string): string {
  const page = navigation.find(n => n.href === pathname);
  return page?.name || '';
}

export function Layout({ children }: { children: ReactNode }) {
  const location = useLocation();
  const currentPath = location.pathname;
  const pageTitle = getPageTitle(currentPath);
  const isHomePage = currentPath === '/';

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border/50 bg-card/80 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Mobile Menu */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden">
                  <Menu className="w-5 h-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-72 p-0">
                <div className="p-6 border-b gradient-navy">
                  <Link to="/" className="flex items-center gap-2">
                    <div className="w-10 h-10 bg-accent rounded-xl flex items-center justify-center">
                      <Calculator className="w-5 h-5 text-accent-foreground" />
                    </div>
                    <div>
                      <h2 className="font-bold text-primary-foreground">הדרך לדירה</h2>
                      <p className="text-xs text-primary-foreground/70">מערכת תומכת החלטה</p>
                    </div>
                  </Link>
                </div>
                <nav className="p-4 space-y-1">
                  {navigation.map((item) => (
                    <NavItem 
                      key={item.href} 
                      item={item} 
                      isActive={currentPath === item.href}
                    />
                  ))}
                </nav>
              </SheetContent>
            </Sheet>

            {/* Logo */}
            <Link to="/" className="flex items-center gap-2">
              <div className="w-9 h-9 bg-primary rounded-lg flex items-center justify-center">
                <Calculator className="w-5 h-5 text-primary-foreground" />
              </div>
              <div className="hidden sm:block">
                <span className="font-bold text-foreground">הדרך לדירה</span>
              </div>
            </Link>
          </div>

          {/* Breadcrumbs - Desktop */}
          {!isHomePage && pageTitle && (
            <Breadcrumb className="hidden md:flex">
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink asChild>
                    <Link to="/" className="text-muted-foreground hover:text-foreground">
                      דף הבית
                    </Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator>
                  <ChevronRight className="w-4 h-4" />
                </BreadcrumbSeparator>
                <BreadcrumbItem>
                  <BreadcrumbPage>{pageTitle}</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          )}

          <div className="flex items-center gap-2">
            <ThemeToggle />
            <UserMenu />
          </div>
        </div>

        {/* Back Button - Mobile */}
        {!isHomePage && (
          <div className="md:hidden px-4 pb-3">
            <Link to="/">
              <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground">
                <ChevronRight className="w-4 h-4" />
                חזרה לדף הבית
              </Button>
            </Link>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="pb-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-border/50 py-8 mt-auto bg-card/50">
        <div className="max-w-6xl mx-auto px-4 text-center space-y-2">
          <p className="text-sm font-medium text-foreground">© 2024 הדרך לדירה – מערכת תומכת החלטה</p>
          <p className="text-xs text-muted-foreground">
            המידע המוצג הינו להמחשה בלבד ואינו מהווה ייעוץ פיננסי או משפטי
          </p>
        </div>
      </footer>
    </div>
  );
}
