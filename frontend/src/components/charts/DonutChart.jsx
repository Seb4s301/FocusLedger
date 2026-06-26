/**
 * DonutChart.jsx
 *
 * SVG donut chart component for visualizing category breakdowns.
 * Renders a ring chart with animated segments and a center label.
 */

const CHART_COLORS = [
  '#006400', '#922B3E', '#2E7D32', '#6E1F2D', '#388E3C',
  '#A94442', '#43A047', '#C0392B', '#66BB6A', '#E74C3C',
];

export default function DonutChart({ data = [], size = 200, strokeWidth = 28, centerLabel = '', centerValue = '' }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const cx = size / 2;
  const cy = size / 2;

  const total = data.reduce((sum, d) => sum + d.value, 0);
  if (total === 0) {
    return (
      <div style={{ width: size, height: size, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <circle cx={cx} cy={cy} r={radius} fill="none" stroke="var(--border-color)" strokeWidth={strokeWidth} />
          <text x={cx} y={cy} textAnchor="middle" dominantBaseline="central" fill="var(--text-disabled)" fontSize="14">
            Sin datos
          </text>
        </svg>
      </div>
    );
  }

  let cumulativeOffset = 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: 'rotate(-90deg)' }}>
        {data.map((item, i) => {
          const pct = item.value / total;
          const dashLength = pct * circumference;
          const gap = circumference - dashLength;
          const offset = -cumulativeOffset;
          cumulativeOffset += dashLength;
          const color = CHART_COLORS[i % CHART_COLORS.length];

          return (
            <circle
              key={item.label}
              cx={cx}
              cy={cy}
              r={radius}
              fill="none"
              stroke={color}
              strokeWidth={strokeWidth}
              strokeDasharray={`${dashLength} ${gap}`}
              strokeDashoffset={offset}
              strokeLinecap="round"
              style={{ transition: 'stroke-dasharray 0.6s ease, stroke-dashoffset 0.6s ease' }}
            />
          );
        })}
        {/* Center text - needs counter-rotation */}
        <g style={{ transform: 'rotate(90deg)', transformOrigin: 'center' }}>
          {centerValue && (
            <text x={cx} y={cy - 8} textAnchor="middle" dominantBaseline="central" fill="var(--text-main)" fontSize="22" fontWeight="700">
              {centerValue}
            </text>
          )}
          {centerLabel && (
            <text x={cx} y={cy + 14} textAnchor="middle" dominantBaseline="central" fill="var(--text-secondary)" fontSize="11">
              {centerLabel}
            </text>
          )}
        </g>
      </svg>

      {/* Legend */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 16px', justifyContent: 'center' }}>
        {data.map((item, i) => (
          <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: CHART_COLORS[i % CHART_COLORS.length], display: 'inline-block' }} />
            <span style={{ color: 'var(--text-secondary)' }}>{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
