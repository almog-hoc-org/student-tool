import { Card, CardContent } from '@/components/ui/card';
import {
  LineChart, Line, BarChart, Bar, Cell, RadarChart, Radar,
  PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { formatCurrency } from '@/lib/validation/validators';
import { CHART } from '@/lib/chart-colors';
import type { DealAssessment, DealMetricsInput } from '@/lib/deal-ranking';
import type { DealScenario } from '@/lib/deals';

export interface ChartDeal {
  metrics: DealMetricsInput;
  assessment: DealAssessment | undefined;
  /** התרחיש הפעיל — לגרף צמיחת ההון */
  scenario: DealScenario | undefined;
  color: string;
}

const compactNis = (v: number) =>
  Math.abs(v) >= 1_000_000 ? `₪${(v / 1_000_000).toFixed(1)}M` : `₪${Math.round(v / 1000)}K`;

function ChartCard({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <Card className="border-0 shadow-sm">
      <CardContent className="p-4">
        <p className="text-sm font-semibold">{title}</p>
        {subtitle && <p className="text-[11px] text-muted-foreground mb-2">{subtitle}</p>}
        {children}
      </CardContent>
    </Card>
  );
}

export function DealCharts({ deals }: { deals: ChartDeal[] }) {
  if (deals.length === 0) return null;

  // --- צמיחת הון עצמי: מיזוג ה-projections לפי שנה ---
  const withProjection = deals.filter((d) => (d.scenario?.yearlyProjection?.length ?? 0) > 0);
  const missingProjection = deals.filter((d) => !withProjection.includes(d));
  const maxYear = Math.max(0, ...withProjection.map((d) => d.scenario!.yearlyProjection!.length - 1));
  const equityData = Array.from({ length: maxYear + 1 }, (_, year) => {
    const point: Record<string, number> = { year };
    for (const deal of withProjection) {
      const row = deal.scenario!.yearlyProjection![year];
      if (row) point[deal.metrics.name] = row.equity;
    }
    return point;
  });

  // --- ברים: תזרים חודשי ורווח כולל ---
  const barData = deals.map((d) => ({
    name: d.metrics.name,
    cashflow: d.metrics.monthlyCashflow,
    profit: d.metrics.totalProfit,
    color: d.color,
  }));

  // --- רדאר: פירוק הציון של מנוע הדירוג ---
  const AXES: Array<{ key: keyof DealAssessment['components']; label: string }> = [
    { key: 'cashflow', label: 'תזרים' },
    { key: 'irr', label: 'IRR' },
    { key: 'profit', label: 'רווח על ההון' },
    { key: 'risk', label: 'ביטחון' },
  ];
  const radarDeals = deals.filter((d) => d.assessment);
  const radarData = AXES.map(({ key, label }) => {
    const point: Record<string, number | string> = { axis: label };
    for (const deal of radarDeals) point[deal.metrics.name] = deal.assessment!.components[key];
    return point;
  });

  return (
    <div id="deal-comparison-charts" className="space-y-3">
      {withProjection.length > 0 && (
        <ChartCard title="צמיחת ההון העצמי לאורך השנים" subtitle="שווי הנכס פחות יתרת המשכנתא, בתרחיש הנבחר — לאן כל עסקה לוקחת אותך">
          {missingProjection.length > 0 && (
            <p className="text-[11px] text-amber-700 dark:text-amber-400 mb-2">
              {missingProjection.map((d) => `"${d.metrics.name}"`).join(', ')} ללא נתוני תחזית — לחץ "חשב מחדש" כדי להשלים.
            </p>
          )}
          <div className="h-64" dir="ltr">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={equityData} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.3} />
                <XAxis dataKey="year" reversed tick={{ fontSize: 11 }} label={{ value: 'שנים', position: 'insideBottomLeft', fontSize: 11, offset: -2 }} />
                <YAxis orientation="right" tick={{ fontSize: 11 }} tickFormatter={compactNis} width={58} />
                <Tooltip formatter={(v: number) => formatCurrency(v)} labelFormatter={(y) => `שנה ${y}`} contentStyle={{ direction: 'rtl', fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 12, direction: 'rtl' }} />
                {withProjection.map((deal) => (
                  <Line
                    key={deal.metrics.snapshotId}
                    type="monotone"
                    dataKey={deal.metrics.name}
                    stroke={deal.color}
                    strokeWidth={2.5}
                    dot={false}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      )}

      <div className="grid gap-3 md:grid-cols-2">
        <ChartCard title="תזרים חודשי" subtitle="כמה נשאר (או חסר) כל חודש אחרי משכנתא והוצאות">
          <div className="h-52" dir="ltr">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.3} vertical={false} />
                <XAxis dataKey="name" reversed tick={{ fontSize: 10 }} interval={0} />
                <YAxis orientation="right" tick={{ fontSize: 11 }} tickFormatter={(v: number) => `₪${v.toLocaleString('he-IL')}`} width={58} />
                <Tooltip formatter={(v: number) => formatCurrency(v)} contentStyle={{ direction: 'rtl', fontSize: 12 }} />
                <Bar dataKey="cashflow" name="תזרים חודשי" radius={[6, 6, 0, 0]}>
                  {barData.map((entry) => (
                    <Cell key={entry.name} fill={entry.cashflow < 0 ? CHART.red : entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard title="רווח כולל בסוף התקופה" subtitle="בתרחיש הנבחר, כולל מכירה">
          <div className="h-52" dir="ltr">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.3} vertical={false} />
                <XAxis dataKey="name" reversed tick={{ fontSize: 10 }} interval={0} />
                <YAxis orientation="right" tick={{ fontSize: 11 }} tickFormatter={compactNis} width={58} />
                <Tooltip formatter={(v: number) => formatCurrency(v)} contentStyle={{ direction: 'rtl', fontSize: 12 }} />
                <Bar dataKey="profit" name="רווח כולל" radius={[6, 6, 0, 0]}>
                  {barData.map((entry) => (
                    <Cell key={entry.name} fill={entry.profit < 0 ? CHART.red : entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>

      {radarDeals.length >= 2 && (
        <ChartCard title="פרופיל סיכון-תשואה" subtitle="פירוק ציון הדירוג לארבעת הרכיבים — צורה רחבה יותר = עסקה חזקה יותר">
          <div className="h-72" dir="ltr">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData} outerRadius="70%">
                <PolarGrid strokeOpacity={0.35} />
                <PolarAngleAxis dataKey="axis" tick={{ fontSize: 12 }} />
                <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
                {radarDeals.map((deal) => (
                  <Radar
                    key={deal.metrics.snapshotId}
                    name={deal.metrics.name}
                    dataKey={deal.metrics.name}
                    stroke={deal.color}
                    fill={deal.color}
                    fillOpacity={0.12}
                    strokeWidth={2}
                  />
                ))}
                <Legend wrapperStyle={{ fontSize: 12, direction: 'rtl' }} />
                <Tooltip contentStyle={{ direction: 'rtl', fontSize: 12 }} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      )}
    </div>
  );
}
