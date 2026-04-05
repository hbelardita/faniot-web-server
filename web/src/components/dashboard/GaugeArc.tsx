interface GaugeArcProps {
  value: number;
  max: number;
  color: string;
  size?: number;
  strokeWidth?: number;
}

export default function GaugeArc({
  value,
  max,
  color,
  size = 80,
  strokeWidth = 6,
}: GaugeArcProps) {
  const radius = (size - strokeWidth) / 2;
  const center = size / 2;

  // 240-degree arc (from 150° to 390°)
  const arcAngle = 240;
  const circumference = (arcAngle / 360) * 2 * Math.PI * radius;
  const percentage = Math.min(Math.max(value / max, 0), 1);
  const offset = circumference * (1 - percentage);

  // Start angle at 150 degrees (bottom-left)
  const startAngle = 150;

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className="transform -rotate-0"
      aria-hidden="true"
    >
      {/* Glow filter */}
      <defs>
        <filter id={`glow-${color.replace('#', '')}`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Background track */}
      <circle
        cx={center}
        cy={center}
        r={radius}
        fill="none"
        stroke="var(--surface-overlay)"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={`${circumference} ${2 * Math.PI * radius - circumference}`}
        transform={`rotate(${startAngle} ${center} ${center})`}
      />

      {/* Value arc */}
      <circle
        cx={center}
        cy={center}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={`${circumference} ${2 * Math.PI * radius - circumference}`}
        strokeDashoffset={offset}
        transform={`rotate(${startAngle} ${center} ${center})`}
        filter={`url(#glow-${color.replace('#', '')})`}
        style={{
          transition: 'stroke-dashoffset 1s cubic-bezier(0.34, 1.56, 0.64, 1)',
        }}
      />
    </svg>
  );
}
