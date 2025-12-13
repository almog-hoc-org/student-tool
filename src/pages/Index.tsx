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
  BarChart3
} from 'lucide-react';

interface CalculatorCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  link: string;
  color: string;
  bgColor: string;
}

function CalculatorCard({ title, description, icon, link, color, bgColor }: CalculatorCardProps) {
  return (
    <Link to={link} className="block group">
      <Card className={`border-2 border-transparent hover:border-primary/30 shadow-md hover:shadow-xl transition-all duration-300 h-full ${bgColor}`}>
        <CardHeader className="pb-3">
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-4 ${color} group-hover:scale-110 transition-transform`}>
            {icon}
          </div>
          <CardTitle className="text-xl">{title}</CardTitle>
          <CardDescription className="text-base leading-relaxed">
            {description}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="ghost" size="sm" className="w-full justify-between text-primary hover:bg-primary/10">
            <span>התחל עכשיו</span>
            <ChevronLeft className="w-4 h-4" />
          </Button>
        </CardContent>
      </Card>
    </Link>
  );
}

export default function Index() {
  const calculators = [
    {
      title: 'בדיקה פיננסית',
      description: 'בדוק כמה אתה יכול לקחת משכנתא ומה התקציב שלך לדירה',
      icon: <Calculator className="w-7 h-7 text-blue-600" />,
      link: '/financial-checkup',
      color: 'bg-blue-100',
      bgColor: 'bg-gradient-to-br from-blue-50/80 to-background'
    },
    {
      title: 'מחשבון משכנתא',
      description: 'חשב את ההחזר החודשי והעלות הכוללת של המשכנתא',
      icon: <Home className="w-7 h-7 text-emerald-600" />,
      link: '/mortgage-calculator',
      color: 'bg-emerald-100',
      bgColor: 'bg-gradient-to-br from-emerald-50/80 to-background'
    },
    {
      title: 'תוכנית עסקית',
      description: 'בנה תוכנית עסקית מלאה לעסקת נדל"ן ובדוק כדאיות',
      icon: <TrendingUp className="w-7 h-7 text-orange-600" />,
      link: '/deal-business-plan',
      color: 'bg-orange-100',
      bgColor: 'bg-gradient-to-br from-orange-50/80 to-background'
    },
    {
      title: 'כדאיות שיפוץ',
      description: 'העריך עלויות שיפוץ ובדוק אם השיפוץ משתלם',
      icon: <Hammer className="w-7 h-7 text-purple-600" />,
      link: '/renovation-feasibility',
      color: 'bg-purple-100',
      bgColor: 'bg-gradient-to-br from-purple-50/80 to-background'
    },
    {
      title: 'ביקור בנכס',
      description: 'רשימת בדיקות מקיפה לביקור בנכס לפני קנייה',
      icon: <ClipboardCheck className="w-7 h-7 text-pink-600" />,
      link: '/property-visit',
      color: 'bg-pink-100',
      bgColor: 'bg-gradient-to-br from-pink-50/80 to-background'
    },
    {
      title: 'ציר זמן לעסקה',
      description: 'הבן את השלבים והזמנים בתהליך רכישת דירה',
      icon: <Calendar className="w-7 h-7 text-indigo-600" />,
      link: '/transaction-timeline',
      color: 'bg-indigo-100',
      bgColor: 'bg-gradient-to-br from-indigo-50/80 to-background'
    },
    {
      title: 'התחדשות עירונית',
      description: 'למד על תמ"א 38 ופינוי-בינוי - מה זה ואיך זה עובד',
      icon: <Building2 className="w-7 h-7 text-cyan-600" />,
      link: '/urban-renewal',
      color: 'bg-cyan-100',
      bgColor: 'bg-gradient-to-br from-cyan-50/80 to-background'
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background">
      <div className="max-w-6xl mx-auto p-4 sm:p-6 space-y-8">
        {/* Simple Hero Section */}
        <div className="text-center space-y-4 py-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground">
            כלי עזר לעסקאות נדל"ן
          </h1>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto">
            בחר את הכלי המתאים וקבל תוצאות מיידיות. פשוט, מהיר ומדויק.
          </p>
        </div>

        {/* Quick Start Guide */}
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
                <BookOpen className="w-5 h-5 text-primary" />
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold text-lg">מתחילים? הנה 3 צעדים פשוטים:</h3>
                <ol className="text-muted-foreground space-y-1 list-decimal list-inside text-sm sm:text-base">
                  <li><strong>בדיקה פיננסית</strong> - גלה מה התקציב שלך</li>
                  <li><strong>מחשבון משכנתא</strong> - חשב כמה תשלם כל חודש</li>
                  <li><strong>תוכנית עסקית</strong> - בדוק אם העסקה כדאית</li>
                </ol>
                <Link to="/glossary" className="inline-flex items-center gap-1 text-sm text-primary hover:underline mt-2">
                  <BookOpen className="w-4 h-4" />
                  לא מכיר מונחים? לחץ כאן למילון
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Calculator Cards Grid */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold">בחר כלי</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {calculators.map((calc, index) => (
              <div 
                key={calc.link} 
                className="animate-fade-in"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <CalculatorCard {...calc} />
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Links */}
        <div className="grid sm:grid-cols-2 gap-4">
          {/* Dashboard Link */}
          <Card className="border-0 bg-muted/50">
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

          {/* Glossary Link */}
          <Card className="border-0 bg-muted/50">
            <CardContent className="p-4 sm:p-6">
              <Link to="/glossary" className="flex items-center justify-between group">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
                    <BookOpen className="w-5 h-5 text-orange-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold">מילון מונחים</h3>
                    <p className="text-sm text-muted-foreground">הסברים פשוטים למונחי נדל"ן</p>
                  </div>
                </div>
                <ArrowLeft className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:-translate-x-1 transition-all" />
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
