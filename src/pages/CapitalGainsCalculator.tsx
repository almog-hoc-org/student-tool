import { useMemo, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Receipt } from 'lucide-react';
import { PropertyAreaNav } from '@/components/PropertyAreaNav';
import {
  calculateCapitalGainsTax,
  SHEVACH_TAX_RATE,
  SINGLE_APARTMENT_EXEMPTION_CEILING,
} from '@/lib/calculations/capital-gains';
import { formatCurrency, numInput } from '@/lib/validation/validators';
import { InfoTooltip } from '@/components/InfoTooltip';
import { cn } from '@/lib/utils';

/**
 * מחשבון מס שבח למוכרים — אומדן חינוכי על בסיס אותו מנוע שמחשב את
 * האקזיט בתוכנית העסקית. עד עכשיו לא היה בכלל כלי למוכר.
 */
export default function CapitalGainsCalculator() {
  const [purchasePrice, setPurchasePrice] = useState(0);
  const [acquisitionCosts, setAcquisitionCosts] = useState(0);
  const [improvementCosts, setImprovementCosts] = useState(0);
  const [salePrice, setSalePrice] = useState(0);
  const [sellingCosts, setSellingCosts] = useState(0);
  const [holdingYears, setHoldingYears] = useState(10);
  const [isSingle, setIsSingle] = useState(true);

  const result = useMemo(() => {
    if (purchasePrice <= 0 || salePrice <= 0) return null;
    return calculateCapitalGainsTax({
      purchasePrice,
      acquisitionCosts,
      improvementCosts,
      salePrice,
      sellingCosts,
      holdingYears,
      isExemptSingleApartment: isSingle,
    });
  }, [purchasePrice, acquisitionCosts, improvementCosts, salePrice, sellingCosts, holdingYears, isSingle]);

  return (
    <div className="space-y-6">
      <PropertyAreaNav />

      <div className="md:grid md:grid-cols-5 md:gap-8">
        <div className="md:col-span-2 space-y-4">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Receipt className="w-6 h-6 text-primary" />
            מחשבון מס שבח
          </h1>
          <p className="text-sm text-muted-foreground">
            אומדן מס השבח במכירת דירה: {Math.round(SHEVACH_TAX_RATE * 100)}% על השבח הריאלי
            (לרכישות מ-2014), עם פטור דירה יחידה עד תקרה של {formatCurrency(SINGLE_APARTMENT_EXEMPTION_CEILING)}.
          </p>

          <div className="space-y-1.5">
            <Label htmlFor="cg-purchase" className="text-sm">שווי הרכישה המקורי</Label>
            <Input id="cg-purchase" type="number" min="0" value={purchasePrice || ''} onChange={(e) => setPurchasePrice(numInput(e.target.value))} placeholder="1,500,000" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cg-acq" className="text-sm flex items-center gap-1">
              עלויות רכישה מוכרות
              <InfoTooltip text="מס רכישה, שכ״ט עו״ד, תיווך ששולמו בקנייה — כולם ניכויים מוכרים שמקטינים את השבח" />
            </Label>
            <Input id="cg-acq" type="number" min="0" value={acquisitionCosts || ''} onChange={(e) => setAcquisitionCosts(numInput(e.target.value))} placeholder="80,000" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cg-impr" className="text-sm flex items-center gap-1">
              השבחות (שיפוץ מהותי)
              <InfoTooltip text="שיפוץ שמשביח את הנכס (לא תחזוקה שוטפת) — ניכוי מוכר. שמור חשבוניות!" />
            </Label>
            <Input id="cg-impr" type="number" min="0" value={improvementCosts || ''} onChange={(e) => setImprovementCosts(numInput(e.target.value))} placeholder="0" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cg-sale" className="text-sm">מחיר המכירה</Label>
            <Input id="cg-sale" type="number" min="0" value={salePrice || ''} onChange={(e) => setSalePrice(numInput(e.target.value))} placeholder="2,200,000" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cg-sellcosts" className="text-sm">הוצאות מכירה (תיווך, עו״ד)</Label>
            <Input id="cg-sellcosts" type="number" min="0" value={sellingCosts || ''} onChange={(e) => setSellingCosts(numInput(e.target.value))} placeholder="60,000" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cg-years" className="text-sm">שנות החזקה</Label>
            <Input id="cg-years" type="number" min="0" max="60" value={holdingYears || ''} onChange={(e) => setHoldingYears(numInput(e.target.value))} />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <Checkbox checked={isSingle} onCheckedChange={(c) => setIsSingle(!!c)} />
            זו דירתי היחידה (פטור דירת מגורים מזכה)
          </label>
        </div>

        <div className="md:col-span-3 mt-6 md:mt-0 space-y-4">
          {result ? (
            <>
              <Card className="border-0 bg-primary/5 dark:bg-primary/10">
                <CardContent className="p-6 text-center space-y-1">
                  <p className="text-sm text-muted-foreground">מס שבח משוער</p>
                  <p className={cn('text-4xl md:text-5xl font-extrabold tracking-tight', result.tax > 0 ? 'text-primary' : 'text-emerald-600')}>
                    {formatCurrency(result.tax)}
                  </p>
                  {result.tax === 0 && result.exemptionApplied && (
                    <p className="text-xs text-emerald-700 dark:text-emerald-400">פטור מלא — דירה יחידה מתחת לתקרה</p>
                  )}
                  {result.exemptionCapExceeded && (
                    <p className="text-xs text-amber-700 dark:text-amber-400">
                      המכירה מעל תקרת הפטור — החלק היחסי שמעל התקרה חייב במס
                    </p>
                  )}
                </CardContent>
              </Card>

              <div className="grid grid-cols-2 gap-3">
                <Kpi label="שבח נומינלי" value={formatCurrency(result.nominalGain)} />
                <Kpi label="שבח ריאלי (אחרי הצמדה)" value={formatCurrency(result.realGain)} />
                <Kpi label="שבח חייב במס" value={formatCurrency(result.taxableRealGain)} />
                <Kpi label="נטו מהמכירה (אחרי מס)" value={formatCurrency(salePrice - sellingCosts - result.tax)} />
              </div>

              <p className="text-[11px] text-muted-foreground leading-relaxed">
                אומדן חינוכי בלבד: ההצמדה מחושבת לפי אינפלציה ממוצעת, והשומה בפועל משתמשת
                במדדים המדויקים של חודשי הרכישה והמכירה. לרכישות לפני 2014 חל חישוב לינארי
                שונה. לפני מכירה — התייעצו עם עו״ד מקרקעין או יועץ מס.
              </p>
            </>
          ) : (
            <Card className="border-dashed">
              <CardContent className="p-8 text-center text-sm text-muted-foreground">
                הזן שווי רכישה ומחיר מכירה כדי לראות את אומדן המס
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <Card className="border-0 shadow-sm">
      <CardContent className="p-4">
        <p className="text-[11px] text-muted-foreground mb-1">{label}</p>
        <p className="text-xl font-bold tabular-nums">{value}</p>
      </CardContent>
    </Card>
  );
}
