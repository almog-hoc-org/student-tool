import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import {
  Calculator,
  Home,
  TrendingUp,
  Hammer,
  ClipboardCheck,
  Calendar,
  Building2,
  ChevronLeft,
  BookOpen,
  BarChart3,
  Bookmark,
  Receipt,
  GraduationCap,
  Zap
} from 'lucide-react';

interface PrimaryCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  link: string;
  iconBg: string;
}

function PrimaryCard({ title, description, icon, link, iconBg }: PrimaryCardProps) {
  return (
    <Link to={link} className="block">
      <Card className="active:bg-muted/50 transition-colors duration-150 h-full">
        <CardContent className="p-4 sm:p-5">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-3 ${iconBg}`}>
            {icon}
          </div>
          <h3 className="text-base font-semibold mb-1">{title}</h3>
          <p className="text-sm text-muted-foreground leading-snug mb-3">
            {description}
          </p>
          <div className="flex items-center gap-1 text-primary text-sm font-medium">
            <span>בוא נתחיל</span>
            <ChevronLeft className="w-4 h-4" />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

interface SecondaryItemProps {
  title: string;
  icon: React.ReactNode;
  link: string;
  iconBg: string;
}

function SecondaryItem({ title, icon, link, iconBg }: SecondaryItemProps) {
  return (
    <Link to={link} className="block">
      <div className="flex items-center gap-3 p-3 rounded-xl active:bg-muted/50 transition-colors duration-150">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${iconBg}`}>
          {icon}
        </div>
        <span className="text-sm font-medium flex-1">{title}</span>
        <ChevronLeft className="w-4 h-4 text-muted-foreground" />
      </div>
    </Link>
  );
}

export default function Index() {
  const primaryTools = [
    {
      title: 'בדיקה פיננסית',
      description: 'כמה באמת יש לך? גלה בדיוק כמה דירה אתה יכול לקנות',
      icon: <Calculator className="w-6 h-6 text-primary" />,
      link: '/financial-checkup',
      iconBg: 'bg-primary/10',
    },
    {
      title: 'מחשבון משכנתא',
      description: 'בנה תמהיל, השווה מסלולים וראה כמה תשלם — חודשי וכולל',
      icon: <Home className="w-6 h-6 text-primary" />,
      link: '/mortgage-calculator',
      iconBg: 'bg-primary/10',
    },
    {
      title: 'תוכנית עסקית',
      description: 'שווה לקנות? בדוק תשואה, IRR ותזרים על כל עסקה',
      icon: <TrendingUp className="w-6 h-6 text-primary" />,
      link: '/deal-business-plan',
      iconBg: 'bg-primary/10',
    },
  ];

  const secondaryTools = [
    {
      title: 'מחשבון מס רכישה',
      icon: <Receipt className="w-5 h-5 text-muted-foreground" />,
      link: '/purchase-tax',
      iconBg: 'bg-muted',
    },
    {
      title: 'כדאיות שיפוץ',
      icon: <Hammer className="w-5 h-5 text-muted-foreground" />,
      link: '/renovation-feasibility',
      iconBg: 'bg-muted',
    },
    {
      title: 'ביקור בנכס',
      icon: <ClipboardCheck className="w-5 h-5 text-muted-foreground" />,
      link: '/property-visit',
      iconBg: 'bg-muted',
    },
    {
      title: 'ציר זמן לעסקה',
      icon: <Calendar className="w-5 h-5 text-muted-foreground" />,
      link: '/transaction-timeline',
      iconBg: 'bg-muted',
    },
    {
      title: 'התחדשות עירונית',
      icon: <Building2 className="w-5 h-5 text-muted-foreground" />,
      link: '/urban-renewal',
      iconBg: 'bg-muted',
    },
  ];

  const utilityLinks = [
    { title: 'סטטיסטיקות', icon: <BarChart3 className="w-4 h-4 text-primary" />, link: '/dashboard', iconBg: 'bg-primary/10' },
    { title: 'תרחישים שמורים', icon: <Bookmark className="w-4 h-4 text-primary" />, link: '/history', iconBg: 'bg-primary/10' },
    { title: 'מילון מונחים', icon: <BookOpen className="w-4 h-4 text-primary" />, link: '/glossary', iconBg: 'bg-primary/10' },
  ];

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="py-4">
        <h1 className="text-2xl font-bold">ארגז הכלים</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          הדרך לדירה – כל הכלים שצריך כדי לקנות דירה בביטחון
        </p>
      </div>

      {/* Quick Check — Hero CTA */}
      <Link to="/quick-check" className="block">
        <Card className="border-primary/20 bg-primary/[0.03] active:bg-primary/[0.07] transition-colors duration-150">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center flex-shrink-0">
              <Zap className="w-6 h-6 text-primary-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-base font-semibold mb-0.5">מצאת דירה? בדוק עכשיו</h3>
              <p className="text-sm text-muted-foreground">הכנס מחיר וקבל מיד — מס, עלויות והחזר חודשי</p>
            </div>
            <ChevronLeft className="w-5 h-5 text-primary flex-shrink-0" />
          </CardContent>
        </Card>
      </Link>

      {/* Program Banner — "הדרך לדירה" */}
      <Link to="/program" className="block">
        <Card className="border-[hsl(var(--gold)/0.3)] bg-[hsl(var(--gold)/0.04)] active:bg-[hsl(var(--gold)/0.08)] transition-colors duration-150">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-gold-cta flex items-center justify-center flex-shrink-0">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <h3 className="text-base font-semibold">הדרך לדירה</h3>
                <span className="text-[10px] bg-[hsl(var(--gold))] text-white px-1.5 py-0.5 rounded-full font-bold">חדש</span>
              </div>
              <p className="text-sm text-muted-foreground">התוכנית המקצועית לרכישת דירה</p>
            </div>
            <ChevronLeft className="w-5 h-5 text-[hsl(var(--gold))] flex-shrink-0" />
          </CardContent>
        </Card>
      </Link>

      {/* Primary Tools */}
      <div className="space-y-3">
        <h2 className="text-base font-semibold">כלים מרכזיים</h2>
        <div className="grid sm:grid-cols-3 gap-3">
          {primaryTools.map((tool) => (
            <PrimaryCard key={tool.link} {...tool} />
          ))}
        </div>
      </div>

      {/* Secondary Tools - list style */}
      <div className="space-y-1">
        <h2 className="text-base font-semibold mb-2">כלים נוספים</h2>
        <Card>
          <CardContent className="p-1">
            {secondaryTools.map((tool, index) => (
              <React.Fragment key={tool.link}>
                <SecondaryItem {...tool} />
                {index < secondaryTools.length - 1 && (
                  <div className="border-b border-border mx-3" />
                )}
              </React.Fragment>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Utility Links */}
      <div className="grid grid-cols-3 gap-3">
        {utilityLinks.map((item) => (
          <Link key={item.link} to={item.link}>
            <Card className="active:bg-muted/50 transition-colors duration-150">
              <CardContent className="p-3 flex flex-col items-center gap-2 text-center">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${item.iconBg}`}>
                  {item.icon}
                </div>
                <span className="text-xs font-medium">{item.title}</span>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
