import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AnimatedStatsCard } from '@/components/AnimatedStatsCard';
import { LineChart } from '@/components/charts/LineChart';
import { RadarChart } from '@/components/charts/RadarChart';
import { getCalculationHistory, CalculationHistory } from '@/lib/storage/calculator-history';
import { 
  TrendingUp, 
  Calculator, 
  Home, 
  Clock, 
  ArrowRight,
  Sparkles,
  BarChart3
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

export default function Dashboard() {
  const [history, setHistory] = useState<CalculationHistory[]>([]);
  const [activityData, setActivityData] = useState<any[]>([]);
  const [categoryData, setCategoryData] = useState<any[]>([]);

  useEffect(() => {
    const data = getCalculationHistory();
    setHistory(data);

    // Activity over time
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      return date.toLocaleDateString('he-IL', { weekday: 'short' });
    });

    const activityByDay = last7Days.map((day, index) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - index));
      date.setHours(0, 0, 0, 0);
      
      const nextDay = new Date(date);
      nextDay.setDate(nextDay.getDate() + 1);
      
      const count = data.filter(item => {
        const itemDate = new Date(item.timestamp);
        return itemDate >= date && itemDate < nextDay;
      }).length;

      return { day, count };
    });

    setActivityData(activityByDay);

    // Category distribution
    const categories = [
      { name: 'משכנתא', value: data.filter(h => h.type === 'mortgage').length },
      { name: 'צ\'ק-אפ', value: data.filter(h => h.type === 'financial-checkup').length },
      { name: 'עסקאות', value: data.filter(h => h.type === 'deal').length },
      { name: 'שיפוץ', value: data.filter(h => h.type === 'renovation').length },
      { name: 'ביקור', value: data.filter(h => h.type === 'property-visit').length },
    ];

    setCategoryData(categories);
  }, []);

  const totalCalculations = history.length;
  const thisWeek = history.filter(h => {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return new Date(h.timestamp) > weekAgo;
  }).length;

  const popularCalculators = [
    { name: 'משכנתא', count: history.filter(h => h.type === 'mortgage').length, icon: Home, link: '/mortgage' },
    { name: 'צ\'ק-אפ פיננסי', count: history.filter(h => h.type === 'financial-checkup').length, icon: TrendingUp, link: '/financial-checkup' },
    { name: 'תוכנית עסקה', count: history.filter(h => h.type === 'deal').length, icon: Calculator, link: '/deal' },
    { name: 'ציר זמן', count: history.filter(h => h.type === 'transaction-timeline').length, icon: Clock, link: '/transaction-timeline' },
  ];

  const recentCalculations = history.slice(0, 5);

  return (
    <div className="space-y-8 pb-8">
      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-background to-secondary/10 p-8 border-2 border-primary/20"
      >
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center">
              <Sparkles className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">ברוך הבא לדשבורד שלך</h1>
              <p className="text-muted-foreground">מרכז הבקרה הפיננסי שלך</p>
            </div>
          </div>
          <p className="text-lg mb-6 max-w-2xl">
            עקוב אחר החישובים שלך, נתח מגמות וקבל תובנות חכמות על הפעילות הפיננסית שלך
          </p>
        </div>
        <div className="absolute top-0 left-0 w-full h-full opacity-5">
          <BarChart3 className="w-full h-full" />
        </div>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <AnimatedStatsCard
          title="סה&quot;כ חישובים"
          value={totalCalculations}
          icon={Calculator}
          iconColor="blue"
          delay={0}
          animateNumber
        />
        <AnimatedStatsCard
          title="השבוע"
          value={thisWeek}
          icon={Clock}
          iconColor="green"
          delay={0.1}
          animateNumber
        />
        <AnimatedStatsCard
          title="ממוצע יומי"
          value={Math.round(totalCalculations / 30)}
          icon={TrendingUp}
          iconColor="orange"
          delay={0.2}
          animateNumber
        />
        <AnimatedStatsCard
          title="קטגוריות פעילות"
          value={categoryData.filter(c => c.value > 0).length}
          icon={Home}
          iconColor="purple"
          delay={0.3}
          animateNumber
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <LineChart
          data={activityData}
          title="פעילות שבועית"
          description="מספר החישובים שביצעת בשבוע האחרון"
          xKey="day"
          lines={[
            { key: 'count', label: 'חישובים', color: '--primary' }
          ]}
        />
        <RadarChart
          data={categoryData}
          title="פילוח לפי קטגוריות"
          description="התפלגות החישובים שלך"
          dataKey="value"
          nameKey="name"
          color="--primary"
        />
      </div>

      {/* Popular Calculators */}
      <div>
        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
          <TrendingUp className="h-6 w-6" />
          המחשבונים הפופולריים שלך
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {popularCalculators.map((calc, index) => (
            <motion.div
              key={calc.name}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
            >
              <Link to={calc.link}>
                <Card className="hover:shadow-lg transition-all hover:scale-105 cursor-pointer border-2 hover:border-primary/50">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <calc.icon className="h-8 w-8 text-primary" />
                      <span className="text-3xl font-bold text-primary">{calc.count}</span>
                    </div>
                    <CardTitle className="text-lg">{calc.name}</CardTitle>
                  </CardHeader>
                </Card>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl flex items-center gap-2">
                <Clock className="h-5 w-5" />
                פעילות אחרונה
              </CardTitle>
              <CardDescription>5 החישובים האחרונים שלך</CardDescription>
            </div>
            <Link to="/history">
              <Button variant="outline">
                צפה בהכל
                <ArrowRight className="mr-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {recentCalculations.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Calculator className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>עדיין לא ביצעת חישובים</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentCalculations.map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-center justify-between p-3 rounded-lg bg-accent/50 hover:bg-accent transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{item.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(item.timestamp).toLocaleDateString('he-IL')}
                    </p>
                  </div>
                  <div className="text-left font-semibold">
                    {item.result}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
