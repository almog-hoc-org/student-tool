import { AlertTriangle, AlertCircle, CheckCircle, Lightbulb, TrendingDown, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';

export type InsightLevel = 'danger' | 'warning' | 'success' | 'tip';

export interface Insight {
  level: InsightLevel;
  title: string;
  message: string;
  icon?: 'warning' | 'danger' | 'success' | 'tip' | 'trend' | 'shield';
}

const levelStyles: Record<InsightLevel, string> = {
  danger: 'bg-destructive/10 border-destructive/30 text-destructive',
  warning: 'bg-orange-500/10 border-orange-500/30 text-orange-700 dark:text-orange-400',
  success: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-400',
  tip: 'bg-primary/10 border-primary/30 text-primary',
};

const iconMap = {
  warning: AlertCircle,
  danger: AlertTriangle,
  success: CheckCircle,
  tip: Lightbulb,
  trend: TrendingDown,
  shield: Shield,
};

interface SmartInsightProps {
  insights: Insight[];
  className?: string;
}

export function SmartInsight({ insights, className }: SmartInsightProps) {
  if (insights.length === 0) return null;

  return (
    <div className={cn('space-y-3', className)}>
      {insights.map((insight, index) => {
        const IconComp = iconMap[insight.icon || insight.level] || AlertCircle;
        return (
          <div
            key={index}
            className={cn(
              'flex items-start gap-3 p-4 rounded-xl border animate-in slide-in-from-bottom duration-300',
              levelStyles[insight.level]
            )}
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <IconComp className="w-5 h-5 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-semibold text-sm">{insight.title}</p>
              <p className="text-sm opacity-90 mt-0.5">{insight.message}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Helper functions to generate insights

export function generateMortgageInsights(params: {
  monthlyPayment: number;
  monthlyIncome?: number;
  totalInterest: number;
  totalPrincipal: number;
}): Insight[] {
  const insights: Insight[] = [];
  const { monthlyPayment, monthlyIncome, totalInterest, totalPrincipal } = params;

  if (monthlyIncome && monthlyIncome > 0) {
    const ratio = monthlyPayment / monthlyIncome;
    if (ratio > 0.4) {
      insights.push({
        level: 'danger',
        icon: 'danger',
        title: '⚠️ סיכון גבוה מאוד',
        message: `ההחזר החודשי מהווה ${(ratio * 100).toFixed(0)}% מההכנסה שלך. מעל 40% נחשב מסוכן מאוד. הבנק עלול לסרב.`,
      });
    } else if (ratio > 0.35) {
      insights.push({
        level: 'danger',
        icon: 'warning',
        title: '⚠️ החזר חודשי גבוה',
        message: `ההחזר החודשי מהווה ${(ratio * 100).toFixed(0)}% מההכנסה. מומלץ לא לעבור 35% מההכנסה הפנויה.`,
      });
    } else if (ratio > 0.3) {
      insights.push({
        level: 'warning',
        icon: 'warning',
        title: 'שים לב ליחס החזר/הכנסה',
        message: `ההחזר מהווה ${(ratio * 100).toFixed(0)}% מההכנסה. זה על הגבול – שקול הורדת הסכום או הארכת התקופה.`,
      });
    } else {
      insights.push({
        level: 'success',
        icon: 'success',
        title: 'יחס החזר/הכנסה תקין',
        message: `ההחזר החודשי מהווה ${(ratio * 100).toFixed(0)}% מההכנסה – בטווח הבריא.`,
      });
    }
  }

  const interestRatio = totalPrincipal > 0 ? totalInterest / totalPrincipal : 0;
  if (interestRatio > 0.6) {
    insights.push({
      level: 'warning',
      icon: 'trend',
      title: 'ריבית כוללת גבוהה',
      message: `סך הריבית שתשלם (${(interestRatio * 100).toFixed(0)}% מהקרן) גבוה. שקול לקצר את תקופת המשכנתא או להגדיל תשלומים חודשיים.`,
    });
  }

  return insights;
}

export function generateDealInsights(params: {
  cocYield?: number;
  roi?: number;
  netCashflow?: number;
  equityPercent: number;
  monthlyPayment?: number;
  monthlyIncome?: number;
}): Insight[] {
  const insights: Insight[] = [];

  if (params.cocYield !== undefined) {
    if (params.cocYield < 0.03) {
      insights.push({
        level: 'danger',
        title: 'תשואה נמוכה',
        message: 'תשואת Cash-on-Cash מתחת ל-3%. העסקה חלשה – שקול חלופות השקעה.',
      });
    } else if (params.cocYield >= 0.07) {
      insights.push({
        level: 'success',
        icon: 'success',
        title: 'תשואה מצוינת!',
        message: `תשואת Cash-on-Cash של ${(params.cocYield * 100).toFixed(1)}% – זו עסקה אטרקטיבית.`,
      });
    }
  }

  if (params.netCashflow !== undefined && params.netCashflow < 0) {
    insights.push({
      level: 'danger',
      icon: 'danger',
      title: 'תזרים שלילי!',
      message: 'ההוצאות עולות על ההכנסות. תצטרך לממן את ההפרש מכיסך כל חודש.',
    });
  }

  if (params.equityPercent < 25) {
    insights.push({
      level: 'warning',
      icon: 'shield',
      title: 'מינוף גבוה',
      message: `הון עצמי של ${params.equityPercent.toFixed(0)}% בלבד. סיכון גבוה – מומלץ לפחות 25% הון עצמי.`,
    });
  }

  return insights;
}

export function generateFinancialInsights(params: {
  freeCashFlow: number;
  totalIncome: number;
  availableEquity: number;
  readinessScore: number;
  maxSafeMortgagePayment: number;
}): Insight[] {
  const insights: Insight[] = [];

  if (params.freeCashFlow < 0) {
    insights.push({
      level: 'danger',
      icon: 'danger',
      title: 'תזרים מזומנים שלילי',
      message: 'ההוצאות שלך עולות על ההכנסות. מומלץ לצמצם הוצאות לפני התחייבות למשכנתא.',
    });
  } else if (params.freeCashFlow < params.totalIncome * 0.1) {
    insights.push({
      level: 'warning',
      title: 'מרווח פיננסי צר',
      message: 'התזרים החופשי שלך נמוך מ-10% מההכנסה. מומלץ לבנות כרית ביטחון גדולה יותר.',
    });
  }

  if (params.availableEquity < 200000) {
    insights.push({
      level: 'warning',
      icon: 'shield',
      title: 'הון עצמי נמוך',
      message: 'ההון העצמי הזמין שלך מתחת ל-200,000 ₪. שקול לחסוך עוד לפני כניסה לעסקה.',
    });
  }

  if (params.readinessScore >= 70) {
    insights.push({
      level: 'success',
      icon: 'success',
      title: 'מוכנות גבוהה!',
      message: 'אתה בעמדה טובה לשקול עסקת נדל"ן. עבור למחשבון תוכנית עסקית לבחינת עסקאות.',
    });
  }

  return insights;
}
