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
  BookOpen,
  Receipt
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
  { name: 'מס רכישה', href: '/purchase-tax', icon: Receipt, group: 'מימון' },
  { name: 'סטטיסטיקות', href: '/dashboard', icon: LayoutDashboard },
  { name: 'מילון מונחים', href: '/glossary', icon: BookOpen },
];

function NavItem({ item, isActive, onClick }: { item: typeof navigation[0]; isActive: boolean; onClick?: () => void }) {
  return (
    <Link
      to={item.href}
      onClick={onClick}
      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all ${
        isActive 
          ? 'bg-primary text-primary-foreground font-medium' 
          : 'text-muted-foreground hover:bg-muted hover:text-foreground'
      }`}
    >
      <item.icon className="w-4 h-4" />
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
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/90 backdrop-blur-md">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Mobile Menu */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden h-8 w-8">
                  <Menu className="w-4 h-4" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-64 p-0">
                <div className="p-5 border-b">
                  <Link to="/" className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                      <Calculator className="w-4 h-4 text-primary-foreground" />
                    </div>
                    <span className="font-semibold text-sm">הדרך לדירה</span>
                  </Link>
                </div>
                <nav className="p-3 space-y-0.5">
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
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <Calculator className="w-4 h-4 text-primary-foreground" />
              </div>
              <span className="font-semibold text-sm hidden sm:inline">הדרך לדירה</span>
            </Link>
          </div>

          {/* Breadcrumbs - Desktop */}
          {!isHomePage && pageTitle && (
            <Breadcrumb className="hidden md:flex">
              <BreadcrumbList className="text-xs">
                <BreadcrumbItem>
                  <BreadcrumbLink asChild>
                    <Link to="/" className="text-muted-foreground hover:text-foreground">
                      דף הבית
                    </Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator>
                  <ChevronRight className="w-3 h-3" />
                </BreadcrumbSeparator>
                <BreadcrumbItem>
                  <BreadcrumbPage className="font-medium">{pageTitle}</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          )}

          <div className="flex items-center gap-1">
            <ThemeToggle />
            <UserMenu />
          </div>
        </div>

        {/* Back Button - Mobile */}
        {!isHomePage && (
          <div className="md:hidden px-4 pb-2">
            <Link to="/">
              <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground text-xs h-7">
                <ChevronRight className="w-3 h-3" />
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
      <footer className="border-t border-border/50 py-6 mt-auto">
        <div className="max-w-5xl mx-auto px-4 text-center space-y-1">
          <p className="text-xs font-medium text-muted-foreground">© 2024 הדרך לדירה – מערכת תומכת החלטה</p>
          <p className="text-[11px] text-muted-foreground/70">
            המידע המוצג הינו להמחשה בלבד ואינו מהווה ייעוץ פיננסי או משפטי
          </p>
        </div>
      </footer>
    </div>
  );
}
