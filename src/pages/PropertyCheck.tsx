import { useEffect, useMemo, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, MapPin, ScanLine, Calculator, AlertTriangle } from 'lucide-react';
import {
  calculateQuickCheck,
  QuickCheckInput,
  QuickCheckOutput,
} from '@/lib/calculations/quick-property-check';
import { BuyerType } from '@/lib/calculations/purchase-tax';
import { formatCurrency } from '@/lib/validation/validators';
import { useAuth } from '@/contexts/AuthContext';
import { save, load } from '@/lib/storage';
import { useJourney } from '@/hooks/useJourney';
import { LABELS } from '@/lib/content/labels';
import { GlossaryLink } from '@/components/GlossaryLink';
import { EmptyState } from '@/components/ui/empty-state';
import { JourneyStepper } from '@/components/journey/JourneyStepper';
import NextStepCard from '@/components/NextStepCard';
import { cn } from '@/lib/utils';

const DEFAULTS = {
  purchasePrice: 1_800_000,
  buyerType: 'singleApartment' as BuyerType,
  equityPercent: 25,
  area: '',
  sqm: 60,
};

export default function PropertyCheck() {
  const { user } = useAuth();
  const uid = user?.id;
  const saved = load<typeof DEFAULTS>('property_check');

  const [purchasePrice, setPurchasePrice] = useState(saved?.purchasePrice ?? DEFAULTS.purchasePrice);
  const [buyerType, setBuyerType] = useState<BuyerType>(saved?.buyerType ?? DEFAULTS.buyerType);
  const [equityPercent, setEquityPercent] = useState(saved?.equityPercent ?? DEFAULTS.equityPercent);
  const [area, setArea] = useState(saved?.area ?? DEFAULTS.area);
  const [sqm, setSqm] = useState(saved?.sqm ?? DEFAULTS.sqm);

  useEffect(() => {
    save('property_check', { purchasePrice, buyerType, equityPercent, area, sqm }, uid);
  }, [purchasePrice, buyerType, equityPercent, area, sqm, uid]);

  const result: QuickCheckOutput | null = useMemo(() => {
    if (purchasePrice <= 0) return null;
    const input: QuickCheckInput = { purchasePrice, buyerType, equityPercent };
    return calculateQuickCheck(input);
  }, [purchasePrice, buyerType, equityPercent]);

  const { complete: completeMilestone, isDone } = useJourney();
  const markedRef = useRef(false);
  useEffect(() => {
    if (
      !markedRef.current &&
      uid &&
      result &&
      result.purchasePrice > 0 &&
      !isDone('property_check')
    ) {
      markedRef.current = true;
      completeMilestone('property_check', {
        purchasePrice: result.purchasePrice,
      }).catch(() => {
        markedRef.current = false;
      });
    }
  }, [uid, result, isDone, completeMilestone]);

  const pricePerSqm = sqm > 0 ? Math.round(purchasePrice / sqm) : 0;

  return (
    <div className="space-y-6">
      <JourneyStepper />

      <div className="md:grid md:grid-cols-5 md:gap-8">
        <div className="md:col-span-2 space-y-4 md:sticky md:top-28 md:self-start">
          <div className="flex items-center gap-2">
            <Search className="w-5 h-5 text-primary" />
            <h1 className="text-2xl font-bold">בדיקת נכס</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            בדיקה מהירה לכל נכס שאתה שוקל — מה זה יעלה לך בפועל ומה ההחזר.
          </p>

          <div className="space-y-1.5">
            <Label className="text-sm">מחיר נכס</Label>
            <Input
              type="number"
              min={0}
              value={purchasePrice ?? ''}
              onChange={(e) => setPurchasePrice(Number(e.target.value))}
              placeholder="1,800,000"
              className="text-lg font-semibold h-12"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">אזור</Label>
              <Input
                value={area}
                onChange={(e) => setArea(e.target.value)}
                placeholder="עיר / שכונה"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">שטח (מ״ר)</Label>
              <Input
                type="number"
                min={0}
                value={sqm ?? ''}
                onChange={(e) => setSqm(Number(e.target.value))}
                placeholder="60"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">סוג רוכש</Label>
            <Select value={buyerType} onValueChange={(v: BuyerType) => setBuyerType(v)}>
              <SelectTrigger aria-label="סוג רוכש">
                <SelectValue placeholder={LABELS.common.selectPlaceholder} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="singleApartment">דירה ראשונה (יחידה)</SelectItem>
                <SelectItem value="additionalApartment">דירה נוספת / משקיע</SelectItem>
                <SelectItem value="foreignResident">תושב חוץ</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Card className="border-0 bg-muted/40">
            <CardContent className="p-3 space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm">
                  אחוז <GlossaryLink term="equity">הון עצמי</GlossaryLink>
                </Label>
                <span className="text-base font-bold text-primary">{equityPercent}%</span>
              </div>
              <Slider
                value={[equityPercent]}
                onValueChange={([v]) => setEquityPercent(v)}
                min={20}
                max={100}
                step={1}
              />
              <div className="flex justify-between text-[10px] text-muted-foreground">
                <span>20%</span>
                <span>50%</span>
                <span>100%</span>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-3 mt-6 md:mt-0 space-y-4">
          {result ? (
            <>
              <Card className="border-0 bg-primary/5 dark:bg-primary/10">
                <CardContent className="p-6 space-y-1 text-center">
                  <p className="text-sm text-muted-foreground">סך מזומן נדרש לעסקה</p>
                  <p className="text-4xl md:text-5xl font-extrabold text-primary tracking-tight">
                    {formatCurrency(result.totalCashNeeded)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    הון עצמי + מס רכישה + עלויות נלוות
                  </p>
                </CardContent>
              </Card>

              <div className="grid grid-cols-2 gap-3">
                <Kpi
                  icon={Calculator}
                  title={
                    <>
                      <GlossaryLink term="purchase_tax">מס רכישה</GlossaryLink>
                    </>
                  }
                  value={formatCurrency(result.purchaseTax)}
                  sub={`${result.effectiveTaxRate.toFixed(2)}%`}
                />
                <Kpi
                  icon={ScanLine}
                  title="עלויות נלוות"
                  value={formatCurrency(result.sideCosts)}
                  sub="שמאי, עו״ד, רישום, ביטוח"
                />
                <Kpi
                  icon={Calculator}
                  title="סכום משכנתא"
                  value={formatCurrency(result.mortgageAmount)}
                  sub={`${100 - equityPercent}% מימון`}
                />
                <Kpi
                  icon={Calculator}
                  title="החזר חודשי משוער"
                  value={formatCurrency(result.estimatedMonthlyPayment)}
                  sub="4.5% · 25 שנה"
                />
              </div>

              {pricePerSqm > 0 && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-primary" />
                      מחיר למ״ר
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold">
                      {formatCurrency(pricePerSqm)} / מ״ר
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      השווה למחירי שוק באזור{area ? ` (${area})` : ''} כדי לדעת אם זה סביר.
                    </p>
                  </CardContent>
                </Card>
              )}

              {buyerType !== 'singleApartment' && (
                <Card className="border-amber-500/30 bg-amber-500/5">
                  <CardContent className="p-4 flex items-start gap-3 text-sm">
                    <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
                    <p>
                      שים לב — בדירה נוספת מס הרכישה מתחיל מ-8% מהשקל הראשון. ודא
                      שהעסקה משתלמת גם אחרי המס.
                    </p>
                  </CardContent>
                </Card>
              )}

              <NextStepCard currentMilestone="property_check" />
            </>
          ) : (
            <EmptyState
              icon={<Search className="w-6 h-6" />}
              description="הזן מחיר נכס כדי להתחיל בדיקה."
            />
          )}
        </div>
      </div>
    </div>
  );
}

function Kpi({
  icon: Icon,
  title,
  value,
  sub,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: React.ReactNode;
  value: string;
  sub?: string;
}) {
  return (
    <Card className="border-0 shadow-sm">
      <CardContent className="p-4 space-y-1">
        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <Icon className="w-3.5 h-3.5" />
          {title}
        </div>
        <p className={cn('text-2xl font-bold tracking-tight')}>{value}</p>
        {sub && <p className="text-[11px] text-muted-foreground">{sub}</p>}
      </CardContent>
    </Card>
  );
}
