/**
 * BarChart.jsx
 *
 * SVG vertical bar chart with grouped bars.
 * Used for comparing Income vs Expense by day or category.
 */

export default function BarChart({ data = [], width = 500, height = 220, barColors = ['#006400', '#922B3E'], barLabels = ['Ingresos', 'Egresos'] }) {
  const paddingLeft = 50;
  const paddingBottom = 40;
  const paddingTop = 20;
  const paddingRight = 16;
  const chartW = width - paddingLeft - paddingRight;
  const chartH = height - paddingBottom - paddingTop;

  if (data.length === 0) {
    return (
      <div style={{ width, height, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ color: 'var(--text-disabled)', fontSize: 14 }}>Sin datos para graficar</span>
      </div>
    );
  }

  // data format: [{ label, values: [val1, val2] }]
  const numBars = data[0]?.values?.length || 1;
  const allValues = data.flatMap(d => d.values || [0]);
  const maxVal = Math.max(...allValues, 1);
  const niceMax = Math.ceil(maxVal / 1000) * 1000 || maxVal + 1;

  const groupWidth = chartW / data.length;
  const barWidth = Math.min(groupWidth * 0.35, 28);
  const barGap = 4;

  // Y-axis ticks
  const tickCount = 4;
  const ticks = [];
  for (let i = 0; i <= tickCount; i++) {
    ticks.push(Math.round((niceMax / tickCount) * i));
  }

  function formatShort(n) {
    if (n >= 1000) return `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}k`;
    return String(n);
  }

  return (
    <div>
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        {/* Grid lines */}
        {ticks.map(tick => {
          const y = paddingTop + chartH - (tick / niceMax) * chartH;
          return (
            <g key={tick}>
              <line x1={paddingLeft} x2={width - paddingRight} y1={y} y2={y} stroke="var(--border-color)" strokeWidth="1" strokeDasharray="4 4" />
              <text x={paddingLeft - 8} y={y + 4} textAnchor="end" fill="var(--text-disabled)" fontSize="11">
                {formatShort(tick)}
              </text>
            </g>
          );
        })}

        {/* Bars */}
        {data.map((d, i) => {
          const groupX = paddingLeft + i * groupWidth + groupWidth / 2;

          return (
            <g key={d.label}>
              {d.values.map((val, vi) => {
                const barH = (val / niceMax) * chartH;
                const x = groupX - ((numBars * (barWidth + barGap)) / 2) + vi * (barWidth + barGap);
                const y = paddingTop + chartH - barH;
                return (
                  <g key={vi}>
                    <rect
                      x={x}
                      y={y}
                      width={barWidth}
                      height={barH}
                      rx={4}
                      fill={barColors[vi % barColors.length]}
                      opacity={0.9}
                      style={{ transition: 'height 0.5s ease, y 0.5s ease' }}
                    />
                    {/* Value label on top of bar */}
                    {val > 0 && (
                      <text x={x + barWidth / 2} y={y - 6} textAnchor="middle" fill="var(--text-secondary)" fontSize="10">
                        {formatShort(val)}
                      </text>
                    )}
                  </g>
                );
              })}
              {/* X-axis label */}
              <text x={groupX} y={height - paddingBottom + 18} textAnchor="middle" fill="var(--text-secondary)" fontSize="11">
                {d.label}
              </text>
            </g>
          );
        })}

        {/* X-axis line */}
        <line x1={paddingLeft} x2={width - paddingRight} y1={paddingTop + chartH} y2={paddingTop + chartH} stroke="var(--border-color)" strokeWidth="1" />
      </svg>

      {/* Legend */}
      <div style={{ display: 'flex', gap: 20, justifyContent: 'center', marginTop: 8 }}>
        {barLabels.map((lbl, i) => (
          <div key={lbl} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
            <span style={{ width: 12, height: 12, borderRadius: 3, background: barColors[i], display: 'inline-block' }} />
            <span style={{ color: 'var(--text-secondary)' }}>{lbl}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
