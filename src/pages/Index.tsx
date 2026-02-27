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
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.07, ease: [0.4, 0, 0.2, 1] }}
    >
      <Link to={link} className="block group h-full">
        <Card className="glass-card hover:shadow-2xl hover:border-accent/40 transition-all duration-300 h-full hover:-translate-y-1">
          <CardHeader className="pb-3">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4 bg-primary/10 group-hover:bg-accent/15 transition-colors duration-300">
              {icon}
            </div>
            <CardTitle className="text-xl">{title}</CardTitle>
            <CardDescription className="text-base leading-relaxed">
              {description}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="ghost" size="sm" className="w-full justify-between text-primary hover:bg-primary/10 hover:text-primary">
              <span>התחל עכשיו</span>
              <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            </Button>
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
      icon: <Calculator className="w-7 h-7 text-primary" />,
      link: '/financial-checkup',
    },
    {
      title: 'מחשבון משכנתא',
      description: 'חשב את ההחזר החודשי והעלות הכוללת של המשכנתא',
      icon: <Home className="w-7 h-7 text-primary" />,
      link: '/mortgage-calculator',
    },
    {
      title: 'תוכנית עסקית',
      description: 'בנה תוכנית עסקית מלאה לעסקת נדל"ן ובדוק כדאיות',
      icon: <TrendingUp className="w-7 h-7 text-accent" />,
      link: '/deal-business-plan',
    },
    {
      title: 'כדאיות שיפוץ',
      description: 'העריך עלויות שיפוץ ובדוק אם השיפוץ משתלם',
      icon: <Hammer className="w-7 h-7 text-primary" />,
      link: '/renovation-feasibility',
    },
    {
      title: 'ביקור בנכס',
      description: 'רשימת בדיקות מקיפה לביקור בנכס לפני קנייה',
      icon: <ClipboardCheck className="w-7 h-7 text-accent" />,
      link: '/property-visit',
    },
    {
      title: 'ציר זמן לעסקה',
      description: 'הבן את השלבים והזמנים בתהליך רכישת דירה',
      icon: <Calendar className="w-7 h-7 text-primary" />,
      link: '/transaction-timeline',
    },
    {
      title: 'התחדשות עירונית',
      description: 'למד על תמ"א 38 ופינוי-בינוי - מה זה ואיך זה עובד',
      icon: <Building2 className="w-7 h-7 text-accent" />,
      link: '/urban-renewal',
    },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="gradient-navy text-primary-foreground relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 right-10 w-72 h-72 bg-accent rounded-full blur-3xl" />
          <div className="absolute bottom-10 left-10 w-96 h-96 bg-accent rounded-full blur-3xl" />
        </div>

        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-24 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center space-y-6"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/20 border border-accent/30 text-accent mb-4">
              <Sparkles className="w-4 h-4" />
              <span className="text-sm font-medium">מערכת תומכת החלטה מקצועית</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight">
              הדרך החכמה{' '}
              <span className="text-gold">לדירה שלך</span>
            </h1>

            <p className="text-lg sm:text-xl max-w-2xl mx-auto opacity-85 leading-relaxed">
              כלים מקצועיים לניתוח עסקאות נדל"ן, חישובי משכנתא מדויקים, ותובנות חכמות שעוזרות לך לקבל החלטות נכונות.
            </p>

            <div className="flex items-center justify-center gap-6 pt-4 text-sm opacity-70">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4" />
                <span>מדרגות מס 2024</span>
              </div>
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                <span>חישוב IRR</span>
              </div>
              <div className="flex items-center gap-2">
                <Calculator className="w-4 h-4" />
                <span>תובנות חכמות</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-8 -mt-8 relative z-20 pb-8">
        {/* Quick Start Guide */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Card className="glass-card-strong border-accent/20">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-accent/15 rounded-xl flex items-center justify-center shrink-0">
                  <BookOpen className="w-5 h-5 text-accent" />
                </div>
                <div className="space-y-2">
                  <h3 className="font-semibold text-lg">מתחילים? הנה 3 צעדים פשוטים:</h3>
                  <ol className="text-muted-foreground space-y-1 list-decimal list-inside text-sm sm:text-base">
                    <li><strong>בדיקה פיננסית</strong> - גלה מה התקציב שלך</li>
                    <li><strong>מחשבון משכנתא</strong> - חשב כמה תשלם כל חודש</li>
                    <li><strong>תוכנית עסקית</strong> - בדוק אם העסקה כדאית</li>
                  </ol>
                  <Link to="/glossary" className="inline-flex items-center gap-1 text-sm text-accent hover:underline mt-2">
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
          <h2 className="text-2xl font-bold">בחר כלי</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {calculators.map((calc, index) => (
              <CalculatorCard key={calc.link} {...calc} index={index} />
            ))}
          </div>
        </div>

        {/* Bottom Links */}
        <div className="grid sm:grid-cols-2 gap-4">
          <Card className="glass-card">
            <CardContent className="p-4 sm:p-6">
              <Link to="/dashboard" className="flex items-center justify-between group">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                    <BarChart3 className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold">הסטטיסטיקות שלי</h3>
                    <p className="text-sm text-muted-foreground">היסטוריית חישובים והמלצות</p>
                  </div>
                </div>
                <ArrowLeft className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:-translate-x-1 transition-all" />
              </Link>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardContent className="p-4 sm:p-6">
              <Link to="/glossary" className="flex items-center justify-between group">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-accent/15 rounded-xl flex items-center justify-center">
                    <BookOpen className="w-5 h-5 text-accent" />
                  </div>
                  <div>
                    <h3 className="font-semibold">מילון מונחים</h3>
                    <p className="text-sm text-muted-foreground">הסברים פשוטים למונחי נדל"ן</p>
                  </div>
                </div>
                <ArrowLeft className="w-5 h-5 text-muted-foreground group-hover:text-accent group-hover:-translate-x-1 transition-all" />
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
