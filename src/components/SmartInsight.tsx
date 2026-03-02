import { AlertTriangle, AlertCircle, CheckCircle, Lightbulb, TrendingDown, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

export type InsightLevel = 'danger' | 'warning' | 'success' | 'tip';

export interface Insight {
  level: InsightLevel;
  title: string;
  message: string;
  icon?: 'warning' | 'danger' | 'success' | 'tip' | 'trend' | 'shield';
}

const levelStyles: Record<InsightLevel, string> = {
  danger: 'traffic-red-bg border text-[hsl(var(--chart-3))]',
  warning: 'traffic-yellow-bg border text-[hsl(var(--chart-2))] dark:text-[hsl(var(--chart-2))]',
  success: 'traffic-green-bg border text-[hsl(var(--chart-1))] dark:text-[hsl(var(--chart-1))]',
  tip: 'bg-primary/8 border-primary/20 border text-primary',
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
    <div className={cn('space-y-2.5', className)}>
      {insights.map((insight, index) => {
        const IconComp = iconMap[insight.icon || insight.level] || AlertCircle;
        return (
          <motion.div
            key={index}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.08, duration: 0.3 }}
            className={cn(
              'flex items-start gap-3 p-4 rounded-xl',
              levelStyles[insight.level]
            )}
          >
            <IconComp className="w-5 h-5 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-semibold text-sm">{insight.title}</p>
              <p className="text-sm opacity-80 mt-0.5">{insight.message}</p>
            </div>
          </motion.div>
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
        title: 'סיכון גבוה מאוד — הבנק עלול לסרב',
        message: `ההחזר החודשי מהווה ${(ratio * 100).toFixed(0)}% מההכנסה שלך. בנק ישראל מגביל יחס החזר/הכנסה ל-40%. נסה להקטין את הסכום או להאריך את התקופה.`,
      });
    } else if (ratio > 0.35) {
      insights.push({
        level: 'danger',
        icon: 'warning',
        title: 'החזר חודשי גבוה',
        message: `ההחזר מהווה ${(ratio * 100).toFixed(0)}% מההכנסה. מומלץ לא לעבור 35% כדי לשמור על גמישות פיננסית.`,
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
        message: `ההחזר החודשי מהווה ${(ratio * 100).toFixed(0)}% מההכנסה – בטווח הבריא. יש לך מרווח פיננסי נוח.`,
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
  } else if (interestRatio < 0.3 && totalPrincipal > 0) {
    insights.push({
      level: 'success',
      icon: 'success',
      title: 'יחס ריבית/קרן מצוין',
      message: `סך הריבית רק ${(interestRatio * 100).toFixed(0)}% מהקרן – תמהיל יעיל!`,
    });
  }

  return insights;
}

export function generateDealInsights(params: {
  cocYield?: number;
  roi?: number;
  irr?: number;
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

  if (params.irr !== undefined && params.cocYield !== undefined) {
    if (params.irr > params.cocYield * 1.5) {
      insights.push({
        level: 'tip',
        icon: 'tip',
        title: 'ה-IRR גבוה משמעותית מתשואת Cash-on-Cash',
        message: `IRR של ${(params.irr * 100).toFixed(1)}% לעומת CoC של ${(params.cocYield * 100).toFixed(1)}%. עליית ערך הנכס משפיעה מאוד על הכדאיות לטווח ארוך.`,
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
      message: `הון עצמי של ${params.equityPercent.toFixed(0)}% בלבד. סיכון גבוה – בנק ישראל מגביל מינוף ל-50%-75% לפי סוג הרוכש.`,
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

export function generateSideCostsInsights(params: {
  totalSideCosts: number;
  purchasePrice: number;
}): Insight[] {
  const insights: Insight[] = [];
  const ratio = params.purchasePrice > 0 ? params.totalSideCosts / params.purchasePrice : 0;

  if (ratio > 0.10) {
    insights.push({
      level: 'warning',
      icon: 'warning',
      title: 'עלויות נלוות גבוהות',
      message: `העלויות הנלוות מהוות ${(ratio * 100).toFixed(1)}% ממחיר הרכישה – מעל 10%. בדוק אם ניתן לחסוך בתיווך או שיפוץ.`,
    });
  }

  return insights;
}
