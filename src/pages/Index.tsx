import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
  ArrowLeft,
  BarChart3,
  Bookmark,
  Sparkles,
  Shield,
  Receipt
} from 'lucide-react';
import { motion } from 'framer-motion';

interface CalculatorCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  link: string;
  iconBg: string;
  index: number;
}

function CalculatorCard({ title, description, icon, link, iconBg, index }: CalculatorCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.07, duration: 0.4, ease: 'easeOut' }}
    >
      <Link to={link} className="block group">
        <Card className="glass-card border-border/40 hover:border-primary/25 hover:shadow-xl transition-all duration-300 h-full overflow-hidden hover:-translate-y-1">
          <CardHeader className="pb-3">
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-3 ${iconBg} group-hover:scale-110 transition-transform duration-300`}>
              {icon}
            </div>
            <CardTitle className="text-lg leading-tight">{title}</CardTitle>
            <CardDescription className="text-sm leading-relaxed">
              {description}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between text-primary text-sm font-medium">
              <span>בוא נתחיל</span>
              <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1.5 transition-transform duration-300" />
            </div>
          </CardContent>
        </Card>
      </Link>
    </motion.div>
  );
}

export default function Index() {
  const calculators = [
    {
      title: 'בדיקה פיננסית',
      description: 'כמה באמת יש לך? גלה בדיוק כמה דירה אתה יכול לקנות',
      icon: <Calculator className="w-6 h-6 text-secondary" />,
      link: '/financial-checkup',
      iconBg: 'bg-primary/15',
    },
    {
      title: 'מחשבון משכנתא',
      description: 'בנה תמהיל, השווה מסלולים וראה כמה תשלם — חודשי וכולל',
      icon: <Home className="w-6 h-6 text-secondary" />,
      link: '/mortgage-calculator',
      iconBg: 'bg-secondary/10',
    },
    {
      title: 'תוכנית עסקית',
      description: 'שווה לקנות? בדוק תשואה, IRR ותזרים על כל עסקה',
      icon: <TrendingUp className="w-6 h-6 text-secondary" />,
      link: '/deal-business-plan',
      iconBg: 'bg-[hsl(var(--chart-1)/0.15)]',
    },
    {
      title: 'כדאיות שיפוץ',
      description: 'שיפוץ = רווח? גלה אם הכסף יחזור אליך',
      icon: <Hammer className="w-6 h-6 text-secondary" />,
      link: '/renovation-feasibility',
      iconBg: 'bg-[hsl(var(--chart-2)/0.15)]',
    },
    {
      title: 'ביקור בנכס',
      description: 'לא לפספס כלום — צ׳קליסט מקצועי לביקור בדירה',
      icon: <ClipboardCheck className="w-6 h-6 text-secondary" />,
      link: '/property-visit',
      iconBg: 'bg-primary/10',
    },
    {
      title: 'ציר זמן לעסקה',
      description: 'מהצעה ועד מפתח — כל שלב, זמן ועלות',
      icon: <Calendar className="w-6 h-6 text-secondary" />,
      link: '/transaction-timeline',
      iconBg: 'bg-secondary/10',
    },
    {
      title: 'התחדשות עירונית',
      description: 'תמ״א 38 ופינוי-בינוי — מה זה שווה לך?',
      icon: <Building2 className="w-6 h-6 text-secondary" />,
      link: '/urban-renewal',
      iconBg: 'bg-[hsl(var(--chart-1)/0.12)]',
    },
    {
      title: 'מחשבון מס רכישה',
      description: 'כמה מס תשלם? חישוב מיידי לפי מדרגות 2025–2028',
      icon: <Receipt className="w-6 h-6" />,
      link: '/purchase-tax',
      iconBg: 'bg-primary/10',
    },
  ];

  return (
    <div className="min-h-screen">
      <div className="max-w-6xl mx-auto p-4 sm:p-6 space-y-8">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center space-y-4 py-10 sm:py-14"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-primary/8 text-primary rounded-full text-sm font-medium mb-2">
            <Sparkles className="w-4 h-4" />
            <span>עדכון מרץ 2026 — מדרגות מס, ריביות ומדדים חדשים</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-foreground leading-tight">
            <span className="text-gradient-primary">נווט הבית</span>
          </h1>
          <p className="text-xl sm:text-2xl font-medium text-foreground/80 max-w-2xl mx-auto">
            כל הכלים שצריך כדי לקנות דירה בביטחון
          </p>
          <p className="text-base text-muted-foreground max-w-xl mx-auto leading-relaxed">
            מס רכישה, משכנתא, תשואה ותזרים — הכל במקום אחד, בחינם.
          </p>
        </motion.div>

        {/* Quick Start Guide */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.4 }}
        >
          <Card className="glass-card border-primary/10 overflow-hidden">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
                  <Shield className="w-5 h-5 text-primary" />
                </div>
                <div className="space-y-2">
                  <h3 className="font-semibold text-lg">מתחילים? 3 צעדים וזהו:</h3>
                  <ol className="text-muted-foreground space-y-1 list-decimal list-inside text-sm sm:text-base">
                    <li><strong className="text-foreground">בדיקה פיננסית</strong> — גלה מה התקציב האמיתי שלך</li>
                    <li><strong className="text-foreground">מחשבון משכנתא</strong> — בנה תמהיל וחשב החזר חודשי</li>
                    <li><strong className="text-foreground">תוכנית עסקית</strong> — בדוק תשואה וכדאיות העסקה</li>
                  </ol>
                  <Link to="/glossary" className="inline-flex items-center gap-1 text-sm text-primary hover:underline mt-2">
                    <BookOpen className="w-4 h-4" />
                    לא מכיר מונחים? לחץ כאן למילון
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Calculator Cards Grid */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-foreground">בחר כלי</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {calculators.map((calc, index) => (
              <CalculatorCard key={calc.link} {...calc} index={index} />
            ))}
          </div>
        </div>

        {/* Bottom Links */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="grid sm:grid-cols-3 gap-4"
        >
          <Card className="glass-card border-transparent hover:border-primary/20 transition-all">
            <CardContent className="p-4">
              <Link to="/dashboard" className="flex items-center justify-between group">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-primary/10 rounded-lg flex items-center justify-center">
                    <BarChart3 className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm">סטטיסטיקות</h3>
                    <p className="text-xs text-muted-foreground">היסטוריית חישובים</p>
                  </div>
                </div>
                <ArrowLeft className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:-translate-x-1 transition-all" />
              </Link>
            </CardContent>
          </Card>

          <Card className="glass-card border-transparent hover:border-primary/20 transition-all">
            <CardContent className="p-4">
              <Link to="/history" className="flex items-center justify-between group">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-secondary/10 rounded-lg flex items-center justify-center">
                    <Bookmark className="w-4 h-4 text-secondary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm">תרחישים שמורים</h3>
                    <p className="text-xs text-muted-foreground">השוואת עסקאות</p>
                  </div>
                </div>
                <ArrowLeft className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:-translate-x-1 transition-all" />
              </Link>
            </CardContent>
          </Card>

          <Card className="glass-card border-transparent hover:border-primary/20 transition-all">
            <CardContent className="p-4">
              <Link to="/glossary" className="flex items-center justify-between group">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-[hsl(var(--chart-2)/0.15)] rounded-lg flex items-center justify-center">
                    <BookOpen className="w-4 h-4 text-[hsl(var(--chart-2))]" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm">מילון מונחים</h3>
                    <p className="text-xs text-muted-foreground">הסברים פשוטים</p>
                  </div>
                </div>
                <ArrowLeft className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:-translate-x-1 transition-all" />
              </Link>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
