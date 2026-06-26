import { useState, useEffect } from 'react';
import { listTransactions } from '../features/finance/financeService.js';
import {
  calcBalance,
  calcTotalByType,
  calcByCategory,
  filterByDateRange,
} from '../features/finance/dashboardService.js';
import { fetchSuggestions } from '../features/finance/suggestionService.js';
import { calcFocusToday, calcFocusWeek } from '../features/focus/productivityService.js';
import CustomDatePicker from '../components/CustomDatePicker.jsx';
import DonutChart from '../components/charts/DonutChart.jsx';
import BarChart from '../components/charts/BarChart.jsx';
import ProgressRing from '../components/charts/ProgressRing.jsx';
import HorizontalBarChart from '../components/charts/HorizontalBarChart.jsx';
import MiniLineChart from '../components/charts/MiniLineChart.jsx';

function getMonthRange() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const startDate = `${year}-${month}-01`;
  const lastDay = new Date(year, now.getMonth() + 1, 0).getDate();
  const endDate = `${year}-${month}-${String(lastDay).padStart(2, '0')}`;
  return { startDate, endDate };
}

function formatCurrency(amount) {
  return Number(amount).toLocaleString('es-MX', {
    style: 'currency',
    currency: 'MXN',
  });
}

/** Group transactions by date → { date: { income, expense } } */
function groupByDate(transactions) {
  const map = {};
  transactions.forEach(t => {
    if (!map[t.date]) map[t.date] = { income: 0, expense: 0 };
    if (t.type === 'income') map[t.date].income += Number(t.amount);
    if (t.type === 'expense') map[t.date].expense += Number(t.amount);
  });
  return Object.entries(map)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, vals]) => ({
      label: date.slice(5), // "MM-DD"
      values: [vals.income, vals.expense],
    }));
}

/** Aggregate daily net balance for line chart */
function dailyBalanceTrend(transactions) {
  const map = {};
  transactions.forEach(t => {
    if (!map[t.date]) map[t.date] = 0;
    if (t.type === 'income') map[t.date] += Number(t.amount);
    if (t.type === 'expense') map[t.date] -= Number(t.amount);
  });
  let cumulative = 0;
  return Object.entries(map)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, net]) => {
      cumulative += net;
      return { label: date.slice(8), value: cumulative }; // "DD"
    });
}

