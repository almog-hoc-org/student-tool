import { useMemo } from 'react';
import { cn } from '@/lib/utils';

interface FuelGaugeProps {
  value: number;
  maxValue?: number;
  label: string;
  sublabel?: string;
  thresholds?: { green: number; yellow: number };
  className?: string;
}

export function FuelGauge({
  value,
  maxValue = 100,
  label,
  sublabel,
  thresholds = { green: 30, yellow: 40 },
  className,
}: FuelGaugeProps) {
  const clampedValue = Math.max(0, Math.min(value, maxValue));
  const percentage = (clampedValue / maxValue) * 100;

  // Semicircle geometry: arc spans from 180 degrees (left) to 0 degrees (right)
  // Center at (150, 130), radius 100
  const cx = 150;
  const cy = 130;
  const radius = 100;
  const strokeWidth = 24;

  // Convert a percentage (0-100) to an angle in radians
  // 0% = PI (left), 100% = 0 (right)
  const percentToAngle = (pct: number): number => {
    return Math.PI * (1 - pct / 100);
  };

  // Convert angle to SVG coordinates
  const angleToPoint = (angle: number, r: number) => ({
    x: cx + r * Math.cos(angle),
    y: cy - r * Math.sin(angle),
  });

  // Build an arc path from startPct to endPct
  const buildArc = (startPct: number, endPct: number): string => {
    const startAngle = percentToAngle(startPct);
    const endAngle = percentToAngle(endPct);
    const start = angleToPoint(startAngle, radius);
    const end = angleToPoint(endAngle, radius);
    const largeArcFlag = endPct - startPct > 50 ? 1 : 0;
    return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${end.x} ${end.y}`;
  };

  // Zone boundaries as percentages of maxValue
  const greenEnd = Math.min(thresholds.green, 100);
  const yellowEnd = Math.min(thresholds.yellow, 100);

  // Arc paths for the three colored zones
  const greenArc = buildArc(0, greenEnd);
  const yellowArc = buildArc(greenEnd, yellowEnd);
  const redArc = buildArc(yellowEnd, 100);

  // Needle angle: percentage mapped to rotation
  // At 0% the needle points left (180 deg), at 100% it points right (0 deg)
  const needleAngle = useMemo(() => {
    // CSS rotation: 0deg = up. We need to map:
    // 0% -> pointing left = -90 deg (from vertical)
    // 100% -> pointing right = +90 deg (from vertical)
    return -90 + (percentage / 100) * 180;
  }, [percentage]);

  // Determine color for the center display based on thresholds
  const getDisplayColor = (): string => {
    if (percentage < thresholds.green) return 'hsl(var(--chart-1))';
    if (percentage < thresholds.yellow) return 'hsl(var(--chart-2))';
    return 'hsl(var(--chart-3))';
  };

  return (
    <div
      className={cn(
        'rounded-lg border bg-card text-card-foreground shadow-sm p-6',
        className
      )}
      dir="rtl"
    >
      <svg
        viewBox="0 0 300 170"
        className="w-full h-auto"
        role="img"
        aria-label={`${label}: ${clampedValue}%`}
      >
        {/* Background track */}
        <path
          d={buildArc(0, 100)}
          fill="none"
          stroke="hsl(var(--muted))"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />

        {/* Green zone */}
        <path
          d={greenArc}
          fill="none"
          stroke="hsl(var(--chart-1))"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          opacity={0.85}
        />

        {/* Yellow zone */}
        <path
          d={yellowArc}
          fill="none"
          stroke="hsl(var(--chart-2))"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          opacity={0.85}
        />

        {/* Red zone */}
        <path
          d={redArc}
          fill="none"
          stroke="hsl(var(--chart-3))"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          opacity={0.85}
        />

        {/* Tick marks */}
        {[0, 25, 50, 75, 100].map((tick) => {
          const angle = percentToAngle(tick);
          const outerPoint = angleToPoint(angle, radius + strokeWidth / 2 + 4);
          const innerPoint = angleToPoint(angle, radius + strokeWidth / 2 + 12);
          return (
            <line
              key={tick}
              x1={outerPoint.x}
              y1={outerPoint.y}
              x2={innerPoint.x}
              y2={innerPoint.y}
              stroke="hsl(var(--muted-foreground))"
              strokeWidth={1.5}
              opacity={0.5}
            />
          );
        })}

        {/* Needle */}
        <g
          style={{
            transform: `rotate(${needleAngle}deg)`,
            transformOrigin: `${cx}px ${cy}px`,
            transition: 'transform 1s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        >
          {/* Needle body */}
          <line
            x1={cx}
            y1={cy}
            x2={cx}
            y2={cy - radius + 10}
            stroke="hsl(var(--foreground))"
            strokeWidth={2.5}
            strokeLinecap="round"
          />
          {/* Needle tip */}
          <polygon
            points={`${cx},${cy - radius + 10} ${cx - 4},${cy - radius + 22} ${cx + 4},${cy - radius + 22}`}
            fill="hsl(var(--foreground))"
          />
        </g>

        {/* Center hub */}
        <circle
          cx={cx}
          cy={cy}
          r={8}
          fill="hsl(var(--foreground))"
        />
        <circle
          cx={cx}
          cy={cy}
          r={4}
          fill="hsl(var(--background))"
        />

        {/* Percentage display */}
        <text
          x={cx}
          y={cy - 20}
          textAnchor="middle"
          dominantBaseline="central"
          fontSize="28"
          fontWeight="700"
          fill={getDisplayColor()}
        >
          {Math.round(percentage)}%
        </text>

        {/* Min / Max labels */}
        <text
          x={cx - radius - 10}
          y={cy + 20}
          textAnchor="middle"
          fontSize="11"
          fill="hsl(var(--muted-foreground))"
        >
          0
        </text>
        <text
          x={cx + radius + 10}
          y={cy + 20}
          textAnchor="middle"
          fontSize="11"
          fill="hsl(var(--muted-foreground))"
        >
          {maxValue}
        </text>
      </svg>

      {/* Label area */}
      <div className="text-center mt-2">
        <p className="text-base font-semibold text-foreground">{label}</p>
        {sublabel && (
          <p className="text-sm text-muted-foreground mt-0.5">{sublabel}</p>
        )}
      </div>
    </div>
  );
}
