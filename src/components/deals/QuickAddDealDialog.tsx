import { useMemo, useState } from 'react';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { buildQuickDealSnapshot, suggestedEquity, type QuickDealInput } from '@/lib/quick-deal';
import { assessDeal } from '@/lib/deal-ranking';
import { dealMetricsFromSnapshot } from '@/lib/deals';
import { saveSnapshot, type Snapshot } from '@/lib/snapshots';
import { formatCurrency, numInput } from '@/lib/validation/validators';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import type { BuyerType } from '@/lib/calculations/purchase-tax';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: (snapshot: Snapshot) => void;
}

export function QuickAddDealDialog({ open, onOpenChange, onSaved }: Props) {
  const { user } = useAuth();
  const [name, setName] = useState('');
  const [purchasePrice, setPurchasePrice] = useState(0);
  const [expectedMonthlyRent, setExpectedMonthlyRent] = useState(0);
  const [equityInvested, setEquityInvested] = useState(0);
  const [equityTouched, setEquityTouched] = useState(false);
  const [buyerType, setBuyerType] = useState<BuyerType>('additionalApartment');
  const [propertyArea, setPropertyArea] = useState('');
  const [propertySqm, setPropertySqm] = useState(0);
  const [listingUrl, setListingUrl] = useState('');
  const [saving, setSaving] = useState(false);

  // הצעת הון עצמי: המינימום החוקי — עד שהמשתמש נוגע בשדה
  const effectiveEquity = equityTouched ? equityInvested : suggestedEquity(purchasePrice, buyerType);

  const built = useMemo(() => {
    const input: QuickDealInput = {
      name: name || 'עסקה חדשה',
      purchasePrice,
      expectedMonthlyRent,
      equityInvested: effectiveEquity,
      buyerType,
      propertyArea: propertyArea || undefined,
      propertySqm: propertySqm || undefined,
      listingUrl: listingUrl || undefined,
    };
    return buildQuickDealSnapshot(input);
  }, [name, purchasePrice, expectedMonthlyRent, effectiveEquity, buyerType, propertyArea, propertySqm, listingUrl]);

  // preview חי: ציון + תזרים לפני שמירה
  const preview = useMemo(() => {
    if (!built) return null;
    const fakeSnapshot: Snapshot = {
      id: 'preview', tool_key: 'business_plan', name: name || 'עסקה חדשה',
      data: built.data, notes: null, created_at: new Date().toISOString(),
    };
    const metrics = dealMetricsFromSnapshot(fakeSnapshot);
    return metrics ? { assessment: assessDeal(metrics), cashflow: built.data.results.monthlyCashflow } : null;
  }, [built, name]);

  const reset = () => {
    setName(''); setPurchasePrice(0); setExpectedMonthlyRent(0);
    setEquityInvested(0); setEquityTouched(false);
    setBuyerType('additionalApartment'); setPropertyArea(''); setPropertySqm(0); setListingUrl('');
  };

  const handleSave = async () => {
    if (!built || !name.trim()) {
      toast.error('מלא שם, מחיר, שכ״ד והון עצמי');
      return;
    }
    setSaving(true);
    try {
      const snapshot = await saveSnapshot({
        userId: user?.id ?? '',
        toolKey: 'business_plan',
        name: name.trim(),
        data: built.data,
      });
      toast.success(`"${name.trim()}" נוספה להשוואה`);
      reset();
      onOpenChange(false);
      onSaved(snapshot);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'שגיאה בשמירת העסקה');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent dir="rtl" className="w-[calc(100vw-24px)] rounded-2xl sm:max-w-lg max-h-[90dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>הוספת עסקה מהירה</DialogTitle>
          <DialogDescription>
            4 שדות — ואנחנו בונים תוכנית עסקית מלאה עם ערכי ברירת מחדל. אפשר לדייק אותה אחר כך בכפתור "ערוך".
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Label className="text-xs">שם העסקה *</Label>
            <Input className="h-10" value={name} onChange={(e) => setName(e.target.value)} placeholder='לדוגמה: "3 חדרים ברח׳ הרצל"' autoFocus />
          </div>
          <div>
            <Label className="text-xs">מחיר רכישה *</Label>
            <Input className="h-10" type="number" min="0" value={purchasePrice || ''} onChange={(e) => setPurchasePrice(numInput(e.target.value))} placeholder="1,500,000" />
          </div>
          <div>
            <Label className="text-xs">שכ״ד חודשי צפוי *</Label>
            <Input className="h-10" type="number" min="0" value={expectedMonthlyRent || ''} onChange={(e) => setExpectedMonthlyRent(numInput(e.target.value))} placeholder="4,500" />
          </div>
          <div>
            <Label className="text-xs">הון עצמי *</Label>
            <Input
              className="h-10" type="number" min="0"
              value={effectiveEquity || ''}
              onChange={(e) => { setEquityTouched(true); setEquityInvested(numInput(e.target.value)); }}
            />
            {!equityTouched && purchasePrice > 0 && (
              <p className="text-[10px] text-muted-foreground mt-0.5">הוצע אוטומטית: המינימום החוקי לסוג רוכש זה</p>
            )}
          </div>
          <div>
            <Label className="text-xs">סוג רוכש</Label>
            <Select value={buyerType} onValueChange={(v: BuyerType) => setBuyerType(v)}>
              <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="additionalApartment">דירה נוספת / משקיע</SelectItem>
                <SelectItem value="singleApartment">דירה יחידה</SelectItem>
                <SelectItem value="foreignResident">תושב חוץ</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">אזור</Label>
            <Input className="h-10" value={propertyArea} onChange={(e) => setPropertyArea(e.target.value)} placeholder="עיר / שכונה" />
          </div>
          <div>
            <Label className="text-xs">שטח (מ״ר)</Label>
            <Input className="h-10" type="number" min="0" value={propertySqm || ''} onChange={(e) => setPropertySqm(numInput(e.target.value))} />
          </div>
          <div className="sm:col-span-2">
            <Label className="text-xs">קישור למודעה</Label>
            <Input className="h-10" dir="ltr" value={listingUrl} onChange={(e) => setListingUrl(e.target.value)} placeholder="https://…" />
          </div>
        </div>

        {preview && (
          <div className="rounded-xl border bg-muted/40 p-3 space-y-1.5">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">ציון ראשוני</span>
              <span className="font-bold">{preview.assessment.score}/100 · {preview.assessment.grade}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">תזרים חודשי צפוי</span>
              <span className={cn('font-bold', preview.cashflow >= 0 ? 'text-green-600' : 'text-red-600')}>
                {formatCurrency(preview.cashflow)}
              </span>
            </div>
            {built?.warnings.map((w) => (
              <p key={w.key} className="text-[11px] text-red-600 dark:text-red-400">⚠️ {w.message}</p>
            ))}
          </div>
        )}

        <DialogFooter className="gap-2 sm:gap-2">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>ביטול</Button>
          <Button onClick={handleSave} disabled={saving || !built || !name.trim()}>
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'הוסף להשוואה'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
