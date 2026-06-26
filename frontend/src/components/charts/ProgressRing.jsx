/**
 * ProgressRing.jsx
 *
 * Animated SVG progress ring with percentage in center.
 * Used for savings rate, goal progress, etc.
 */

export default function ProgressRing({ value = 0, max = 100, size = 140, strokeWidth = 12, color = '#006400', label = '' }) {
  const pct = max > 0 ? Math.min(Math.max(value / max, 0), 1) : 0;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashLength = pct * circumference;
  const cx = size / 2;
  const cy = size / 2;

  const displayPct = Math.round(pct * 100);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* Background ring */}
        <circle
          cx={cx} cy={cy} r={radius}
          fill="none"
          stroke="var(--border-color)"
          strokeWidth={strokeWidth}
        />
        {/* Foreground ring */}
        <circle
          cx={cx} cy={cy} r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={`${dashLength} ${circumference - dashLength}`}
          strokeDashoffset={circumference * 0.25}
          strokeLinecap="round"
          style={{
            transform: 'rotate(-90deg)',
            transformOrigin: 'center',
            transition: 'stroke-dasharray 0.8s ease',
          }}
        />
        {/* Center value */}
        <text x={cx} y={cy - 4} textAnchor="middle" dominantBaseline="central" fill="var(--text-main)" fontSize="26" fontWeight="800">
          {displayPct}%
        </text>
        {label && (
          <text x={cx} y={cy + 18} textAnchor="middle" dominantBaseline="central" fill="var(--text-secondary)" fontSize="10">
            {label}
          </text>
        )}
      </svg>
    </div>
  );
}
