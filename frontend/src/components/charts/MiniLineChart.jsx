/**
 * MiniLineChart.jsx
 *
 * Small sparkline-style SVG line chart.
 * Used for financial trends over time.
 */

export default function MiniLineChart({
  data = [],
  width = 400,
  height = 120,
  lineColor = '#006400',
  fillColor = 'rgba(0, 100, 0, 0.15)',
  showDots = true,
  showLabels = true,
}) {
  const paddingLeft = showLabels ? 40 : 8;
  const paddingRight = 8;
  const paddingTop = 16;
  const paddingBottom = showLabels ? 28 : 8;
  const chartW = width - paddingLeft - paddingRight;
  const chartH = height - paddingTop - paddingBottom;

  if (data.length < 2) {
    return (
      <div style={{ width, height, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ color: 'var(--text-disabled)', fontSize: 14 }}>Datos insuficientes</span>
      </div>
    );
  }

  const values = data.map(d => d.value);
  const maxVal = Math.max(...values, 1);
  const minVal = Math.min(...values, 0);
  const range = maxVal - minVal || 1;

  const points = data.map((d, i) => {
    const x = paddingLeft + (i / (data.length - 1)) * chartW;
    const y = paddingTop + chartH - ((d.value - minVal) / range) * chartH;
    return { x, y, ...d };
  });

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

  // Fill area path
  const areaPath = `${linePath} L ${points[points.length - 1].x} ${paddingTop + chartH} L ${points[0].x} ${paddingTop + chartH} Z`;

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      {/* Fill under line */}
      <path d={areaPath} fill={fillColor} />

      {/* Line */}
      <path d={linePath} fill="none" stroke={lineColor} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

      {/* Dots */}
      {showDots && points.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="4" fill={lineColor} stroke="var(--bg-surface)" strokeWidth="2" />
      ))}

      {/* X-axis labels */}
      {showLabels && points.map((p, i) => {
        // Only show some labels to avoid clutter
        if (data.length > 8 && i % 2 !== 0 && i !== data.length - 1) return null;
        return (
          <text key={`label-${i}`} x={p.x} y={height - 4} textAnchor="middle" fill="var(--text-disabled)" fontSize="10">
            {p.label}
          </text>
        );
      })}
    </svg>
  );
}
