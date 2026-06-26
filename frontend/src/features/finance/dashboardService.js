/**
 * Funciones puras de cálculo para el dashboard financiero.
 * No realizan llamadas a Supabase — reciben arrays de transacciones.
 */

/**
 * Calcula el balance total: suma de ingresos menos suma de egresos.
 * @param {object[]} transactions
 * @returns {number}
 */
export function calcBalance(transactions) {
  return transactions.reduce((acc, t) => {
    if (t.type === 'income') return acc + Number(t.amount);
    if (t.type === 'expense') return acc - Number(t.amount);
    return acc;
  }, 0);
}

/**
 * Calcula el total de transacciones de un tipo específico.
 * @param {object[]} transactions
 * @param {'income'|'expense'} type
 * @returns {number}
 */
export function calcTotalByType(transactions, type) {
  return transactions
    .filter(t => t.type === type)
    .reduce((acc, t) => acc + Number(t.amount), 0);
}

/**
 * Agrupa los egresos por categoría y retorna el total por categoría,
 * ordenado de mayor a menor.
 * @param {object[]} transactions
 * @returns {{ category: string, total: number }[]}
 */
export function calcByCategory(transactions) {
  const expenses = transactions.filter(t => t.type === 'expense');

  const grouped = expenses.reduce((acc, t) => {
    const cat = t.category;
    acc[cat] = (acc[cat] || 0) + Number(t.amount);
    return acc;
  }, {});

  return Object.entries(grouped)
    .map(([category, total]) => ({ category, total }))
    .sort((a, b) => b.total - a.total);
}

/**
 * Filtra transacciones dentro de un rango de fechas (inclusive en ambos extremos).
 * @param {object[]} transactions
 * @param {string} startDate - Fecha inicio en formato 'YYYY-MM-DD'
 * @param {string} endDate   - Fecha fin en formato 'YYYY-MM-DD'
 * @returns {object[]}
 */
export function filterByDateRange(transactions, startDate, endDate) {
  return transactions.filter(t => {
    const date = t.date;
    return date >= startDate && date <= endDate;
  });
}
