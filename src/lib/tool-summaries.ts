import { Wallet, TrendingUp, Home } from 'lucide-react';
import { load } from './storage';
import { BudgetOutput } from './calculations/budget-calculator';
import { formatCurrency } from './format';

export interface ToolSummary {
  key: string;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
  done: boolean;
  summary: string | null;
}

/**
 * סיכומי "המספרים שלי" — מקור אחד לעמוד החשבון ולרצועת עמוד הבית.
 */
export function getToolSummaries(): ToolSummary[] {
  const budget = load<{ equity: number; monthlyIncome: number }>('budget');
  const budgetResults = load<BudgetOutput>('budget_results');
  const businessPlan = load<{ purchasePrice: number; expectedMonthlyRent: number }>('business_plan');
  const mortgage = load<{ tracks: { principal: number }[]; monthlyIncome: number }>('mortgage');
  const mortgageResults = load<{ totalMonthlyPayment: number; weightedAverageInterest: number }>('mortgage_results');

  return [
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
      key: 'business_plan',
      name: 'תוכנית עסקית',
      icon: TrendingUp,
      href: '/business-plan',
      done: !!businessPlan,
      summary: businessPlan
        ? `נכס ${formatCurrency(businessPlan.purchasePrice)}, שכירות ${formatCurrency(businessPlan.expectedMonthlyRent)}`
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
  ];
}