function Dashboard() {
  const { startDate: defaultStart, endDate: defaultEnd } = getMonthRange();

  const [allTransactions, setAllTransactions] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [startDate, setStartDate] = useState(defaultStart);
  const [endDate, setEndDate] = useState(defaultEnd);
  const [suggestions, setSuggestions] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [focusToday, setFocusToday] = useState(0);
  const [focusWeek, setFocusWeek] = useState(0);

  useEffect(() => {
    loadData(defaultStart, defaultEnd);
  }, []);

  async function loadData(start, end) {
    setLoadingData(true);
    const data = await listTransactions({ startDate: start, endDate: end });
    setAllTransactions(data);
    setFiltered(data);
    fetchSuggestions(data).then(setSuggestions).catch(() => setSuggestions([]));
    calcFocusToday().then(setFocusToday).catch(() => setFocusToday(0));
    calcFocusWeek().then(setFocusWeek).catch(() => setFocusWeek(0));
    setLoadingData(false);
  }

  function handleFilter() {
    const result = filterByDateRange(allTransactions, startDate, endDate);
    setFiltered(result);
  }

  function handleThisMonth() {
    const { startDate: s, endDate: e } = getMonthRange();
    setStartDate(s);
    setEndDate(e);
    loadData(s, e);
  }

  // ── Computed metrics ──
  const balance = calcBalance(filtered);
  const totalIncome = calcTotalByType(filtered, 'income');
  const totalExpense = calcTotalByType(filtered, 'expense');
  const byCategory = calcByCategory(filtered);
  const recentTransactions = filtered.slice(0, 8);
  const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpense) / totalIncome) * 100 : 0;
  const transactionCount = filtered.length;

  // Chart data
  const donutData = byCategory.map(c => ({ label: c.category, value: c.total }));
  const barData = groupByDate(filtered);
  const trendData = dailyBalanceTrend(filtered);
  const horizontalData = byCategory.map(c => ({ label: c.category, value: c.total }));

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '24px 16px', fontFamily: 'sans-serif' }}>
      {/* ── Header ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 28, fontWeight: 800 }}>Dashboard</h1>
          <p style={{ margin: '4px 0 0', color: 'var(--text-secondary)', fontSize: 14 }}>Resumen financiero y productividad</p>
        </div>
      </div>

      {/* ── Filtro de fechas ── */}
      <section style={cardStyle}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'flex-end' }}>
          <CustomDatePicker label="Desde" value={startDate} onChange={setStartDate} />
          <CustomDatePicker label="Hasta" value={endDate} onChange={setEndDate} />
          <button onClick={handleFilter} style={btnPrimary}>Filtrar</button>
          <button onClick={handleThisMonth} style={btnSecondary}>Este mes</button>
        </div>
      </section>

      {loadingData ? (
        <div style={{ textAlign: 'center', padding: 60 }}>
          <div style={{ fontSize: 32, marginBottom: 12, animation: 'spin 1s linear infinite' }}>⏳</div>
          <p style={{ color: 'var(--text-secondary)' }}>Cargando datos...</p>
        </div>
      ) : (
        <>
          {/* ══════════ ROW 1: KPI Cards ══════════ */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
            {/* Balance */}
            <div style={kpiCard}>
              <div style={kpiIconWrap('#006400')}>💰</div>
              <div>
                <p style={kpiLabel}>Balance Total</p>
                <p style={{ ...kpiValue, color: balance >= 0 ? 'var(--color-primary)' : 'var(--color-accent)' }}>
                  {formatCurrency(balance)}
                </p>
              </div>
            </div>
            {/* Ingresos */}
            <div style={kpiCard}>
              <div style={kpiIconWrap('#2E7D32')}>📈</div>
              <div>
                <p style={kpiLabel}>Total Ingresos</p>
                <p style={{ ...kpiValue, color: 'var(--color-primary)' }}>{formatCurrency(totalIncome)}</p>
              </div>
            </div>
            {/* Egresos */}
            <div style={kpiCard}>
              <div style={kpiIconWrap('#922B3E')}>📉</div>
              <div>
                <p style={kpiLabel}>Total Egresos</p>
                <p style={{ ...kpiValue, color: 'var(--color-accent)' }}>{formatCurrency(totalExpense)}</p>
              </div>
            </div>
            {/* Transacciones */}
            <div style={kpiCard}>
              <div style={kpiIconWrap('#006400')}>📊</div>
              <div>
                <p style={kpiLabel}>Transacciones</p>
                <p style={{ ...kpiValue, color: 'var(--text-main)' }}>{transactionCount}</p>
              </div>
            </div>
          </div>

          {/* ══════════ ROW 2: Bar Chart + Donut ══════════ */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16, marginBottom: 24 }}>
            {/* Bar chart: Income vs Expense by day */}
            <div style={cardStyle}>
              <h3 style={sectionTitle}>Ingresos vs Egresos</h3>
              <BarChart data={barData} width={620} height={240} />
            </div>
            {/* Donut: Expense by category */}
            <div style={{ ...cardStyle, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <h3 style={sectionTitle}>Egresos por Categoría</h3>
              <DonutChart
                data={donutData}
                size={180}
                strokeWidth={24}
                centerValue={formatCurrency(totalExpense)}
                centerLabel="total"
              />
            </div>
          </div>

          {/* ══════════ ROW 3: Trend + Savings + Productivity ══════════ */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 24 }}>
            {/* Line chart: Balance trend */}
            <div style={cardStyle}>
              <h3 style={sectionTitle}>Tendencia de Balance</h3>
              <MiniLineChart data={trendData} width={320} height={140} />
            </div>
            {/* Savings rate ring */}
            <div style={{ ...cardStyle, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <h3 style={sectionTitle}>Tasa de Ahorro</h3>
              <ProgressRing
                value={Math.max(savingsRate, 0)}
                max={100}
                size={140}
                strokeWidth={14}
                color={savingsRate >= 20 ? '#006400' : '#922B3E'}
                label="del ingreso"
              />
            </div>
            {/* Productivity */}
            <div style={cardStyle}>
              <h3 style={sectionTitle}>Productividad</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20, marginTop: 8 }}>
                <div>
                  <p style={{ margin: '0 0 4px', color: 'var(--text-secondary)', fontSize: 12 }}>Tiempo focus hoy</p>
                  <p style={{ margin: 0, fontSize: 28, fontWeight: 800, color: 'var(--color-primary)' }}>{focusToday} <span style={{ fontSize: 14, fontWeight: 500 }}>min</span></p>
                </div>
                <div>
                  <p style={{ margin: '0 0 4px', color: 'var(--text-secondary)', fontSize: 12 }}>Focus esta semana</p>
                  <p style={{ margin: 0, fontSize: 28, fontWeight: 800, color: 'var(--text-main)' }}>{focusWeek} <span style={{ fontSize: 14, fontWeight: 500 }}>min</span></p>
                </div>
              </div>
            </div>
          </div>

          {/* ══════════ ROW 4: Category Bars + Recent Transactions ══════════ */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: 16, marginBottom: 24 }}>
            {/* Horizontal bar chart */}
            <div style={cardStyle}>
              <h3 style={sectionTitle}>Desglose por Categoría</h3>
              <HorizontalBarChart data={horizontalData} formatValue={formatCurrency} />
            </div>
            {/* Recent transactions */}
            <div style={cardStyle}>
              <h3 style={sectionTitle}>Transacciones Recientes</h3>
              {recentTransactions.length === 0 ? (
                <p style={{ color: 'var(--text-disabled)', fontSize: 14 }}>No hay transacciones en el período.</p>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                    <thead>
                      <tr>
                        <th style={thStyle}>Fecha</th>
                        <th style={thStyle}>Categoría</th>
                        <th style={thStyle}>Tipo</th>
                        <th style={{ ...thStyle, textAlign: 'right' }}>Monto</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentTransactions.map(t => (
                        <tr key={t.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                          <td style={tdStyle}>{t.date}</td>
                          <td style={tdStyle}>{t.category}</td>
                          <td style={tdStyle}>
                            <span style={t.type === 'income' ? badgeIncome : badgeExpense}>
                              {t.type === 'income' ? 'Ingreso' : 'Egreso'}
                            </span>
                          </td>
                          <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 600, color: t.type === 'income' ? 'var(--color-primary)' : 'var(--color-accent)' }}>
                            {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* ══════════ ROW 5: Suggestions ══════════ */}
          {suggestions.length > 0 && (
            <div style={cardStyle}>
              <h3 style={sectionTitle}>💡 Sugerencias Financieras</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {suggestions.map((s, i) => (
                  <div
                    key={i}
                    style={{
                      background: 'rgba(0, 100, 0, 0.08)',
                      border: '1px solid rgba(0, 100, 0, 0.25)',
                      borderRadius: 8,
                      padding: '12px 16px',
                      fontSize: 14,
                      color: 'var(--text-main)',
                      lineHeight: 1.5,
                    }}
                  >
                    {typeof s === 'string' ? s : s.message || s.text || JSON.stringify(s)}
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ── Style constants ──

const cardStyle = {
  background: 'var(--bg-surface)',
  borderRadius: 14,
  padding: '20px 24px',
  border: '1px solid var(--border-color)',
};

const sectionTitle = {
  margin: '0 0 16px',
  fontSize: 15,
  fontWeight: 700,
  color: 'var(--text-main)',
  letterSpacing: '0.02em',
};

const kpiCard = {
  background: 'var(--bg-surface)',
  borderRadius: 14,
  padding: '18px 20px',
  border: '1px solid var(--border-color)',
  display: 'flex',
  alignItems: 'center',
  gap: 14,
};

const kpiLabel = {
  margin: '0 0 4px',
  color: 'var(--text-secondary)',
  fontSize: 12,
  fontWeight: 500,
};

const kpiValue = {
  margin: 0,
  fontSize: 22,
  fontWeight: 800,
  lineHeight: 1.1,
};

function kpiIconWrap(bgColor) {
  return {
    width: 44,
    height: 44,
    borderRadius: 12,
    background: `${bgColor}22`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 22,
    flexShrink: 0,
  };
}

const btnPrimary = {
  background: 'var(--color-primary)',
  color: '#fff',
  border: 'none',
  borderRadius: 8,
  padding: '10px 24px',
  cursor: 'pointer',
  fontWeight: 600,
  fontSize: 14,
};

const btnSecondary = {
  background: 'var(--bg-secondary)',
  color: 'var(--text-main)',
  border: '1px solid var(--border-color)',
  borderRadius: 8,
  padding: '10px 24px',
  cursor: 'pointer',
  fontWeight: 500,
  fontSize: 14,
};

const thStyle = {
  padding: '8px 10px',
  textAlign: 'left',
  fontWeight: 600,
  borderBottom: '2px solid var(--border-color)',
  color: 'var(--text-secondary)',
  fontSize: 12,
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
};

const tdStyle = {
  padding: '8px 10px',
  verticalAlign: 'middle',
};

const badgeIncome = {
  background: 'rgba(0, 100, 0, 0.15)',
  color: 'var(--color-primary)',
  borderRadius: 12,
  padding: '2px 10px',
  fontSize: 11,
  fontWeight: 600,
};

const badgeExpense = {
  background: 'var(--color-shadow)',
  color: 'var(--color-accent)',
  borderRadius: 12,
  padding: '2px 10px',
  fontSize: 11,
  fontWeight: 600,
};

export default Dashboard;
