import { supabase } from '../../lib/supabase.js';

/**
 * productivityService.js
 *
 * Calcula resumen de productividad (tiempo focus) para el Dashboard.
 *
 * Requisitos: 8.4
 */

/**
 * Calcula el tiempo total de focus del día de hoy.
 * @returns {Promise<number>} Total en minutos
 */
export async function calcFocusToday() {
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

  const { data, error } = await supabase
    .from('time_logs')
    .select('duration_min')
    .gte('logged_at', `${today}T00:00:00`)
    .lte('logged_at', `${today}T23:59:59`);

  if (error || !data) {
    console.error('Error al calcular focus de hoy:', error?.message);
    return 0;
  }

  return data.reduce((sum, log) => sum + (log.duration_min || 0), 0);
}

/**
 * Calcula el tiempo total de focus de la semana actual (lunes a domingo).
 * @returns {Promise<number>} Total en minutos
 */
export async function calcFocusWeek() {
  const now = new Date();
  // Obtener el lunes de esta semana
  const dayOfWeek = now.getDay(); // 0=domingo, 1=lunes, ...
  const diffToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  const monday = new Date(now);
  monday.setDate(now.getDate() - diffToMonday);
  monday.setHours(0, 0, 0, 0);

  const startOfWeek = monday.toISOString();

  const { data, error } = await supabase
    .from('time_logs')
    .select('duration_min')
    .gte('logged_at', startOfWeek);

  if (error || !data) {
    console.error('Error al calcular focus de la semana:', error?.message);
    return 0;
  }

  return data.reduce((sum, log) => sum + (log.duration_min || 0), 0);
}
