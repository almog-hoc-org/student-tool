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
  Sparkles,
  Shield
} from 'lucide-react';
import { motion } from 'framer-motion';

interface CalculatorCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  link: string;
  index: number;
}

function CalculatorCard({ title, description, icon, link, index }: CalculatorCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.15 + index * 0.06, ease: [0.4, 0, 0.2, 1] }}
    >
      <Link to={link} className="block group h-full">
        <Card className="h-full border border-border/60 bg-card shadow-sm hover:shadow-lg hover:border-primary/30 transition-all duration-300 hover:-translate-y-0.5">
          <CardHeader className="pb-3">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-3 bg-primary/8 group-hover:bg-primary/12 transition-colors duration-300">
              {icon}
            </div>
            <CardTitle className="text-lg">{title}</CardTitle>
            <CardDescription className="text-sm leading-relaxed">
              {description}
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex items-center justify-between text-sm text-primary font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <span>התחל עכשיו</span>
              <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
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
      description: 'בדוק כמה אתה יכול לקחת משכנתא ומה התקציב שלך לדירה',
      icon: <Calculator className="w-6 h-6 text-primary" />,
      link: '/financial-checkup',
    },
    {
      title: 'מחשבון משכנתא',
      description: 'חשב את ההחזר החודשי והעלות הכוללת של המשכנתא',
      icon: <Home className="w-6 h-6 text-primary" />,
      link: '/mortgage-calculator',
    },
    {
      title: 'תוכנית עסקית',
      description: 'בנה תוכנית עסקית מלאה לעסקת נדל"ן ובדוק כדאיות',
      icon: <TrendingUp className="w-6 h-6 text-primary" />,
      link: '/deal-business-plan',
    },
    {
      title: 'כדאיות שיפוץ',
      description: 'העריך עלויות שיפוץ ובדוק אם השיפוץ משתלם',
      icon: <Hammer className="w-6 h-6 text-primary" />,
      link: '/renovation-feasibility',
    },
    {
      title: 'ביקור בנכס',
      description: 'רשימת בדיקות מקיפה לביקור בנכס לפני קנייה',
      icon: <ClipboardCheck className="w-6 h-6 text-primary" />,
      link: '/property-visit',
    },
    {
      title: 'ציר זמן לעסקה',
      description: 'הבן את השלבים והזמנים בתהליך רכישת דירה',
      icon: <Calendar className="w-6 h-6 text-primary" />,
      link: '/transaction-timeline',
    },
    {
      title: 'התחדשות עירונית',
      description: 'למד על תמ"א 38 ופינוי-בינוי - מה זה ואיך זה עובד',
      icon: <Building2 className="w-6 h-6 text-primary" />,
      link: '/urban-renewal',
    },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="gradient-hero relative overflow-hidden">
        {/* Soft glow decorations */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 right-1/4 w-64 h-64 bg-primary/10 rounded-full blur-[100px]" />
          <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-accent/8 rounded-full blur-[120px]" />
        </div>

        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-14 sm:py-20 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center space-y-5"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/15 text-white/80 text-xs font-medium">
              <Sparkles className="w-3.5 h-3.5" />
              <span>מערכת תומכת החלטה מקצועית</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white">
              הדרך החכמה{' '}
              <span className="text-gold">לדירה שלך</span>
            </h1>

            <p className="text-base sm:text-lg max-w-xl mx-auto text-white/70 leading-relaxed">
              כלים מקצועיים לניתוח עסקאות נדל"ן, חישובי משכנתא מדויקים, ותובנות חכמות.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-4 pt-2 text-xs text-white/50">
              <div className="flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5" />
                <span>מדרגות מס 2024</span>
              </div>
              <div className="flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5" />
                <span>חישוב IRR</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Calculator className="w-3.5 h-3.5" />
                <span>תובנות חכמות</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 space-y-8 -mt-6 relative z-20 pb-10">
        {/* Quick Start Guide */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <Card className="shadow-lg border-border/50">
            <CardContent className="p-4 sm:p-5">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 bg-accent/10 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                  <BookOpen className="w-4 h-4 text-accent" />
                </div>
                <div className="space-y-1.5">
                  <h3 className="font-semibold text-sm">מתחילים? הנה 3 צעדים פשוטים:</h3>
                  <ol className="text-muted-foreground space-y-0.5 list-decimal list-inside text-sm">
                    <li><strong className="text-foreground">בדיקה פיננסית</strong> – גלה מה התקציב שלך</li>
                    <li><strong className="text-foreground">מחשבון משכנתא</strong> – חשב כמה תשלם כל חודש</li>
                    <li><strong className="text-foreground">תוכנית עסקית</strong> – בדוק אם העסקה כדאית</li>
                  </ol>
                  <Link to="/glossary" className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
                    <BookOpen className="w-3.5 h-3.5" />
                    לא מכיר מונחים? לחץ כאן למילון
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Calculator Cards Grid */}
        <div className="space-y-3">
          <h2 className="text-xl font-semibold text-foreground">בחר כלי</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {calculators.map((calc, index) => (
              <CalculatorCard key={calc.link} {...calc} index={index} />
            ))}
          </div>
        </div>

        {/* Bottom Links */}
        <div className="grid sm:grid-cols-2 gap-3">
          <Card className="border border-border/60 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <Link to="/dashboard" className="flex items-center justify-between group">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-primary/8 rounded-lg flex items-center justify-center">
                    <BarChart3 className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-medium text-sm">הסטטיסטיקות שלי</h3>
                    <p className="text-xs text-muted-foreground">היסטוריית חישובים והמלצות</p>
                  </div>
                </div>
                <ArrowLeft className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:-translate-x-1 transition-all" />
              </Link>
            </CardContent>
          </Card>

          <Card className="border border-border/60 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <Link to="/glossary" className="flex items-center justify-between group">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-accent/10 rounded-lg flex items-center justify-center">
                    <BookOpen className="w-4 h-4 text-accent" />
                  </div>
                  <div>
                    <h3 className="font-medium text-sm">מילון מונחים</h3>
                    <p className="text-xs text-muted-foreground">הסברים פשוטים למונחי נדל"ן</p>
                  </div>
                </div>
                <ArrowLeft className="w-4 h-4 text-muted-foreground group-hover:text-accent group-hover:-translate-x-1 transition-all" />
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
