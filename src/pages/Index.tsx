import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { HistoryCard } from '@/components/HistoryCard';
import { 
  Calculator, 
  Home, 
  TrendingUp, 
  Hammer, 
  ClipboardCheck, 
  Calendar,
  Building2,
  ChevronLeft,
  Sparkles
} from 'lucide-react';
import { getCalculationHistory } from '@/lib/storage/calculator-history';
import { useState, useEffect } from 'react';

interface CalculatorCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  link: string;
  gradient: string;
}

function CalculatorCard({ title, description, icon, link, gradient }: CalculatorCardProps) {
  return (
    <Link to={link}>
      <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 group overflow-hidden h-full">
        <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity ${gradient}`} />
        <CardHeader className="relative z-10">
          <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
            {icon}
          </div>
          <CardTitle className="text-xl group-hover:text-primary transition-colors">{title}</CardTitle>
          <CardDescription className="text-sm">{description}</CardDescription>
        </CardHeader>
        <CardContent className="relative z-10">
          <Button variant="ghost" size="sm" className="w-full justify-between group-hover:bg-primary/10">
            התחל חישוב
            <ChevronLeft className="w-4 h-4" />
          </Button>
        </CardContent>
      </Card>
    </Link>
  );
}

export default function Index() {
  const [history, setHistory] = useState(getCalculationHistory());

  useEffect(() => {
    setHistory(getCalculationHistory());
  }, []);

  const calculators = [
    {
      title: 'בדיקת כדאיות פיננסית',
      description: 'נתח את המצב הפיננסי שלך וקבל המלצות מותאמות אישית',
      icon: <Calculator className="w-6 h-6 text-primary" />,
      link: '/',
      gradient: 'bg-gradient-to-br from-blue-50/50 to-transparent'
    },
    {
      title: 'מחשבון משכנתא',
      description: 'חשב תשלומים חודשיים והשווה בין מסלולי משכנתא',
      icon: <Home className="w-6 h-6 text-primary" />,
      link: '/mortgage-calculator',
      gradient: 'bg-gradient-to-br from-emerald-50/50 to-transparent'
    },
    {
      title: 'תוכנית עסקית לעסקה',
      description: 'בנה תוכנית עסקית מקצועית לעסקת נדל"ן',
      icon: <TrendingUp className="w-6 h-6 text-primary" />,
      link: '/deal-business-plan',
      gradient: 'bg-gradient-to-br from-orange-50/50 to-transparent'
    },
    {
      title: 'כדאיות שיפוץ',
      description: 'העריך את הרווחיות של פרויקט שיפוץ',
      icon: <Hammer className="w-6 h-6 text-primary" />,
      link: '/renovation-feasibility',
      gradient: 'bg-gradient-to-br from-purple-50/50 to-transparent'
    },
    {
      title: 'ביקור בנכס',
      description: 'בצע הערכה מקצועית של נכס במהלך ביקור',
      icon: <ClipboardCheck className="w-6 h-6 text-primary" />,
      link: '/property-visit',
      gradient: 'bg-gradient-to-br from-pink-50/50 to-transparent'
    },
    {
      title: 'ציר זמן לעסקה',
      description: 'תכנן ועקוב אחר שלבי העסקה',
      icon: <Calendar className="w-6 h-6 text-primary" />,
      link: '/transaction-timeline',
      gradient: 'bg-gradient-to-br from-indigo-50/50 to-transparent'
    },
    {
      title: 'התחדשות עירונית',
      description: 'הבן את תהליך ההתחדשות העירונית',
      icon: <Building2 className="w-6 h-6 text-primary" />,
      link: '/urban-renewal',
      gradient: 'bg-gradient-to-br from-cyan-50/50 to-transparent'
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background">
      <div className="max-w-7xl mx-auto p-6 space-y-12">
        {/* Hero Section */}
        <div className="text-center space-y-6 py-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full text-primary text-sm font-medium mb-4">
            <Sparkles className="w-4 h-4" />
            <span>מערכת מחשבונים פיננסיים מתקדמת</span>
          </div>
          
          <h1 className="text-5xl md:text-6xl font-bold tracking-tight bg-gradient-to-l from-primary via-primary/80 to-primary bg-clip-text text-transparent">
            כלים חכמים להחלטות פיננסיות
          </h1>
          
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            מערכת מקצועית לניתוח עסקאות נדל"ן, חישוב משכנתאות, והערכת כדאיות השקעות
          </p>

          <div className="flex items-center justify-center gap-4 pt-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              <span>חישוב מיידי</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
              <span>ויזואליזציות מתקדמות</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse" />
              <span>שמירה אוטומטית</span>
            </div>
          </div>
        </div>

        {/* History Section */}
        {history.length > 0 && (
          <div className="animate-fade-in">
            <HistoryCard 
              items={history} 
              onRefresh={() => setHistory(getCalculationHistory())}
            />
          </div>
        )}

        {/* Calculator Cards Grid */}
        <div className="space-y-4">
          <h2 className="text-3xl font-bold">המחשבונים שלנו</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {calculators.map((calc, index) => (
              <div 
                key={calc.link} 
                className="animate-fade-in"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <CalculatorCard {...calc} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
