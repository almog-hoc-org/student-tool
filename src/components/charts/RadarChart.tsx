import { Radar, RadarChart as RechartsRadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Legend } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';

interface RadarChartProps {
  data: Record<string, unknown>[];
  title: string;
  description?: string;
  dataKey: string;
  nameKey: string;
  color?: string;
}

export function RadarChart({ data, title, description, dataKey, nameKey, color = '--primary' }: RadarChartProps) {
  const chartConfig = {
    [dataKey]: {
      label: title,
      color: `hsl(var(${color}))`,
    },
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <RechartsRadarChart data={data}>
              <PolarGrid className="stroke-muted" />
              <PolarAngleAxis 
                dataKey={nameKey} 
                className="text-xs"
                stroke="hsl(var(--muted-foreground))"
              />
              <PolarRadiusAxis 
                angle={90} 
                domain={[0, 100]}
                className="text-xs"
                stroke="hsl(var(--muted-foreground))"
              />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Radar
                name={title}
                dataKey={dataKey}
                stroke={`hsl(var(${color}))`}
                fill={`hsl(var(${color}))`}
                fillOpacity={0.6}
              />
              <Legend />
            </RechartsRadarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
