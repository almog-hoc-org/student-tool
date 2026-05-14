import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  User, Wallet, TrendingUp, Home, Sparkles, LogOut, CheckCircle2,
  MessageCircle, ArrowLeft, Calendar, LifeBuoy, GraduationCap,
} from 'lucide-react';
import { load } from '@/lib/storage';
import { BudgetOutput } from '@/lib/calculations/budget-calculator';
import { formatCurrency } from '@/lib/validation/validators';
import { cn } from '@/lib/utils';
import { listEnrolledCourses, type CourseWithProgress } from '@/lib/learn';

interface ToolStatus {
  key: string;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
  done: boolean;
  summary: string | null;
}

export default function Account() {
  const { user, profile, signOut, isAdmin } = useAuth();
  const [courses, setCourses] = useState<CourseWithProgress[]>([]);

  useEffect(() => {
    if (!user) return;
    listEnrolledCourses(user.id).then(setCourses).catch(() => {});
  }, [user]);

  const budget = load<{ equity: number; monthlyIncome: number }>('budget');
  const budgetResults = load<BudgetOutput>('budget_results');
  const businessPlan = load<{ purchasePrice: number; expectedMonthlyRent: number }>('business_plan');
  const mortgage = load<{ tracks: { principal: number }[]; monthlyIncome: number }>('mortgage');
  const mortgageResults = load<{ totalMonthlyPayment: number; weightedAverageInterest: number }>('mortgage_results');

  const tools: ToolStatus[] = [
    {
      key: 'budget',
      name: 'תקציב',
      icon: Wallet,
      href: '/',
      done: !!budget && !!budgetResults,
      summary: budgetResults
        ? `דירה עד ${formatCurrency(budgetResults.maxPropertyValue)}`
        : null,
    },
    {
      key: 'mortgage',
      name: 'משכנתא',
      icon: Home,
      href: '/mortgage',
      done: !!mortgage && !!mortgageResults,
      summary: mortgageResults
        ? `החזר ${formatCurrency(mortgageResults.totalMonthlyPayment)}/חודש, ריבית ${mortgageResults.weightedAverageInterest.toFixed(1)}%`
        : null,
    },
    {
      key: 'business_plan',
      name: 'תוכנית עסקית',
      icon: TrendingUp,
      href: '/business-plan',
      done: !!businessPlan,
      summary: businessPlan
        ? `נכס ${formatCurrency(businessPlan.purchasePrice)}, שכירות ${formatCurrency(businessPlan.expectedMonthlyRent)}`
        : null,
    },
  ];

  const completed = tools.filter(t => t.done).length;
  const progressPercent = (completed / tools.length) * 100;

  const statusLabels: Record<string, string> = {
    pending: 'ממתין לאישור',
    approved: 'מאושר',
    rejected: 'נדחה',
  };

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header with profile */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="" className="w-16 h-16 rounded-full" />
            ) : (
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="w-8 h-8 text-primary" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-bold truncate">{profile?.display_name || 'משתמש'}</h1>
              <p className="text-sm text-muted-foreground truncate" dir="ltr">{user?.email}</p>
              <div className="flex gap-2 mt-2">
                <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                  {statusLabels[profile?.status ?? 'pending']}
                </Badge>
                {isAdmin && (
                  <Badge variant="secondary" className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                    מנהל
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Learning progress */}
      {courses.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <GraduationCap className="w-4 h-4" />
              ההתקדמות שלי בקורסים
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {courses.map(({ course, totalLessons, completedLessons }) => {
              const pct = totalLessons ? Math.round((completedLessons / totalLessons) * 100) : 0;
              return (
                <Link key={course.id} to={`/learn/${course.slug}`} className="block">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{course.title}</span>
                      <span className="text-muted-foreground">{completedLessons}/{totalLessons} · {pct}%</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div className="bg-primary h-2 rounded-full transition-all" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                </Link>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Calculator progress */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            התקדמות במחשבונים
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-muted-foreground">{completed} מתוך {tools.length} מחשבונים מולאו</span>
              <span className="font-semibold">{Math.round(progressPercent)}%</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div
                className="bg-primary h-2 rounded-full transition-all"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tools summary */}
      <div className="space-y-2">
        <h2 className="font-semibold text-sm text-muted-foreground px-1">הנתונים שלי</h2>
        {tools.map(tool => {
          const Icon = tool.icon;
          return (
            <Link key={tool.key} to={tool.href}>
              <Card className={cn('hover:border-primary/50 transition-colors', tool.done && 'bg-muted/30')}>
                <CardContent className="p-4 flex items-center gap-3">
                  <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center shrink-0',
                    tool.done ? 'bg-green-500/10' : 'bg-muted'
                  )}>
                    {tool.done ? (
                      <CheckCircle2 className="w-5 h-5 text-green-500" />
                    ) : (
                      <Icon className="w-5 h-5 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium">{tool.name}</p>
                    <p className="text-sm text-muted-foreground truncate">
                      {tool.summary ?? 'טרם הוזנו נתונים — התחל כאן'}
                    </p>
                  </div>
                  <ArrowLeft className="w-4 h-4 text-muted-foreground shrink-0" />
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      {/* Quick actions */}
      <div className="space-y-2">
        <h2 className="font-semibold text-sm text-muted-foreground px-1">כלים חכמים</h2>
        <div className="grid grid-cols-2 gap-2">
          <Link to="/advisor">
            <Card className="hover:border-primary/50 transition-colors">
              <CardContent className="p-4 flex flex-col items-center text-center gap-2">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-primary" />
                </div>
                <p className="font-medium text-sm">תובנות חכמות</p>
              </CardContent>
            </Card>
          </Link>
          <Link to="/chat">
            <Card className="hover:border-primary/50 transition-colors">
              <CardContent className="p-4 flex flex-col items-center text-center gap-2">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <MessageCircle className="w-5 h-5 text-primary" />
                </div>
                <p className="font-medium text-sm">צ'אט עם יועץ AI</p>
              </CardContent>
            </Card>
          </Link>
          <Link to="/support">
            <Card className="hover:border-primary/50 transition-colors">
              <CardContent className="p-4 flex flex-col items-center text-center gap-2">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <LifeBuoy className="w-5 h-5 text-primary" />
                </div>
                <p className="font-medium text-sm">תמיכה</p>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>

      {/* Settings */}
      <div className="space-y-2 pt-2">
        <Button
          variant="outline"
          className="w-full justify-start gap-2 text-destructive hover:text-destructive"
          onClick={signOut}
        >
          <LogOut className="w-4 h-4" />
          התנתק
        </Button>
      </div>
    </div>
  );
}
