import { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { calculateQuickCheck, QuickCheckOutput } from '@/lib/calculations/quick-property-check';
import { BuyerType } from '@/lib/calculations/purchase-tax';
import { formatCurrency } from '@/lib/validation/validators';
import { StatsCard } from '@/components/StatsCard';
import { SmartInsight, type Insight } from '@/components/SmartInsight';
import { PageHero } from '@/components/PageHero';
import { useJourney } from '@/contexts/JourneyContext';
import { saveCalculation } from '@/lib/storage/calculator-history';
import { saveProperty } from '@/lib/storage/property-storage';
import { toast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';
import {
  Zap,
  Home,
  Building2,
  Globe,
  Receipt,
  Wallet,
  Banknote,
  TrendingUp,
  Check,
  Info,
  ChevronLeft,
  MapPin,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

const buyerTypeOptions: { value: BuyerType; label: string; icon: React.ReactNode; shortLabel: string }[] = [
  { value: 'singleApartment', label: 'דירה יחידה', shortLabel: 'יחידה', icon: <Home className="w-4 h-4" /> },
  { value: 'additionalApartment', label: 'דירה נוספת', shortLabel: 'נוספת', icon: <Building2 className="w-4 h-4" /> },
  { value: 'foreignResident', label: 'תושב חוץ', shortLabel: 'חוץ', icon: <Globe className="w-4 h-4" /> },
];

const EQUITY_PRESETS = [
  { label: '25%', value: 25, description: 'דירה ראשונה' },
  { label: '30%', value: 30, description: 'משפרי דיור' },
  { label: '50%', value: 50, description: 'משקיעים' },
];

function generateQuickInsights(result: QuickCheckOutput, buyerType: BuyerType, financialData: Record<string, any> | null): Insight[] {
  const insights: Insight[] = [];

  // Affordability check from financial checkup
  if (financialData) {
    const availableEquity = financialData.availableEquity as number;
    const maxPayment = financialData.maxMortgagePayment as number;

    if (availableEquity >= result.totalCashNeeded && maxPayment >= result.estimatedMonthlyPayment) {
      insights.push({
        level: 'success',
        icon: 'success',
        title: 'אתה יכול להרשות את זה!',
        message: `לפי הבדיקה הפיננסית שלך, יש לך מספיק הון עצמי (${formatCurrency(availableEquity)}) וההחזר החודשי (${formatCurrency(result.estimatedMonthlyPayment)}) בטווח הבטוח שלך.`,
      });
    } else if (availableEquity < result.totalCashNeeded) {
      const gap = result.totalCashNeeded - availableEquity;
      insights.push({
        level: 'danger',
        icon: 'danger',
        title: `חסרים ${formatCurrency(gap)} בהון עצמי`,
        message: `לפי הבדיקה הפיננסית שלך, ההון הזמין (${formatCurrency(availableEquity)}) לא מספיק. צריך עוד ${formatCurrency(gap)}.`,
      });
    } else if (maxPayment < result.estimatedMonthlyPayment) {
      insights.push({
        level: 'warning',
        icon: 'warning',
        title: 'ההחזר החודשי גבוה מדי',
        message: `ההחזר המוערך (${formatCurrency(result.estimatedMonthlyPayment)}) עובר את המקסימום הבטוח שלך (${formatCurrency(maxPayment)}).`,
      });
    }
  }

  // Tax insights
  if (buyerType === 'singleApartment' && result.purchaseTax === 0) {
    insights.push({ level: 'success', title: 'פטור מלא ממס רכישה!', message: 'מחיר הדירה מתחת למדרגה הראשונה — אין מס.' });
  }

  if (buyerType === 'additionalApartment') {
    insights.push({ level: 'warning', title: 'מס רכישה מוגבר', message: `כדירה נוספת, המס מתחיל ב-8%. אתה משלם ${formatCurrency(result.purchaseTax)} מס רכישה.` });
  }

  // General tip about total cost
  const costPercent = ((result.totalAcquisitionCost - result.purchasePrice) / result.purchasePrice * 100).toFixed(1);
  insights.push({
    level: 'tip',
    title: `העלויות הנוספות: ${costPercent}% ממחיר הדירה`,
    message: `מעבר למחיר הדירה, תשלם עוד ${formatCurrency(result.purchaseTax + result.sideCosts)} על מס רכישה ועלויות נלוות.`,
  });

  return insights;
}

export default function QuickPropertyCheck() {
  const [purchasePrice, setPurchasePrice] = useState<number>(0);
  const [buyerType, setBuyerType] = useState<BuyerType>('singleApartment');
  const [equityPercent, setEquityPercent] = useState(25);
  const { saveJourneyData, getJourneyData } = useJourney();

  const financialData = getJourneyData('financial-checkup');
  const hasFinancialCheckup = financialData != null;

  // Auto-calculate reactively
  const result = useMemo<QuickCheckOutput | null>(() => {
    if (purchasePrice <= 0) return null;
    return calculateQuickCheck({ purchasePrice, buyerType, equityPercent });
  }, [purchasePrice, buyerType, equityPercent]);

  // Save to journey + history when result changes
  const handleSaveResult = () => {
    if (!result) return;
    saveJourneyData('quick-check', {
      price: purchasePrice,
      buyerType,
      equityPercent,
      totalCost: result.totalAcquisitionCost,
      totalCashNeeded: result.totalCashNeeded,
      monthlyPayment: result.estimatedMonthlyPayment,
      canAfford: hasFinancialCheckup
        ? (financialData.availableEquity >= result.totalCashNeeded && financialData.maxMortgagePayment >= result.estimatedMonthlyPayment)
        : undefined,
    });
    saveCalculation({
      type: 'deal',
      title: `בדיקה מהירה – ${formatCurrency(purchasePrice)}`,
      result: `מזומן נדרש: ${formatCurrency(result.totalCashNeeded)} | החזר: ${formatCurrency(result.estimatedMonthlyPayment)}/חודש`,
      input: { purchasePrice, buyerType, equityPercent },
    });
  };

  const insights = result ? generateQuickInsights(result, buyerType, financialData) : [];

  return (
    <div className="space-y-5 pb-8 max-w-2xl mx-auto">
      <PageHero
        icon={<Zap className="w-6 h-6 text-primary" />}
        title="בדיקה מהירה לנכס"
        description="הכנס מחיר דירה וקבל מיד תמונה מלאה — מס, עלויות, החזר חודשי והאם אתה יכול להרשות"
      />

      {/* Financial checkup context banner */}
      {!hasFinancialCheckup && (
        <Link to="/financial-checkup" className="block">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-primary/5 border border-primary/15 active:bg-primary/10 transition-colors">
            <Info className="w-5 h-5 text-primary flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground">רוצה לדעת אם אתה יכול להרשות?</p>
              <p className="text-xs text-muted-foreground">עשה בדיקה פיננסית ונראה לך תשובה מדויקת</p>
            </div>
            <ChevronLeft className="w-4 h-4 text-primary flex-shrink-0" />
          </div>
        </Link>
      )}

      {hasFinancialCheckup && (
        <div className="flex items-center gap-2 p-2.5 rounded-lg bg-[hsl(var(--chart-1)/0.08)] border border-[hsl(var(--chart-1)/0.2)]">
          <Check className="w-4 h-4 text-[hsl(var(--chart-1))] flex-shrink-0" />
          <p className="text-xs text-[hsl(var(--chart-1))]">
            מחובר לבדיקה הפיננסית שלך — הון זמין: <strong>{formatCurrency(financialData.availableEquity)}</strong>
          </p>
        </div>
      )}

      {/* Input Section */}
      <Card>
        <CardContent className="p-4 space-y-5">
          {/* Price input */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold">מחיר הדירה (₪)</Label>
            <Input
              type="number"
              value={purchasePrice || ''}
              onChange={(e) => setPurchasePrice(Number(e.target.value))}
              placeholder="למשל 1,500,000"
              className="text-lg font-medium h-12"
              inputMode="numeric"
            />
          </div>

          {/* Buyer type */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold">סוג רוכש</Label>
            <div className="grid grid-cols-3 gap-2">
              {buyerTypeOptions.map(option => (
                <button
                  key={option.value}
                  onClick={() => setBuyerType(option.value)}
                  className={cn(
                    'flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all duration-150 active:scale-95',
                    buyerType === option.value
                      ? 'border-primary bg-primary/5'
                      : 'border-border'
                  )}
                >
                  <div className={cn(
                    'w-8 h-8 rounded-lg flex items-center justify-center',
                    buyerType === option.value ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
                  )}>
                    {option.icon}
                  </div>
                  <span className="text-xs font-medium">{option.shortLabel}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Equity slider */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-semibold">הון עצמי</Label>
              <Badge variant="outline" className="font-bold">{equityPercent}%</Badge>
            </div>
            <Slider
              value={[equityPercent]}
              onValueChange={([v]) => setEquityPercent(v)}
              min={20}
              max={80}
              step={5}
              className="py-2"
            />
            <div className="flex gap-2">
              {EQUITY_PRESETS.map(preset => (
                <button
                  key={preset.value}
                  onClick={() => setEquityPercent(preset.value)}
                  className={cn(
                    'flex-1 text-center py-1.5 rounded-lg text-xs transition-colors',
                    equityPercent === preset.value
                      ? 'bg-primary/10 text-primary font-semibold'
                      : 'bg-muted/50 text-muted-foreground'
                  )}
                >
                  <div className="font-medium">{preset.label}</div>
                  <div className="text-[10px] opacity-70">{preset.description}</div>
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results — appear reactively */}
      {result && (
        <motion.div
          className="space-y-4"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
          key={`${purchasePrice}-${buyerType}-${equityPercent}`}
        >
          {/* KPI Cards */}
          <div className="grid grid-cols-2 gap-3">
            <StatsCard
              title="מזומן נדרש"
              value={formatCurrency(result.totalCashNeeded)}
              icon={Wallet}
              iconColor="blue"
              subtitle={`הון ${equityPercent}% + מס + עלויות`}
            />
            <StatsCard
              title="החזר חודשי"
              value={formatCurrency(result.estimatedMonthlyPayment)}
              icon={Banknote}
              iconColor="green"
              subtitle="משכנתא 25 שנה, 4.5%"
            />
            <StatsCard
              title="מס רכישה"
              value={formatCurrency(result.purchaseTax)}
              icon={Receipt}
              iconColor="orange"
              subtitle={`${(result.effectiveTaxRate * 100).toFixed(1)}% אפקטיבי`}
            />
            <StatsCard
              title="עלות כוללת"
              value={formatCurrency(result.totalAcquisitionCost)}
              icon={TrendingUp}
              iconColor="purple"
              subtitle="דירה + מס + עלויות נלוות"
            />
          </div>

          {/* Cost breakdown mini-table */}
          <Card>
            <CardContent className="p-4">
              <h3 className="text-sm font-semibold mb-3">פירוט מזומן נדרש</h3>
              <div className="space-y-2">
                {[
                  { label: `הון עצמי (${equityPercent}%)`, value: result.equityAmount, color: 'bg-primary' },
                  { label: 'מס רכישה', value: result.purchaseTax, color: 'bg-[hsl(var(--chart-2))]' },
                  { label: 'עלויות נלוות', value: result.sideCosts, color: 'bg-[hsl(var(--chart-4))]' },
                ].map(item => (
                  <div key={item.label} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={cn('w-2 h-2 rounded-full', item.color)} />
                      <span className="text-sm text-muted-foreground">{item.label}</span>
                    </div>
                    <span className="text-sm font-medium">{formatCurrency(item.value)}</span>
                  </div>
                ))}
                <div className="border-t pt-2 mt-2 flex items-center justify-between">
                  <span className="text-sm font-semibold">סה"כ מזומן</span>
                  <span className="text-sm font-bold text-primary">{formatCurrency(result.totalCashNeeded)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Smart Insights */}
          <SmartInsight insights={insights} />

          {/* Action buttons */}
          <div className="flex gap-3">
            <Button onClick={handleSaveResult} variant="outline" className="flex-1 h-11">
              שמור תוצאה
            </Button>
            <Link to="/mortgage-calculator" className="flex-1">
              <Button className="w-full h-11 gap-2">
                <span>בנה תמהיל משכנתא</span>
                <ChevronLeft className="w-4 h-4" />
              </Button>
            </Link>
          </div>

          {/* Save as property */}
          <Button
            variant="outline"
            className="w-full h-11 gap-2"
            onClick={() => {
              saveProperty({
                name: `נכס ב-${formatCurrency(purchasePrice)}`,
                askingPrice: purchasePrice,
                notes: '',
                linkedCalculations: [{
                  type: 'quick-check',
                  title: `בדיקה מהירה – ${formatCurrency(purchasePrice)}`,
                  result: `מזומן: ${formatCurrency(result.totalCashNeeded)} | החזר: ${formatCurrency(result.estimatedMonthlyPayment)}/חודש`,
                  timestamp: new Date(),
                }],
              });
              toast({ title: 'הנכס נשמר בהצלחה', description: 'תוכל לראות אותו ב"הנכסים שלי"' });
            }}
          >
            <MapPin className="w-4 h-4" />
            <span>שמור כנכס למעקב</span>
          </Button>
        </motion.div>
      )}
    </div>
  );
}
