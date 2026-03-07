import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Calculator, Home, TrendingUp, ClipboardCheck, Hammer } from 'lucide-react';

interface NextStepCardProps {
  currentCalculator: string;
}

const nextStepMap: Record<string, { path: string; text: string; icon: React.ReactNode }> = {
  'financial-checkup': {
    path: '/mortgage-calculator',
    text: 'עכשיו שאתה יודע כמה הון יש לך, בוא נבדוק כמה משכנתא אפשר לקחת',
    icon: <Calculator className="h-5 w-5" />,
  },
  'mortgage-calculator': {
    path: '/deal-business-plan',
    text: 'יש לך את המספרים - בוא נבדוק כדאיות עסקה',
    icon: <TrendingUp className="h-5 w-5" />,
  },
  'deal-business-plan': {
    path: '/property-visit',
    text: 'מצאת עסקה מעניינת? בוא נבדוק את הנכס',
    icon: <ClipboardCheck className="h-5 w-5" />,
  },
  'property-visit': {
    path: '/renovation-feasibility',
    text: 'הנכס דורש שיפוץ? בוא נבדוק כדאיות',
    icon: <Hammer className="h-5 w-5" />,
  },
};

const defaultStep = {
  path: '/financial-checkup',
  text: 'התחל עם בדיקה פיננסית',
  icon: <Home className="h-5 w-5" />,
};

export default function NextStepCard({ currentCalculator }: NextStepCardProps) {
  const navigate = useNavigate();
  const step = nextStepMap[currentCalculator] ?? defaultStep;

  return (
    <Card className="bg-primary/5 border-primary/20">
      <CardContent className="flex items-center justify-between gap-4 p-4">
        <div className="flex items-center gap-3 text-primary">
          {step.icon}
          <span className="text-sm font-medium">{step.text}</span>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="shrink-0 gap-1.5 border-primary/30 text-primary hover:bg-primary/10"
          onClick={() => navigate(step.path)}
        >
          המשך
          <ArrowLeft className="h-4 w-4" />
        </Button>
      </CardContent>
    </Card>
  );
}
