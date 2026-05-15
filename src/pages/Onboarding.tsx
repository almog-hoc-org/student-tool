import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  ChevronLeft,
  Sparkles,
  Calculator,
  MessageCircle,
  Wallet,
  Home as HomeIcon,
  TrendingUp,
  ArrowRight,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Step {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  body: string;
}

const STEPS: Step[] = [
  {
    icon: Sparkles,
    title: 'ברוך הבא לקורס',
    body: 'אנחנו פה ללוות אותך לאורך כל הדרך מהחיסכון הראשון ועד מסירת המפתח. הקורס משלב למידה תיאורטית עם כלי חישוב מעשיים — אחרי כל שיעור נסה את הכלי המתאים.',
  },
  {
    icon: Calculator,
    title: 'שלושה כלי החישוב המרכזיים',
    body: 'מחשבון תקציב מגדיר תקרת רכישה אישית. מחשבון משכנתא בודק מסלולים. תוכנית עסקית בודקת כדאיות עסקה ספציפית. הם מסונכרנים — מה שמילאת באחד מוזרם לאחר.',
  },
  {
    icon: MessageCircle,
    title: 'הצ׳אט הוא היועץ האישי שלך',
    body: 'הצ׳אט מאומן על תוכן הקורס ועל הנתונים שלך. כשהוא לא יודע (או שזו שאלה רגישה), תמצא באנר בתחתית הצ׳אט (וכרטיס באזור האישי) לשליחת השאלה לנציג — נחזור אליך תוך 24 שעות.',
  },
];

export default function Onboarding() {
  const { profile, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [finishing, setFinishing] = useState(false);

  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;

  const finish = async () => {
    setFinishing(true);
    try {
      const { error } = await supabase.rpc('mark_onboarded');
      if (error) throw error;
      await refreshProfile();
      toast.success('נשמח לראות אותך מתחיל!');
      navigate('/');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'שגיאה');
    } finally {
      setFinishing(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4" dir="rtl">
      <Card className="w-full max-w-md">
        <CardContent className="p-8 space-y-6">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>שלב {step + 1} מתוך {STEPS.length}</span>
            <span>{profile?.display_name || 'תלמיד חדש'}</span>
          </div>

          <div className="space-y-4 text-center">
            <div className="mx-auto w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center">
              <current.icon className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-2xl font-bold">{current.title}</h1>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {current.body}
            </p>
          </div>

          {isLast && (
            <div className="grid grid-cols-3 gap-2 pt-2">
              <QuickLink to="/" icon={Wallet} label="תקציב" />
              <QuickLink to="/mortgage" icon={HomeIcon} label="משכנתא" />
              <QuickLink to="/business-plan" icon={TrendingUp} label="עסקה" />
            </div>
          )}

          <div className="flex items-center justify-between gap-2 pt-2">
            {step > 0 ? (
              <Button variant="ghost" size="sm" onClick={() => setStep(step - 1)} className="gap-1">
                <ChevronLeft className="w-4 h-4 rotate-180" />
                הקודם
              </Button>
            ) : (
              <span />
            )}
            {!isLast ? (
              <Button onClick={() => setStep(step + 1)} className="gap-1">
                הבא
                <ChevronLeft className="w-4 h-4" />
              </Button>
            ) : (
              <Button onClick={finish} disabled={finishing} className="gap-1">
                {finishing ? 'מסיים…' : 'בוא נתחיל'}
                <ArrowRight className="w-4 h-4 rotate-180" />
              </Button>
            )}
          </div>

          <div className="flex justify-center gap-1.5 pt-1">
            {STEPS.map((_, i) => (
              <span
                key={i}
                className={`h-1.5 rounded-full transition-all ${
                  i === step ? 'w-6 bg-primary' : 'w-1.5 bg-muted'
                }`}
              />
            ))}
          </div>

          <p className="text-center text-xs">
            <Link to="/" className="text-muted-foreground hover:underline" onClick={finish}>
              דלג
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function QuickLink({ to, icon: Icon, label }: { to: string; icon: React.ComponentType<{ className?: string }>; label: string }) {
  return (
    <Link to={to} className="flex flex-col items-center gap-1 p-3 rounded-lg border hover:border-primary/50 transition">
      <Icon className="w-5 h-5 text-primary" />
      <span className="text-xs font-medium">{label}</span>
    </Link>
  );
}
