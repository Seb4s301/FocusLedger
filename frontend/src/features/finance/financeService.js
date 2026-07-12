import { supabase } from '../../lib/supabase.js';

const MAX_CATEGORY_LENGTH = 100;
const MAX_DESCRIPTION_LENGTH = 500;

/**
 * Crea una nueva transacción financiera.
 * @param {{ amount: number, category: string, type: string, date: string, description?: string }} params
 * @returns {{ data: object|null, error: { message: string }|null }}
 */
export async function createTransaction({ amount, category, type, date, description }) {
  if (!amount || typeof amount !== 'number' || amount <= 0) {
    return { data: null, error: { message: 'El monto debe ser un número mayor a cero.' } };
  }
  if (amount > 999999999.99) {
    return { data: null, error: { message: 'El monto es demasiado grande.' } };
  }
  if (type !== 'income' && type !== 'expense') {
    return { data: null, error: { message: "El tipo debe ser 'income' o 'expense'." } };
  }
  if (!category || category.trim() === '') {
    return { data: null, error: { message: 'La categoría es requerida.' } };
  }
  if (category.trim().length > MAX_CATEGORY_LENGTH) {
    return { data: null, error: { message: `La categoría no puede exceder ${MAX_CATEGORY_LENGTH} caracteres.` } };
  }
  if (!date || date.trim() === '') {
    return { data: null, error: { message: 'La fecha es requerida.' } };
  }
  if (description && description.trim().length > MAX_DESCRIPTION_LENGTH) {
    return { data: null, error: { message: `La descripción no puede exceder ${MAX_DESCRIPTION_LENGTH} caracteres.` } };
  }

  const { data: { user } } = await supabase.auth.getUser();

  const payload = { amount, category: category.trim(), type, date, user_id: user.id };
  if (description && description.trim() !== '') {
    payload.description = description.trim();
  }

  const { data, error } = await supabase
    .from('transactions')
    .insert(payload)
    .select()
    .single();

  if (error) {
    return { data: null, error: { message: error.message } };
  }

  return { data, error: null };
}

/**
 * Lista las transacciones del usuario autenticado, ordenadas por fecha descendente.
 * @param {{ startDate?: string, endDate?: string }} [filters]
 * @returns {Promise<object[]>}
 */
export async function listTransactions({ startDate, endDate } = {}) {
  let query = supabase
    .from('transactions')
    .select('*')
    .order('date', { ascending: false });

  if (startDate) {
    query = query.gte('date', startDate);
  }
  if (endDate) {
    query = query.lte('date', endDate);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error al listar transacciones:', error.message);
    return [];
  }

  return data || [];
}

/**
 * Elimina una transacción por su ID.
 * @param {string} id
 * @returns {{ error: { message: string }|null }}
 */
export async function deleteTransaction(id) {
  const { error } = await supabase
    .from('transactions')
    .delete()
    .eq('id', id);

  if (error) {
    return { error: { message: error.message } };
  }

  return { error: null };
}
