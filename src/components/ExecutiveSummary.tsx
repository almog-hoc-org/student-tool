import { useMemo } from 'react';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/validation/validators';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Sparkles } from 'lucide-react';

interface ExecutiveSummaryProps {
  type: 'mortgage' | 'deal-rental' | 'deal-flip' | 'financial-checkup';
  data: Record<string, any>;
  className?: string;
}

interface SummaryLine {
  text: string;
  sentiment: 'positive' | 'negative' | 'neutral';
}

function formatPercent(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

function generateMortgageSummary(data: Record<string, any>): SummaryLine[] {
  const lines: SummaryLine[] = [];

  // Monthly payment
  if (data.monthlyPayment != null) {
    lines.push({
      text: `ההחזר החודשי המשוכלל עומד על ${formatCurrency(data.monthlyPayment)}.`,
      sentiment: 'neutral',
    });
  }

  // DTI ratio
  if (data.dtiRatio != null) {
    const dtiPct = typeof data.dtiRatio === 'number' && data.dtiRatio <= 1
      ? data.dtiRatio * 100
      : data.dtiRatio;
    const sentiment: SummaryLine['sentiment'] =
      dtiPct < 30 ? 'positive' : dtiPct < 40 ? 'neutral' : 'negative';
    const label =
      dtiPct < 30 ? 'בטווח הבריא' : dtiPct < 40 ? 'בגבול המותר' : 'מעל לסף המומלץ';
    lines.push({
      text: `יחס החזר/הכנסה (DTI) הוא ${dtiPct.toFixed(1)}% – ${label}.`,
      sentiment,
    });
  }

  // Total interest vs principal
  if (data.totalInterest != null && data.totalPrincipal != null) {
    const interestRatio = data.totalInterest / (data.totalPrincipal || 1);
    const sentiment: SummaryLine['sentiment'] =
      interestRatio < 0.5 ? 'positive' : interestRatio < 1 ? 'neutral' : 'negative';
    lines.push({
      text: `סך הריבית שתשלם: ${formatCurrency(data.totalInterest)} לעומת קרן של ${formatCurrency(data.totalPrincipal)} (יחס ${(interestRatio * 100).toFixed(0)}%).`,
      sentiment,
    });
  }

  // Weighted rate
  if (data.weightedRate != null) {
    const rate = typeof data.weightedRate === 'number' && data.weightedRate < 1
      ? data.weightedRate
      : data.weightedRate / 100;
    const sentiment: SummaryLine['sentiment'] =
      rate < 0.04 ? 'positive' : rate < 0.06 ? 'neutral' : 'negative';
    lines.push({
      text: `הריבית המשוכללת על כלל המסלולים היא ${formatPercent(rate)}.`,
      sentiment,
    });
  }

  if (lines.length === 0) {
    lines.push({ text: 'אין מספיק נתונים להצגת סיכום.', sentiment: 'neutral' });
  }

  return lines;
}

function generateDealRentalSummary(data: Record<string, any>): SummaryLine[] {
  const lines: SummaryLine[] = [];

  // CoC yield
  if (data.cocYield != null) {
    const coc = typeof data.cocYield === 'number' && data.cocYield < 1
      ? data.cocYield
      : data.cocYield / 100;
    const sentiment: SummaryLine['sentiment'] =
      coc >= 0.08 ? 'positive' : coc >= 0.05 ? 'neutral' : 'negative';
    lines.push({
      text: `תשואת Cash-on-Cash עומדת על ${formatPercent(coc)} – ${coc >= 0.08 ? 'מצוינת' : coc >= 0.05 ? 'סבירה' : 'נמוכה'}.`,
      sentiment,
    });
  }

  // IRR
  if (data.irr != null) {
    const irr = typeof data.irr === 'number' && data.irr < 1
      ? data.irr
      : data.irr / 100;
    const sentiment: SummaryLine['sentiment'] =
      irr >= 0.12 ? 'positive' : irr >= 0.07 ? 'neutral' : 'negative';
    lines.push({
      text: `שיעור התשואה הפנימי (IRR) הוא ${formatPercent(irr)}.`,
      sentiment,
    });
  }

  // Net cash flow
  if (data.netCashFlow != null) {
    const sentiment: SummaryLine['sentiment'] =
      data.netCashFlow > 0 ? 'positive' : data.netCashFlow === 0 ? 'neutral' : 'negative';
    lines.push({
      text: `תזרים המזומנים החודשי הנקי הוא ${formatCurrency(data.netCashFlow)}${data.netCashFlow > 0 ? ' – הנכס מייצר הכנסה חיובית.' : data.netCashFlow === 0 ? ' – נקודת איזון.' : ' – הנכס דורש מימון חודשי נוסף.'}`,
      sentiment,
    });
  }

  // Classification
  if (data.classification) {
    lines.push({
      text: `סיווג העסקה: ${data.classification}.`,
      sentiment: 'neutral',
    });
  }

  // Risk level
  if (data.riskLevel) {
    const sentiment: SummaryLine['sentiment'] =
      data.riskLevel === 'נמוך' ? 'positive' : data.riskLevel === 'בינוני' ? 'neutral' : 'negative';
    lines.push({
      text: `רמת הסיכון: ${data.riskLevel}.`,
      sentiment,
    });
  }

  if (lines.length === 0) {
    lines.push({ text: 'אין מספיק נתונים להצגת סיכום.', sentiment: 'neutral' });
  }

  return lines;
}

function generateDealFlipSummary(data: Record<string, any>): SummaryLine[] {
  const lines: SummaryLine[] = [];

  // Gross profit
  if (data.grossProfit != null) {
    const sentiment: SummaryLine['sentiment'] =
      data.grossProfit > 0 ? 'positive' : 'negative';
    lines.push({
      text: `הרווח הגולמי הצפוי: ${formatCurrency(data.grossProfit)}${data.grossProfit > 0 ? '.' : ' – העסקה צפויה להפסד.'}`,
      sentiment,
    });
  }

  // ROI
  if (data.roi != null) {
    const roi = typeof data.roi === 'number' && Math.abs(data.roi) < 10
      ? data.roi
      : data.roi / 100;
    const sentiment: SummaryLine['sentiment'] =
      roi >= 0.15 ? 'positive' : roi >= 0.05 ? 'neutral' : 'negative';
    lines.push({
      text: `תשואה על ההשקעה (ROI): ${formatPercent(roi)}.`,
      sentiment,
    });
  }

  // Annualized ROI
  if (data.annualizedRoi != null) {
    const annRoi = typeof data.annualizedRoi === 'number' && Math.abs(data.annualizedRoi) < 10
      ? data.annualizedRoi
      : data.annualizedRoi / 100;
    const sentiment: SummaryLine['sentiment'] =
      annRoi >= 0.2 ? 'positive' : annRoi >= 0.1 ? 'neutral' : 'negative';
    lines.push({
      text: `תשואה שנתית מותאמת: ${formatPercent(annRoi)}.`,
      sentiment,
    });
  }

  // Classification
  if (data.classification) {
    lines.push({
      text: `סיווג העסקה: ${data.classification}.`,
      sentiment: 'neutral',
    });
  }

  if (lines.length === 0) {
    lines.push({ text: 'אין מספיק נתונים להצגת סיכום.', sentiment: 'neutral' });
  }

  return lines;
}

function generateFinancialCheckupSummary(data: Record<string, any>): SummaryLine[] {
  const lines: SummaryLine[] = [];

  // Readiness score
  if (data.readinessScore != null) {
    const score = data.readinessScore;
    const sentiment: SummaryLine['sentiment'] =
      score >= 70 ? 'positive' : score >= 40 ? 'neutral' : 'negative';
    const label =
      score >= 70 ? 'מוכנות גבוהה' : score >= 40 ? 'מוכנות חלקית' : 'דרושה הכנה נוספת';
    lines.push({
      text: `ציון המוכנות שלך: ${Math.round(score)}/100 – ${label}.`,
      sentiment,
    });
  }

  // Free cash flow
  if (data.freeCashFlow != null) {
    const sentiment: SummaryLine['sentiment'] =
      data.freeCashFlow > 0 ? 'positive' : 'negative';
    lines.push({
      text: `תזרים חופשי חודשי: ${formatCurrency(data.freeCashFlow)}${data.freeCashFlow > 0 ? ' – יש מרווח תמרון.' : ' – אין מרווח פיננסי.'}`,
      sentiment,
    });
  }

  // Available equity
  if (data.availableEquity != null) {
    const sentiment: SummaryLine['sentiment'] =
      data.availableEquity >= 200000 ? 'positive' : data.availableEquity > 0 ? 'neutral' : 'negative';
    lines.push({
      text: `הון עצמי זמין: ${formatCurrency(data.availableEquity)}.`,
      sentiment,
    });
  }

  // Max mortgage
  if (data.maxMortgage != null) {
    lines.push({
      text: `גובה משכנתא מקסימלי משוער: ${formatCurrency(data.maxMortgage)}.`,
      sentiment: 'neutral',
    });
  }

  if (lines.length === 0) {
    lines.push({ text: 'אין מספיק נתונים להצגת סיכום.', sentiment: 'neutral' });
  }

  return lines;
}

function getSentimentColor(sentiment: SummaryLine['sentiment']): string {
  switch (sentiment) {
    case 'positive':
      return 'text-[hsl(var(--chart-1))]';
    case 'negative':
      return 'text-[hsl(var(--chart-3))]';
    case 'neutral':
    default:
      return 'text-foreground';
  }
}

function getSentimentDot(sentiment: SummaryLine['sentiment']): string {
  switch (sentiment) {
    case 'positive':
      return 'bg-[hsl(var(--chart-1))]';
    case 'negative':
      return 'bg-[hsl(var(--chart-3))]';
    case 'neutral':
    default:
      return 'bg-[hsl(var(--chart-2))]';
  }
}

export function ExecutiveSummary({
  type,
  data,
  className,
}: ExecutiveSummaryProps) {
  const summaryLines = useMemo((): SummaryLine[] => {
    switch (type) {
      case 'mortgage':
        return generateMortgageSummary(data);
      case 'deal-rental':
        return generateDealRentalSummary(data);
      case 'deal-flip':
        return generateDealFlipSummary(data);
      case 'financial-checkup':
        return generateFinancialCheckupSummary(data);
      default:
        return [{ text: 'סוג סיכום לא מוכר.', sentiment: 'neutral' }];
    }
  }, [type, data]);

  return (
    <Card
      className={cn(
        'overflow-hidden border shadow-sm relative',
        className
      )}
      dir="rtl"
    >
      {/* Gradient background overlay */}
      <div
        className="absolute inset-0 opacity-[0.07] pointer-events-none"
        style={{
          background:
            'linear-gradient(135deg, hsl(var(--secondary)) 0%, hsl(var(--primary)) 100%)',
        }}
      />

      <CardHeader className="relative">
        <CardTitle className="flex items-center gap-2 text-xl">
          <div
            className="flex h-8 w-8 items-center justify-center rounded-lg"
            style={{ background: 'hsl(var(--primary) / 0.15)' }}
          >
            <Sparkles
              className="h-4 w-4"
              style={{ color: 'hsl(var(--primary))' }}
            />
          </div>
          <span>סיכום מנהלים</span>
        </CardTitle>
      </CardHeader>

      <CardContent className="relative space-y-3">
        {summaryLines.map((line, index) => (
          <div key={index} className="flex items-start gap-3">
            <div
              className={cn(
                'mt-2 h-2 w-2 rounded-full shrink-0',
                getSentimentDot(line.sentiment)
              )}
            />
            <p
              className={cn(
                'text-sm leading-relaxed',
                getSentimentColor(line.sentiment)
              )}
            >
              {line.text}
            </p>
          </div>
        ))}

        {/* Disclaimer note */}
        <div className="border-t pt-3 mt-4">
          <p className="text-xs text-muted-foreground leading-relaxed">
            הסיכום נוצר אוטומטית על בסיס הנתונים שהזנת ואינו מהווה ייעוץ פיננסי.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
