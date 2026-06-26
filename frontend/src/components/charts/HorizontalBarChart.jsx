/**
 * HorizontalBarChart.jsx
 *
 * Horizontal bar chart for category breakdowns.
 * Shows labels, filled bars with percentages.
 */

const BAR_COLORS = [
  '#006400', '#922B3E', '#2E7D32', '#6E1F2D', '#388E3C',
  '#A94442', '#43A047', '#C0392B', '#66BB6A', '#E74C3C',
];

export default function HorizontalBarChart({ data = [], formatValue = (v) => v }) {
  const maxVal = Math.max(...data.map(d => d.value), 1);

  if (data.length === 0) {
    return <p style={{ color: 'var(--text-disabled)', fontSize: 14 }}>Sin datos</p>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {data.map((item, i) => {
        const pct = (item.value / maxVal) * 100;
        const color = BAR_COLORS[i % BAR_COLORS.length];
        return (
          <div key={item.label}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-main)' }}>{item.label}</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>{formatValue(item.value)}</span>
            </div>
            <div style={{ height: 8, borderRadius: 4, background: 'var(--bg-primary)', overflow: 'hidden' }}>
              <div
                style={{
                  height: '100%',
                  width: `${pct}%`,
                  background: color,
                  borderRadius: 4,
                  transition: 'width 0.6s ease',
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
