interface SparklineProps {
  data: number[];
  color: string;
  glowColor: string;
  width?: number;
  height?: number;
}

export default function Sparkline({
  data,
  color,
  glowColor,
  width = 120,
  height = 32,
}: SparklineProps) {
  if (data.length < 2) return null;

  const padding = 2;
  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  const points = data.map((value, i) => {
    const x = padding + (i / (data.length - 1)) * chartWidth;
    const y = padding + chartHeight - ((value - min) / range) * chartHeight;
    return `${x},${y}`;
  });

  const polyline = points.join(' ');

  // Area fill path (closed polygon)
  const firstPoint = points[0];
  const lastPoint = points[points.length - 1];
  const areaPath = `M ${firstPoint} L ${polyline} L ${lastPoint.split(',')[0]},${height} L ${firstPoint.split(',')[0]},${height} Z`;

  const gradientId = `spark-grad-${color.replace(/[^a-z0-9]/gi, '')}`;

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className="overflow-visible"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.3} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>

      {/* Area fill */}
      <path d={areaPath} fill={`url(#${gradientId})`} />

      {/* Line */}
      <polyline
        points={polyline}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Current value dot */}
      <circle
        cx={parseFloat(points[points.length - 1].split(',')[0])}
        cy={parseFloat(points[points.length - 1].split(',')[1])}
        r={2.5}
        fill={color}
        style={{ filter: `drop-shadow(0 0 4px ${glowColor})` }}
      />
    </svg>
  );
}
