import { CalculationHistory } from '@/lib/storage/calculator-history';

export interface Recommendation {
  id: string;
  title: string;
  description: string;
  type: 'calculator' | 'action' | 'insight';
  priority: 'high' | 'medium' | 'low';
  icon: string;
  link?: string;
  action?: () => void;
}

export function analyzeUserBehavior(history: CalculationHistory[]): Recommendation[] {
  const recommendations: Recommendation[] = [];

  if (history.length === 0) {
    return getNewUserRecommendations();
  }

  // Analyze calculation types
  const calculationTypes = history.reduce((acc, item) => {
    acc[item.type] = (acc[item.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Find most used calculator
  const mostUsed = Object.entries(calculationTypes)
    .sort(([, a], [, b]) => b - a)[0];

  // Check for unused calculators
  const allTypes = ['mortgage', 'financial-checkup', 'deal', 'renovation', 'property-visit', 'transaction-timeline', 'urban-renewal'];
  const unusedTypes = allTypes.filter(type => !calculationTypes[type]);

  // Analyze recent activity
  const lastWeek = history.filter(h => {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return new Date(h.timestamp) > weekAgo;
  });

  const lastMonth = history.filter(h => {
    const monthAgo = new Date();
    monthAgo.setDate(monthAgo.getDate() - 30);
    return new Date(h.timestamp) > monthAgo;
  });

  // Generate recommendations based on patterns

  // 1. Most used calculator insight
  if (mostUsed) {
    const typeNames: Record<string, string> = {
      'mortgage': 'משכנתא',
      'financial-checkup': 'צ\'ק-אפ פיננסי',
      'deal': 'תוכנית עסקה',
      'renovation': 'שיפוץ',
      'property-visit': 'ביקור נכס',
      'transaction-timeline': 'ציר זמן',
      'urban-renewal': 'התחדשות עירונית'
    };

    recommendations.push({
      id: 'most-used',
      title: `המחשבון האהוב עליך: ${typeNames[mostUsed[0]]}`,
      description: `השתמשת ב${typeNames[mostUsed[0]]} ${mostUsed[1]} פעמים. כדאי לשמור את החישובים החשובים ביותר.`,
      type: 'insight',
      priority: 'medium',
      icon: 'TrendingUp'
    });
  }

  // 2. Suggest unused calculators
  if (unusedTypes.length > 0 && history.length > 5) {
    const typeLinks: Record<string, { name: string; link: string }> = {
      'mortgage': { name: 'מחשבון משכנתא', link: '/mortgage' },
      'financial-checkup': { name: 'צ\'ק-אפ פיננסי', link: '/financial-checkup' },
      'deal': { name: 'תוכנית עסקה', link: '/deal' },
      'renovation': { name: 'מחשבון שיפוץ', link: '/renovation' },
      'property-visit': { name: 'ביקור נכס', link: '/property-visit' },
      'transaction-timeline': { name: 'ציר זמן עסקה', link: '/transaction-timeline' },
      'urban-renewal': { name: 'התחדשות עירונית', link: '/urban-renewal' }
    };

    const suggested = unusedTypes[0];
    if (typeLinks[suggested]) {
      recommendations.push({
        id: 'try-new',
        title: `נסה את ${typeLinks[suggested].name}`,
        description: 'עדיין לא השתמשת בכלי הזה. אולי הוא יכול לעזור לך?',
        type: 'calculator',
        priority: 'low',
        icon: 'Sparkles',
        link: typeLinks[suggested].link
      });
    }
  }

  // 3. Activity-based recommendations
  if (lastWeek.length === 0 && history.length > 0) {
    recommendations.push({
      id: 'inactive',
      title: 'לא ראינו אותך השבוע',
      description: 'כדאי לעדכן את החישובים שלך ולבדוק אם יש שינויים.',
      type: 'action',
      priority: 'medium',
      icon: 'Clock'
    });
  } else if (lastWeek.length > 10) {
    recommendations.push({
      id: 'very-active',
      title: 'פעילות גבוהה!',
      description: `${lastWeek.length} חישובים השבוע. נראה שאתה במרדף אחר עסקה מנצחת!`,
      type: 'insight',
      priority: 'high',
      icon: 'Zap'
    });
  }

  // 4. Pattern-based recommendations
  const hasMultipleMortgages = (calculationTypes['mortgage'] || 0) > 3;
  const hasMultipleDeals = (calculationTypes['deal'] || 0) > 3;

  if (hasMultipleMortgages && !calculationTypes['financial-checkup']) {
    recommendations.push({
      id: 'suggest-checkup',
      title: 'כדאי לעשות צ\'ק-אפ פיננסי',
      description: 'עם כל החישובים האלה של משכנתאות, כדאי לבדוק את המצב הפיננסי הכולל שלך.',
      type: 'calculator',
      priority: 'high',
      icon: 'AlertCircle',
      link: '/financial-checkup'
    });
  }

  if (hasMultipleDeals && !calculationTypes['renovation']) {
    recommendations.push({
      id: 'suggest-renovation',
      title: 'חשבת על עלויות שיפוץ?',
      description: 'בעסקאות נדל"ן חשוב לקחת בחשבון גם עלויות שיפוץ פוטנציאליות.',
      type: 'calculator',
      priority: 'medium',
      icon: 'Wrench',
      link: '/renovation'
    });
  }

  // 5. Comparison suggestion
  if (lastMonth.length > 5) {
    recommendations.push({
      id: 'compare',
      title: 'השווה את החישובים שלך',
      description: 'יש לך מספיק חישובים להשוואה מעמיקה. עבור לעמוד ההיסטוריה כדי להשוות.',
      type: 'action',
      priority: 'medium',
      icon: 'GitCompare',
      link: '/history'
    });
  }

  // Sort by priority
  const priorityOrder = { high: 0, medium: 1, low: 2 };
  recommendations.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

  return recommendations.slice(0, 4); // Return top 4
}

function getNewUserRecommendations(): Recommendation[] {
  return [
    {
      id: 'welcome-mortgage',
      title: 'התחל עם מחשבון משכנתא',
      description: 'חשב את התשלום החודשי והעלות הכוללת של המשכנתא שלך.',
      type: 'calculator',
      priority: 'high',
      icon: 'Home',
      link: '/mortgage'
    },
    {
      id: 'welcome-checkup',
      title: 'בדוק את המצב הפיננסי שלך',
      description: 'עשה צ\'ק-אפ מהיר למצב הפיננסי הנוכחי שלך.',
      type: 'calculator',
      priority: 'high',
      icon: 'TrendingUp',
      link: '/financial-checkup'
    },
    {
      id: 'welcome-deal',
      title: 'תכנן עסקה חכמה',
      description: 'נתח עסקת נדל"ן ובדוק אם היא משתלמת.',
      type: 'calculator',
      priority: 'medium',
      icon: 'Calculator',
      link: '/deal'
    }
  ];
}
