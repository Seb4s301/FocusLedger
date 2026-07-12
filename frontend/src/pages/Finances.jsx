import { useState, useEffect } from 'react';
import { createTransaction, listTransactions, deleteTransaction } from '../features/finance/financeService.js';

const INCOME_CATEGORIES = [
  'Salario',
  'Freelance',
  'Inversiones',
  'Ventas',
  'Reembolsos',
  'Otros ingresos',
];

const EXPENSE_CATEGORIES = [
  'Comida',
  'Transporte',
  'Salud',
  'Hogar',
  'Entretenimiento',
  'Servicios',
  'Educación',
  'Ropa',
  'Suscripciones',
  'Otros gastos',
];

function getTodayDate() {
  return new Date().toISOString().split('T')[0];
}

const initialForm = {
  amount: '',
  category: INCOME_CATEGORIES[0],
  type: 'income',
  date: getTodayDate(),
  description: '',
};

function Finances() {
  const [form, setForm] = useState(initialForm);
  const [transactions, setTransactions] = useState([]);
  const [formError, setFormError] = useState('');
  const [loading, setLoading] = useState(false);

  // Cargar transacciones al montar
  useEffect(() => {
    loadTransactions();
  }, []);

  async function loadTransactions() {
    const data = await listTransactions();
    setTransactions(data);
  }

  function handleChange(e) {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setFormError('');
    setLoading(true);

    const amount = parseFloat(form.amount);
    const { data, error } = await createTransaction({
      amount,
      category: form.category,
      type: form.type,
      date: form.date,
      description: form.description,
    });

    setLoading(false);

    if (error) {
      setFormError(error.message);
      return;
    }

    // Limpiar formulario y recargar lista
    setForm({ ...initialForm, date: getTodayDate() });
    await loadTransactions();
  }

  async function handleDelete(id) {
    const confirmed = window.confirm('¿Estás seguro de que deseas eliminar esta transacción?');
    if (!confirmed) return;

    const { error } = await deleteTransaction(id);
    if (error) {
      alert(`Error al eliminar: ${error.message}`);
      return;
    }
    await loadTransactions();
  }

  function formatAmount(amount, type) {
    const formatted = Number(amount).toLocaleString('es-MX', {
      style: 'currency',
      currency: 'MXN',
    });
    return type === 'income' ? `+${formatted}` : `-${formatted}`;
  }

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '24px 16px', fontFamily: 'sans-serif' }}>
      <h1 style={{ marginBottom: 24 }}>Finanzas</h1>

      {/* Formulario de nueva transacción */}
      <section style={{ background: 'var(--bg-surface)', borderRadius: 12, padding: 24, marginBottom: 32, border: '1px solid var(--border-color)' }}>
        <h2 style={{ marginTop: 0, marginBottom: 20, fontSize: 18, fontWeight: 600 }}>Nueva transacción</h2>

        <form onSubmit={handleSubmit}>
          {formError && (
            <div
              role="alert"
              style={{ color: 'var(--color-accent)', background: 'var(--color-shadow)', border: '1px solid var(--color-accent)', borderRadius: 6, padding: '8px 12px', marginBottom: 16, fontSize: 14 }}
            >
              {formError}
            </div>
          )}

          {/* Switch Ingreso / Egreso */}
          <div style={{ marginBottom: 20 }}>
            <div
              onClick={() => setForm(prev => {
                const newType = prev.type === 'income' ? 'expense' : 'income';
                const newCategories = newType === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
                return { ...prev, type: newType, category: newCategories[0] };
              })}
              style={{
                display: 'inline-flex',
                background: 'var(--bg-secondary)',
                borderRadius: 8,
                padding: 3,
                cursor: 'pointer',
                border: '1px solid var(--border-color)',
              }}
            >
              <span style={{
                padding: '6px 20px',
                borderRadius: 6,
                fontWeight: 600,
                fontSize: 14,
                background: form.type === 'income' ? 'var(--color-primary)' : 'transparent',
                color: form.type === 'income' ? '#fff' : 'var(--text-secondary)',
                transition: 'all 0.15s',
              }}>
                Ingreso
              </span>
              <span style={{
                padding: '6px 20px',
                borderRadius: 6,
                fontWeight: 600,
                fontSize: 14,
                background: form.type === 'expense' ? 'var(--color-accent)' : 'transparent',
                color: form.type === 'expense' ? '#fff' : 'var(--text-secondary)',
                transition: 'all 0.15s',
              }}>
                Egreso
              </span>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 16 }}>
            {/* Monto */}
            <div>
              <label htmlFor="amount" style={{ display: 'block', marginBottom: 4, fontWeight: 500, fontSize: 13, color: 'var(--text-secondary)' }}>
                Monto *
              </label>
              <input
                id="amount"
                name="amount"
                type="number"
                min="0.01"
                step="0.01"
                value={form.amount}
                onChange={handleChange}
                required
                style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-main)', boxSizing: 'border-box', fontSize: 14 }}
                placeholder="0.00"
              />
            </div>

            {/* Categoría */}
            <div>
              <label htmlFor="category" style={{ display: 'block', marginBottom: 4, fontWeight: 500, fontSize: 13, color: 'var(--text-secondary)' }}>
                Categoría *
              </label>
              <select
                id="category"
                name="category"
                value={form.category}
                onChange={handleChange}
                required
                style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-main)', boxSizing: 'border-box', fontSize: 14 }}
              >
                {(form.type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES).map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            {/* Fecha */}
            <div>
              <label htmlFor="date" style={{ display: 'block', marginBottom: 4, fontWeight: 500, fontSize: 13, color: 'var(--text-secondary)' }}>
                Fecha *
              </label>
              <input
                id="date"
                name="date"
                type="date"
                value={form.date}
                onChange={handleChange}
                required
                style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-main)', boxSizing: 'border-box', fontSize: 14 }}
              />
            </div>

            {/* Descripción */}
            <div>
              <label htmlFor="description" style={{ display: 'block', marginBottom: 4, fontWeight: 500, fontSize: 13, color: 'var(--text-secondary)' }}>
                Descripción (opcional)
              </label>
              <input
                id="description"
                name="description"
                type="text"
                value={form.description}
                onChange={handleChange}
                style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-main)', boxSizing: 'border-box', fontSize: 14 }}
                placeholder="Descripción opcional"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              background: form.type === 'income' ? 'var(--color-primary)' : 'var(--color-accent)',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              padding: '10px 24px',
              fontSize: 14,
              fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
              transition: 'background 0.15s',
            }}
          >
            {loading ? 'Guardando...' : `Agregar ${form.type === 'income' ? 'ingreso' : 'egreso'}`}
          </button>
        </form>
      </section>

      {/* Lista de transacciones */}
      <section>
        <h2 style={{ marginBottom: 16, fontSize: 18 }}>Transacciones</h2>

        {transactions.length === 0 ? (
          <p style={{ color: 'var(--text-secondary)' }}>No hay transacciones registradas.</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
              <thead>
                <tr style={{ background: 'var(--bg-secondary)' }}>
                  <th style={thStyle}>Fecha</th>
                  <th style={thStyle}>Categoría</th>
                  <th style={thStyle}>Tipo</th>
                  <th style={{ ...thStyle, textAlign: 'right' }}>Monto</th>
                  <th style={thStyle}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map(t => (
                  <tr key={t.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={tdStyle}>{t.date}</td>
                    <td style={tdStyle}>{t.category}</td>
                    <td style={tdStyle}>
                      <span style={t.type === 'income' ? badgeIncome : badgeExpense}>
                        {t.type === 'income' ? 'Ingreso' : 'Egreso'}
                      </span>
                    </td>
                    <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 500, color: t.type === 'income' ? 'var(--color-primary)' : 'var(--color-accent)' }}>
                      {formatAmount(t.amount, t.type)}
                    </td>
                    <td style={tdStyle}>
                      <button
                        onClick={() => handleDelete(t.id)}
                        style={{
                          background: 'var(--color-shadow)',
                          color: 'var(--color-accent)',
                          border: '1px solid var(--color-accent)',
                          borderRadius: 4,
                          padding: '4px 12px',
                          cursor: 'pointer',
                          fontSize: 13,
                        }}
                      >
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

const thStyle = {
  padding: '10px 12px',
  textAlign: 'left',
  fontWeight: 600,
  borderBottom: '2px solid var(--border-color)',
};

const tdStyle = {
  padding: '10px 12px',
  verticalAlign: 'middle',
};

const badgeIncome = {
  background: 'rgba(0, 100, 0, 0.15)',
  color: 'var(--color-primary)',
  borderRadius: 12,
  padding: '2px 10px',
  fontSize: 12,
  fontWeight: 600,
};

const badgeExpense = {
  background: 'var(--color-shadow)',
  color: 'var(--color-accent)',
  borderRadius: 12,
  padding: '2px 10px',
  fontSize: 12,
  fontWeight: 600,
};

export default Finances;
